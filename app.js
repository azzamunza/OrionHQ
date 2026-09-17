const SUPABASE_URL = 'https://nrwckhyegdkcbfbiitxz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2NraHllZ2RrY2JmYmlpdHh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMzYxMzcsImV4cCI6MjA4NzcxMjEzN30.j_4uC5H9Q2VXnHkDUDt5v8m61A6nMrrbTbs3vHwL9H4';
const ADMIN_EMAIL = 'azzamunza@gmail.com';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const state = {
  session: null,
  pages: [],
  pinned: localStorage.getItem('orionhq_sidebar_pinned') === 'true'
};

const defaultPages = [
  { slug: '/', title: 'Dashboard', icon: '⌂', kind: 'dashboard' },
  { slug: '/income-engine', title: 'Income engine', icon: '↗', kind: 'income' },
  { slug: '/focus-board', title: 'Focus board', icon: '◎', kind: 'link' }
];

const $ = (selector) => document.querySelector(selector);

function showView(target) {
  const authView = $('#auth-view');
  const appView = $('#app-view');
  authView.hidden = target !== 'auth';
  appView.hidden = target !== 'app';
}

function isAdmin(session) {
  return !!session && (session.user.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

function setSidebarState() {
  const sidebar = $('#sidebar');
  if (!sidebar) return;
  sidebar.classList.toggle('pinned', state.pinned);
  if (state.pinned) {
    sidebar.classList.remove('open');
  }
}

function renderNav() {
  const nav = $('#nav-list');
  if (!nav) return;

  const pages = [...defaultPages, ...state.pages].filter(Boolean);
  const navItems = pages.map((page) => {
    const href = page.slug.startsWith('/') ? page.slug : `/${page.slug}`;
    return `
      <a class="nav-item" href="#${href}">
        <span class="nav-icon">${page.icon || '✦'}</span>
        <span class="nav-label">${page.title}</span>
      </a>
    `;
  }).join('');

  nav.innerHTML = `
    <div class="nav-item"><span class="nav-icon">◎</span><span class="nav-label">Workspace</span></div>
    ${navItems}
    <div class="nav-item"><span class="nav-icon">⚙</span><span class="nav-label">Settings</span></div>
  `;

  document.querySelectorAll('.nav-item').forEach((el) => {
    const href = el.getAttribute('href');
    if (href) {
      const route = location.hash || '#/';
      el.classList.toggle('active', route === href || route === href.replace('#', ''));
    }
  });
}

function renderDashboard() {
  $('#page-content').innerHTML = `
    <section class="hero">
      <div>
        <p class="eyebrow">THURSDAY · 17 SEPTEMBER</p>
        <h1>Good morning, <span>${state.session?.user?.user_metadata?.full_name || 'Azzam'}</span>.</h1>
      </div>
      <div class="now-label">LOCAL TIME · ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
    </section>

    <div class="grid">
      <article class="card stat-card">
        <span class="card-label">ACTIVE VENTURES</span>
        <div class="stat-value">04</div>
        <div class="trend">↑ 2 this month</div>
      </article>
      <article class="card stat-card">
        <span class="card-label">PORTFOLIO MRR</span>
        <div class="stat-value">$0</div>
        <div class="trend">Baseline ready</div>
      </article>
      <article class="card stat-card">
        <span class="card-label">OPEN LOOPS</span>
        <div class="stat-value">12</div>
        <div class="trend">3 due today</div>
      </article>
      <article class="card stat-card">
        <span class="card-label">SYSTEM HEALTH</span>
        <div class="stat-value">98%</div>
        <div class="trend">All systems nominal</div>
      </article>

      <article class="card wide-card">
        <div class="card-head">
          <div>
            <span class="card-label">QUICK LAUNCH</span>
            <h3>Go somewhere useful</h3>
          </div>
          <span class="pill">SHORTCUTS</span>
        </div>
        <div class="launch-list">
          <a class="launch-link" href="https://github.com" target="_blank" rel="noreferrer">GitHub <small>↗</small></a>
          <a class="launch-link" href="#/income-engine">Income engine <small>Explore →</small></a>
          <a class="launch-link" href="#/focus-board">Focus board <small>Open →</small></a>
        </div>
      </article>

      <article class="card wide-card">
        <div class="card-head">
          <div>
            <span class="card-label">NEXT UP</span>
            <h3>Build momentum</h3>
          </div>
          <span class="pill">TODAY</span>
        </div>
        <div class="stage-list">
          <div class="stage-item">
            <span class="stage-number">01</span>
            <div class="stage-copy">
              <h4>Choose one valuable problem</h4>
              <p>Small, focused, and worth solving.</p>
            </div>
          </div>
          <div class="stage-item">
            <span class="stage-number">02</span>
            <div class="stage-copy">
              <h4>Ship the smallest useful version</h4>
              <p>Progress compounds when it is visible.</p>
            </div>
          </div>
        </div>
      </article>
    </div>
  `;
}

function renderIncomeEngine() {
  $('#page-content').innerHTML = `
    <section class="income-header">
      <div>
        <p class="eyebrow">INCOME ENGINE · PORTFOLIO</p>
        <h1>Build things that <span class="accent">earn.</span></h1>
      </div>
      <span class="pill">4 PHASES</span>
    </section>

    <div class="grid">
      <article class="card stat-card">
        <span class="card-label">PORTFOLIO MRR</span>
        <div class="stat-value">$0</div>
        <div class="trend">Set your baseline</div>
      </article>
      <article class="card stat-card">
        <span class="card-label">VENTURES</span>
        <div class="stat-value">00</div>
        <div class="trend">Add your first one</div>
      </article>
      <article class="card stat-card">
        <span class="card-label">AUTOMATIONS</span>
        <div class="stat-value">00</div>
        <div class="trend">Ready to connect</div>
      </article>
      <article class="card stat-card">
        <span class="card-label">RUNWAY</span>
        <div class="stat-value">∞</div>
        <div class="trend">Lean by design</div>
      </article>

      <article class="card wide-card">
        <div class="card-head">
          <div>
            <span class="card-label">IMPLEMENTATION ROADMAP</span>
            <h3>From signal to scale</h3>
          </div>
        </div>
        <div class="stage-list">
          <div class="stage-item">
            <span class="stage-number">01</span>
            <div class="stage-copy">
              <h4>Validation & market audit</h4>
              <p>Demand, pricing, competitors, and capital velocity.</p>
            </div>
          </div>
          <div class="stage-item">
            <span class="stage-number">02</span>
            <div class="stage-copy">
              <h4>Architecture & prototype</h4>
              <p>Flows, databases, logic, and creative assets.</p>
            </div>
          </div>
          <div class="stage-item">
            <span class="stage-number">03</span>
            <div class="stage-copy">
              <h4>Fulfillment automation</h4>
              <p>Payments, delivery, and syndication engines.</p>
            </div>
          </div>
          <div class="stage-item">
            <span class="stage-number">04</span>
            <div class="stage-copy">
              <h4>Scale & passive upkeep</h4>
              <p>Programmatic SEO and low-touch reporting.</p>
            </div>
          </div>
        </div>
      </article>

      <article class="card wide-card">
        <div class="card-head">
          <div>
            <span class="card-label">VENTURE WORKSPACES</span>
            <h3>Identical structure, clearer execution</h3>
          </div>
        </div>
        <p class="auth-copy" style="margin:0;max-width:100%;color:var(--muted);">Each venture uses a standardized structure: overview, stages, checklists, notes, links, automations, and financials.</p>
      </article>
    </div>
  `;
}

function renderGenericPage(title, icon) {
  $('#page-content').innerHTML = `
    <section class="empty-state">
      <div>
        <div class="brand-mark" style="margin-bottom:1rem;">${icon || '✦'}</div>
        <p class="eyebrow">ORIONHQ PAGE</p>
        <h1>${title}</h1>
        <p>This workspace is ready for your next useful idea.</p>
      </div>
    </section>
  `;
}

function updateBreadcrumb() {
  const route = (location.hash || '#/').replace('#', '') || '/';
  const routeTitle = route === '/' ? 'Dashboard' : route === '/income-engine' ? 'Income engine' : route === '/focus-board' ? 'Focus board' : 'Page';
  $('#breadcrumb-current').textContent = routeTitle;
}

function renderRoute() {
  updateBreadcrumb();
  const route = (location.hash || '#/').replace('#', '') || '/';
  const page = state.pages.find((entry) => entry.slug === route);

  if (route === '/') return renderDashboard();
  if (route === '/income-engine') return renderIncomeEngine();
  if (page) return renderGenericPage(page.title, page.icon);
  return renderGenericPage('Untitled page', '✦');
}

async function loadPages() {
  if (!supabaseClient) return;
  try {
    const { data, error } = await supabaseClient
      .from('"OrionHQ_pages"')
      .select('slug, title, icon, kind')
      .eq('is_published', true)
      .order('sort_order', { ascending: true });

    if (!error && Array.isArray(data)) {
      state.pages = data.map((page) => ({
        slug: page.slug,
        title: page.title,
        icon: page.icon || '✦',
        kind: page.kind || 'link'
      }));
    }
  } catch (err) {
    console.warn('Could not load OrionHQ pages', err);
  }

  renderNav();
  renderRoute();
}

async function loadSettings() {
  if (!state.session) return;
  try {
    const { data, error } = await supabaseClient
      .from('"OrionHQ_settings"')
      .select('*')
      .eq('user_id', state.session.user.id)
      .maybeSingle();

    if (!error && data) {
      state.pinned = !!data.sidebar_pinned;
      localStorage.setItem('orionhq_sidebar_pinned', String(state.pinned));
      setSidebarState();
    }
  } catch (err) {
    console.warn('Could not load OrionHQ settings', err);
  }
}

async function saveSettings() {
  if (!state.session) return;
  try {
    await supabaseClient.from('"OrionHQ_settings"').upsert({
      user_id: state.session.user.id,
      sidebar_pinned: state.pinned,
      theme: 'dark',
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });
  } catch (err) {
    console.warn('Could not save OrionHQ settings', err);
  }
}

async function login() {
  const button = $('#login-button');
  if (!button) return;

  button.disabled = true;
  $('#auth-status').textContent = 'Connecting to Google…';

  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + window.location.pathname
    }
  });

  if (error) {
    $('#auth-status').textContent = error.message;
    button.disabled = false;
  }
}

