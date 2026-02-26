// ═══════════════════════════════════════════════════════
// UFOP Caronas — Utilitários do Frontend
// ═══════════════════════════════════════════════════════
const API_BASE_URL = 'http://localhost:3000';

// ── Auth ─────────────────────────────────────────────
function getToken() { return localStorage.getItem('token'); }
function getUsuario() {
  try { return JSON.parse(localStorage.getItem('usuario')); } catch { return null; }
}
function isLogado() { return !!getToken() && !!getUsuario(); }
function isAdmin() { const u = getUsuario(); return u && u.eh_admin; }

function requireAuth() {
  if (!isLogado()) window.location.href = 'login.html';
}
function requireAdmin() {
  if (!isLogado()) { window.location.href = 'login.html'; return; }
  if (!isAdmin()) { window.location.href = 'dashboard.html'; return; }
}
function redirectIfAuth() {
  if (isLogado()) window.location.href = 'dashboard.html';
}
function checkAuthRedirect() {
  if (isLogado()) {
    const nav = document.getElementById('navLinks');
    if (nav) nav.innerHTML = `<li><a href="dashboard.html" class="btn btn-primary btn-sm">Meu Painel →</a></li>`;
  }
}

// ── API Fetch ─────────────────────────────────────────
async function apiFetch(url, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers
    });

    const data = await res.json();
    if (res.status === 401) { logout(); return {}; }
    return data;

  } catch (e) {
    showToast('Erro de conexão com o servidor', 'error');
    return {};
  }
}

// ── Login / Logout ────────────────────────────────────
async function login(email, senha) {
  const res = await apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, senha }) });
  if (res.token) {
    localStorage.setItem('token', res.token);
    localStorage.setItem('usuario', JSON.stringify(res.usuario));
    showToast(`Bem-vindo, ${res.usuario.nome.split(' ')[0]}! 👋`, 'success');
    setTimeout(() => window.location.href = 'dashboard.html', 800);
    return true;
  }
  showToast(res.erro || 'Erro ao entrar', 'error');
  return false;
}

async function logout() {
  await apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => { });
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  window.location.href = 'login.html';
}

// ── Navbar ────────────────────────────────────────────
function renderNavbar(activeItem) {
  const u = getUsuario();
  const nav = document.getElementById('navbar');
  if (!nav) return;
  const items = [
    { id: 'dashboard', href: 'dashboard.html', label: 'Dashboard', icon: '🏠' },
    { id: 'caronas', href: 'caronas.html', label: 'Buscar', icon: '🔍' },
    { id: 'oferecer', href: 'oferecer.html', label: 'Oferecer', icon: '🚗' },
    { id: 'historico', href: 'historico.html', label: 'Histórico', icon: '📋' },
  ];
  if (u && u.eh_admin) items.push({ id: 'admin', href: 'admin.html', label: 'Admin', icon: '🛡️' });

  nav.innerHTML = `
    <a href="dashboard.html" class="navbar-brand">
      <div class="navbar-logo">🚗</div>
      <span class="navbar-brand-text">UFOP <span>Caronas</span></span>
    </a>
    <ul class="navbar-nav">
      ${items.map(it => `<li><a href="${it.href}" class="${activeItem === it.id ? 'active' : ''}">${it.icon} ${it.label}</a></li>`).join('')}
    </ul>
    <div class="navbar-user">
      <div class="avatar">${u ? u.nome.charAt(0) : '?'}</div>
      <span style="display: none; @media(min-width:768px){display:block}">${u ? u.nome.split(' ')[0] : ''}</span>
      <button onclick="logout()" class="btn btn-sm" style="background: rgba(255,255,255,0.15); color: white; border: none;">Sair</button>
    </div>
  `;
}

// ── Toast ─────────────────────────────────────────────
function showToast(msg, type = 'info') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  const container = document.getElementById('toast-container');
  if (!container) return;
  container.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

// ── Card de Carona (genérico) ─────────────────────────
function renderCaronaCard(c) {
  const vagas = c.vagas_disponiveis;
  const vagasClass = vagas > 2 ? 'vagas-ok' : vagas > 0 ? 'vagas-poucos' : 'vagas-esgotado';
  const data = new Date(c.data_viagem)
  .toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short'
  });
  return `
    <div class="carona-card">
      <div class="carona-rota">
        <div class="carona-cidade">${c.origem}</div>
        <div class="carona-seta"></div>
        <div class="carona-cidade">${c.destino}</div>
      </div>
      <div class="carona-meta">
        <div class="meta-item"><div class="meta-icon">📅</div>${data}</div>
        <div class="meta-item"><div class="meta-icon">🕐</div>${c.horario ? c.horario.slice(0, 5) : ''}</div>
        ${c.motorista_nome ? `<div class="meta-item"><div class="meta-icon">👤</div>${c.motorista_nome}</div>` : ''}
      </div>
      <div class="carona-footer">
        <span class="vagas-badge ${vagasClass}">🪑 ${vagas} vaga${vagas !== 1 ? 's' : ''}</span>
        <a href="caronas.html" class="btn btn-primary btn-sm">Ver →</a>
      </div>
    </div>`;
}
