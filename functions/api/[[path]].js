// OrionHQ API for Cloudflare Pages Functions: Google OAuth + D1.
// Bindings: DB (D1). Secrets: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, SESSION_SECRET.
// Optional var: ADMIN_EMAIL (defaults to azzamunza@gmail.com).

const SESSION_COOKIE = 'orionhq_session';
const STATE_COOKIE = 'orionhq_oauth_state';
const SESSION_TTL = 60 * 60 * 24 * 7;
const enc = new TextEncoder();

const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...headers }
  });

const b64u = (buf) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

async function hmacKey(secret) {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

async function sign(payload, secret) {
  const body = b64u(enc.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(body));
  return `${body}.${b64u(sig)}`;
}

async function verify(token, secret) {
  const [body, sig] = (token || '').split('.');
  if (!body || !sig) return null;
  try {
    const ok = await crypto.subtle.verify('HMAC', await hmacKey(secret), unb64u(sig), enc.encode(body));
    if (!ok) return null;
    const payload = JSON.parse(new TextDecoder().decode(unb64u(body)));
    return payload.exp > Date.now() / 1000 ? payload : null;
  } catch {
    return null;
  }
}

function getCookie(request, name) {
  const match = (request.headers.get('cookie') || '').split(/;\s*/).find((c) => c.startsWith(`${name}=`));
  try {
    return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
  } catch {
    return null;
  }
}

const cookie = (name, value, maxAge) =>
  `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;

const getUser = (request, env) => verify(getCookie(request, SESSION_COOKIE), env.SESSION_SECRET);

const isAdmin = (user, env) =>
  !!user && user.email_verified &&
  String(user.email || '').toLowerCase() === String(env.ADMIN_EMAIL || 'azzamunza@gmail.com').toLowerCase();

function login(request, env) {
  if (!env.GOOGLE_CLIENT_ID) return json({ error: 'Google sign-in is not configured' }, 503);
  const url = new URL(request.url);
  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: `${url.origin}/api/auth/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account'
  });
  return new Response(null, {
    status: 302,
    headers: {
      location: `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
      'set-cookie': cookie(STATE_COOKIE, state, 600)
    }
  });
}

async function callback(request, env) {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.SESSION_SECRET) {
    return json({ error: 'Google sign-in is not fully configured' }, 503);
  }
  const url = new URL(request.url);
  const state = url.searchParams.get('state');
  const code = url.searchParams.get('code');
  if (!code || !state || state !== getCookie(request, STATE_COOKIE)) {
    return json({ error: 'Invalid OAuth state' }, 400);
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${url.origin}/api/auth/callback`,
      grant_type: 'authorization_code'
    })
  });
  if (!tokenRes.ok) return json({ error: 'Token exchange failed' }, 401);
  const { access_token } = await tokenRes.json();

  const infoRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { authorization: `Bearer ${access_token}` }
  });
  if (!infoRes.ok) return json({ error: 'Could not fetch profile' }, 401);
  const info = await infoRes.json();

  const session = await sign({
    sub: info.sub,
    email: info.email,
    email_verified: !!info.email_verified,
    name: info.name || info.email,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL
  }, env.SESSION_SECRET);

  const headers = new Headers({ location: '/' });
  headers.append('set-cookie', cookie(SESSION_COOKIE, session, SESSION_TTL));
  headers.append('set-cookie', cookie(STATE_COOKIE, '', 0));
  return new Response(null, { status: 302, headers });
}

export async function onRequest({ request, env, params }) {
  const route = `${request.method} /${[].concat(params.path || []).join('/')}`;
  if (route === 'POST /auth/logout') {
    return json({ ok: true }, 200, { 'set-cookie': cookie(SESSION_COOKIE, '', 0) });
  }
  if (route === 'GET /auth/login' && !env.GOOGLE_CLIENT_ID) {
    return json({ error: 'Google sign-in is not configured' }, 503);
  }
  if (route === 'GET /auth/callback' && (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.SESSION_SECRET)) {
    return json({ error: 'Google sign-in is not fully configured' }, 503);
  }
  if (!env.SESSION_SECRET) return json({ error: 'Session signing is not configured' }, 503);
  const user = await getUser(request, env);

  try {
    if (route === 'GET /auth/login') return login(request, env);
    if (route === 'GET /auth/callback') return await callback(request, env);
    if (route === 'POST /auth/logout') {
      return json({ ok: true }, 200, { 'set-cookie': cookie(SESSION_COOKIE, '', 0) });
    }
    if (route === 'GET /session') {
      return json({
        user: user && { id: user.sub, email: user.email, name: user.name, isAdmin: isAdmin(user, env) }
      });
    }

    if (!user) return json({ error: 'Unauthorized' }, 401);

    if (route === 'GET /pages') {
      const { results } = await env.DB.prepare(
        `select slug, title, icon, kind from OrionHQ_pages
         where is_published = 1 or created_by = ?1 order by sort_order`
      ).bind(user.sub).all();
      return json({ pages: results });
    }

    if (route === 'POST /pages') {
      if (!isAdmin(user, env)) return json({ error: 'Forbidden' }, 403);
      const body = await request.json();
      const title = String(body.title || '').trim().slice(0, 100);
      const slug = String(body.slug || '').replace(/^\/+/, '').slice(0, 80);
      const kind = ['dashboard', 'link', 'income'].includes(body.kind) ? body.kind : 'link';
      const icon = String(body.icon || '✦').slice(0, 8) || '✦';
      if (!title || !/^[a-z0-9-]+$/.test(slug)) return json({ error: 'Invalid page' }, 400);
      await env.DB.prepare(
        `insert into OrionHQ_pages (slug, title, icon, kind, sort_order, created_by)
         values (?1, ?2, ?3, ?4, 999, ?5)`
      ).bind(`/${slug}`, title, icon, kind, user.sub).run();
      return json({ page: { slug: `/${slug}`, title, icon, kind } }, 201);
    }

    if (route === 'GET /settings') {
      const row = await env.DB.prepare('select * from OrionHQ_settings where user_id = ?1').bind(user.sub).first();
      return json({ settings: row && { ...row, sidebar_pinned: !!row.sidebar_pinned } });
    }

    if (route === 'PUT /settings') {
      const body = await request.json();
      await env.DB.prepare(
        `insert into OrionHQ_settings (user_id, sidebar_pinned, theme, updated_at)
         values (?1, ?2, ?3, strftime('%Y-%m-%dT%H:%M:%fZ','now'))
         on conflict(user_id) do update set sidebar_pinned = ?2, theme = ?3, updated_at = excluded.updated_at`
      ).bind(user.sub, body.sidebar_pinned ? 1 : 0, body.theme === 'light' ? 'light' : 'dark').run();
      return json({ ok: true });
    }

    return json({ error: 'Not found' }, 404);
  } catch (err) {
    console.error(err);
    const conflict = /UNIQUE/i.test(String(err));
    return json({ error: conflict ? 'Already exists' : 'Server error' }, conflict ? 409 : 500);
  }
}