async function logout() {
  await supabaseClient.auth.signOut();
}

function syncUser(session) {
  state.session = session;
  if (!session) {
    showView('auth');
    return;
  }

  const email = session.user?.email || 'user';
  const fullname = session.user?.user_metadata?.full_name || email.split('@')[0] || 'User';
  $('#profile-name').textContent = fullname;
  $('#user-avatar').textContent = (fullname || 'U').charAt(0).toUpperCase();
  $('#developer-button').hidden = !isAdmin(session);
  showView('app');
  renderNav();
  renderRoute();
}

async function handleAuthState(event, session) {
  if (event === 'SIGNED_IN' && session) {
    if (window.location.hash || window.location.search.includes('code')) {
      history.replaceState({}, document.title, window.location.pathname);
    }
    syncUser(session);
    await loadSettings();
    await loadPages();
  } else if (event === 'SIGNED_OUT') {
    state.session = null;
    showView('auth');
  }
}

async function initApp() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  syncUser(session);
  if (session) {
    await loadSettings();
    await loadPages();
  }

  supabaseClient.auth.onAuthStateChange(async (event, session) => {
    await handleAuthState(event, session);
  });
}

async function addCustomPage(event) {
  event.preventDefault();
  if (!state.session) return;

  const form = new FormData(event.target);
  const title = String(form.get('title') || '').trim();
  const icon = String(form.get('icon') || '✦').trim() || '✦';
  const slug = String(form.get('slug') || '').trim().replace(/^\/+/, '');
  const kind = String(form.get('kind') || 'link');

  if (!title || !slug) return;

  const row = {
    slug: `/${slug}`,
    title,
    icon,
    kind,
    is_published: true,
    sort_order: 999,
    created_by: state.session.user.id,
    created_at: new Date().toISOString()
  };

  try {
    const { error } = await supabaseClient.from('"OrionHQ_pages"').insert(row);
    if (!error) {
      state.pages.push({ slug: row.slug, title, icon, kind });
      renderNav();
      renderRoute();
      $('#developer-dialog').close();
      event.target.reset();
    }
  } catch (err) {
    console.warn('Insert custom page failed', err);
  }
}

function wireEvents() {
  $('#login-button').addEventListener('click', login);
  $('#logout-button').addEventListener('click', logout);
  $('#pin-button').addEventListener('click', () => {
    state.pinned = !state.pinned;
    localStorage.setItem('orionhq_sidebar_pinned', String(state.pinned));
    setSidebarState();
    saveSettings();
  });

  const menuButton = $('#menu-button');
  const sidebar = $('#sidebar');
  const scrim = $('#scrim');

  menuButton.addEventListener('click', () => {
    sidebar.classList.add('open');
    scrim.classList.add('visible');
  });

  $('#sidebar-close').addEventListener('click', () => {
    sidebar.classList.remove('open');
    scrim.classList.remove('visible');
  });

  scrim.addEventListener('click', () => {
    sidebar.classList.remove('open');
    scrim.classList.remove('visible');
  });

  $('#developer-button').addEventListener('click', () => $('#developer-dialog').showModal());
  $('#dialog-close').addEventListener('click', () => $('#developer-dialog').close());
  $('#page-form').addEventListener('submit', addCustomPage);
  $('#profile-button').addEventListener('click', () => {
    const menu = $('#profile-menu');
    menu.hidden = !menu.hidden;
  });
  window.addEventListener('hashchange', renderRoute);
  $('#theme-button').addEventListener('click', () => {
    document.body.style.filter = 'hue-rotate(10deg)';
    setTimeout(() => document.body.style.filter = '', 180);
  });
}

window.addEventListener('DOMContentLoaded', () => {
  setSidebarState();
  wireEvents();
  initApp();
});
