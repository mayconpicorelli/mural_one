const state = {
  token: sessionStorage.getItem('mural-token') || '',
  announcements: [],
  holidays: [],
  resources: [],
  materials: [],
  calendarDate: new Date(),
  chat: [],
  userRole: 'user'
};

const els = {
  overlay: document.getElementById('auth-overlay'),
  authForm: document.getElementById('auth-form'),
  username: document.getElementById('username'),
  password: document.getElementById('password'),
  authError: document.getElementById('auth-error'),
  logoutButton: document.getElementById('logout-button'),
  refreshButton: document.getElementById('refresh-mural'),
  announcementList: document.getElementById('announcement-list'),
  calendarGrid: document.getElementById('calendar-grid'),
  calendarLabel: document.getElementById('calendar-month'),
  prevMonth: document.getElementById('prev-month'),
  nextMonth: document.getElementById('next-month'),
  holidayList: document.getElementById('holiday-list'),
  resourceList: document.getElementById('resource-list'),
  materialsList: document.getElementById('materials-list'),
  welcomeUser: document.getElementById('welcome-user'),
  liveClock: document.getElementById('live-clock'),
  temperature: document.getElementById('temperature'),
  temperatureValue: document.getElementById('temperature-value'),
  systemPrompt: document.getElementById('system-prompt'),
  chatHistory: document.getElementById('chat-history'),
  chatForm: document.getElementById('chat-form'),
  chatInput: document.getElementById('chat-input'),
  aiStatus: document.getElementById('ai-status')
};

const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
const DEFAULT_TEMPERATURE = 0.3;
const dateFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' });
const monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });
const holidayFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long' });

init();

function init() {
  bindEvents();
  startClock();
  els.systemPrompt.value = 'Voce responde como agente oficial do RH. Seja claro e respeite as politicas.';
  applyRolePermissions();

  if (state.token) {
    toggleOverlay(false);
    loadDashboard();
  } else {
    toggleOverlay(true);
  }
}

function bindEvents() {
  els.authForm.addEventListener('submit', handleLogin);
  els.logoutButton.addEventListener('click', handleLogout);
  els.refreshButton.addEventListener('click', () => loadDashboard(true));
  els.prevMonth.addEventListener('click', () => moveMonth(-1));
  els.nextMonth.addEventListener('click', () => moveMonth(1));
  els.chatForm.addEventListener('submit', handleChatSubmit);
  els.temperature.addEventListener('input', () => {
    els.temperatureValue.textContent = Number(els.temperature.value).toFixed(1);
  });
}

function startClock() {
  updateClock();
  setInterval(updateClock, 1000);
}

function updateClock() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  els.liveClock.textContent = `${hours}:${minutes}`;
}

async function handleLogin(event) {
  event.preventDefault();
  const username = els.username.value.trim();
  const password = els.password.value.trim();

  if (!username || !password) {
    setAuthError('Informe usuario e senha.');
    return;
  }

  try {
    setAuthError('');
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Nao foi possivel autenticar.');
    }

    setToken(data.token);
    state.userRole = data.user?.role || 'user';
    els.welcomeUser.textContent = data.user?.username || 'Colaborador';
    applyRolePermissions();
    toggleOverlay(false);
    loadDashboard();
  } catch (error) {
    console.error(error);
    setAuthError(error.message || 'Falha no login.');
  }
}

async function handleLogout() {
  if (!state.token) {
    toggleOverlay(true);
    return;
  }

  try {
    await authorizedRequest('/api/logout', { method: 'POST' });
  } catch (error) {
    console.warn('Erro ao deslogar', error);
  } finally {
    setToken('');
    state.chat = [];
    els.chatHistory.innerHTML = '';
    state.userRole = 'user';
    applyRolePermissions();
    toggleOverlay(true);
  }
}

function setToken(value) {
  state.token = value || '';
  if (value) {
    sessionStorage.setItem('mural-token', value);
  } else {
    sessionStorage.removeItem('mural-token');
  }
}

function toggleOverlay(visible) {
  if (visible) {
    els.overlay.classList.remove('hidden');
  } else {
    els.overlay.classList.add('hidden');
  }
}

function setAuthError(message) {
  els.authError.textContent = message;
}

async function loadDashboard(force = false) {
  if (!state.token) return;
  try {
    const query = force ? '?refresh=1' : '';
    const data = await authorizedRequest(`/api/dashboard-data${query}`);
    state.announcements = data.announcements || [];
    state.holidays = data.holidays || [];
    state.resources = data.resources || [];
    state.materials = data.materials || [];
    state.userRole = data.user?.role || state.userRole;
    els.welcomeUser.textContent = data.user?.username || 'Colaborador';
    applyRolePermissions();
    renderAnnouncements();
    renderCalendar();
    renderHolidayList();
    renderResources();
    renderMaterials();
    setAiStatus('Pronto', true);
  } catch (error) {
    console.error(error);
    setAiStatus('Offline', false);
  }
}

function renderAnnouncements() {
  els.announcementList.innerHTML = '';
  if (!state.announcements.length) {
    els.announcementList.innerHTML = '<p>Nenhum comunicado cadastrado.</p>';
    return;
  }

  const sorted = [...state.announcements].sort((a, b) => new Date(b.date) - new Date(a.date));
  sorted.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'announcement-card';
    card.innerHTML = `
      <header>
        <h3>${item.title}</h3>
        <span class="tag ${item.tag?.toLowerCase() || ''}">${item.tag || 'Aviso'}</span>
      </header>
      <time>${formatDate(item.date)}</time>
      <p>${item.description || ''}</p>
      <small>Responsavel: ${item.owner || 'RH'}</small>
    `;
    els.announcementList.appendChild(card);
  });
}

function renderCalendar() {
  const baseDate = new Date(state.calendarDate);
  baseDate.setDate(1);
  const month = baseDate.getMonth();
  const year = baseDate.getFullYear();
  els.calendarLabel.textContent = capitalize(monthFormatter.format(baseDate));

  const totalDays = new Date(year, month + 1, 0).getDate();
  const startWeekday = baseDate.getDay();
  const eventsByDay = buildHolidayLookup(month, year);

  els.calendarGrid.innerHTML = '';

  weekdays.forEach((day) => {
    const label = document.createElement('div');
    label.className = 'calendar-day weekday';
    label.textContent = day;
    els.calendarGrid.appendChild(label);
  });

  for (let i = 0; i < startWeekday; i += 1) {
    const empty = document.createElement('div');
    empty.className = 'calendar-day empty';
    els.calendarGrid.appendChild(empty);
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const cell = document.createElement('div');
    cell.className = 'calendar-day';
    const event = eventsByDay.get(day);
    if (event) {
      cell.classList.add('event');
      cell.innerHTML = `<strong>${day}</strong><small>${event.title}</small>`;
    } else {
      cell.innerHTML = `<strong>${day}</strong>`;
    }
    els.calendarGrid.appendChild(cell);
  }
}

function renderHolidayList() {
  els.holidayList.innerHTML = '';
  const baseDate = new Date(state.calendarDate);
  const month = baseDate.getMonth();
  const year = baseDate.getFullYear();
  const filtered = state.holidays
    .filter((holiday) => {
      const date = new Date(holiday.date);
      return date.getMonth() === month && date.getFullYear() === year;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (!filtered.length) {
    els.holidayList.innerHTML = '<p>Nenhum feriado previsto neste m?s.</p>';
    return;
  }

  filtered.forEach((holiday) => {
    const card = document.createElement('article');
    card.className = 'holiday-card';
    card.innerHTML = `
      <header>
        <div>
          <strong>${holiday.title}</strong>
          <p>${holidayFormatter.format(new Date(holiday.date))}</p>
        </div>
        <span class="tag">${holiday.units?.length || 0} unidades</span>
      </header>
      <p>${holiday.description || ''}</p>
    `;

    const units = document.createElement('div');
    units.className = 'unit-status';
    (holiday.units || []).forEach((unit) => {
      const pill = document.createElement('span');
      pill.className = 'unit-pill';
      pill.dataset.status = unit.status || 'Aberta';
      pill.textContent = `${unit.name} - ${unit.status}`;
      units.appendChild(pill);
    });

    card.appendChild(units);
    els.holidayList.appendChild(card);
  });
}

function renderResources() {
  els.resourceList.innerHTML = '';
  if (!state.resources.length) {
    els.resourceList.innerHTML = '<p>Nenhum arquivo compartilhado ainda.</p>';
    return;
  }
  state.resources.forEach((resource) => {
    const card = document.createElement('article');
    card.className = 'resource-card';
    card.innerHTML = `
      <header>
        <div>
          <strong>${resource.name}</strong>
          <p class="resource-meta">Atualizado em ${formatDate(resource.updatedAt)}</p>
        </div>
        <span class="tag">${resource.type || 'Link'}</span>
      </header>
      <p class="resource-meta">${resource.owner || 'RH'}</p>
      <a href="${resource.url}" target="_blank" rel="noopener noreferrer">Abrir</a>
    `;
    els.resourceList.appendChild(card);
  });
}

function renderMaterials() {
  els.materialsList.innerHTML = '';
  if (!state.materials.length) {
    els.materialsList.innerHTML = '<p>Adicione atalhos e materiais para o time.</p>';
    return;
  }
  state.materials.forEach((material) => {
    const card = document.createElement('article');
    card.className = 'material-card';
    card.innerHTML = `
      <header>
        <strong>${material.title}</strong>
      </header>
      <p>${material.summary || ''}</p>
    `;

    const linksWrapper = document.createElement('div');
    linksWrapper.className = 'material-links';
    (material.links || []).forEach((link) => {
      const anchor = document.createElement('a');
      anchor.href = link.url;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.textContent = link.label;
      linksWrapper.appendChild(anchor);
    });

    card.appendChild(linksWrapper);
    els.materialsList.appendChild(card);
  });
}

function moveMonth(delta) {
  const current = new Date(state.calendarDate);
  current.setMonth(current.getMonth() + delta);
  state.calendarDate = current;
  renderCalendar();
}

function buildHolidayLookup(month, year) {
  const lookup = new Map();
  state.holidays.forEach((holiday) => {
    const date = new Date(holiday.date);
    if (date.getMonth() === month && date.getFullYear() === year) {
      lookup.set(date.getDate(), holiday);
    }
  });
  return lookup;
}

async function handleChatSubmit(event) {
  event.preventDefault();
  if (!state.token) {
    return;
  }
  const text = els.chatInput.value.trim();
  if (!text) return;

  const payloadHistory = state.chat.slice();
  const userEntry = { role: 'user', content: text };
  state.chat.push(userEntry);
  appendMessage('user', text);
  els.chatInput.value = '';
  setAiStatus('Consultando...', true);
  toggleChatInputs(true);

  try {
    const response = await authorizedRequest('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        history: payloadHistory,
        temperature: Number(els.temperature.value),
        systemPrompt: els.systemPrompt.value.trim()
      })
    });

    const reply = response.reply || 'Sem resposta.';
    state.chat.push({ role: 'assistant', content: reply });
    appendMessage('bot', reply);
    setAiStatus('Pronto', true);
  } catch (error) {
    console.error(error);
    appendMessage('bot', error.message || 'Nao foi possivel falar com a IA.');
    setAiStatus('Offline', false);
  } finally {
    toggleChatInputs(false);
  }
}

function appendMessage(role, content) {
  const bubble = document.createElement('div');
  bubble.className = `message ${role === 'user' ? 'user' : 'bot'}`;
  bubble.textContent = content;
  els.chatHistory.appendChild(bubble);
  els.chatHistory.scrollTop = els.chatHistory.scrollHeight;
}

function toggleChatInputs(disabled) {
  els.chatInput.disabled = disabled;
  els.chatForm.querySelector('button').disabled = disabled;
}

function setAiStatus(label, online) {
  els.aiStatus.textContent = label;
  if (online) {
    els.aiStatus.classList.add('online');
  } else {
    els.aiStatus.classList.remove('online');
  }
}

async function authorizedRequest(url, options = {}) {
  const config = { ...options };
  config.headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${state.token}`
  };

  const response = await fetch(url, config);
  let payload = {};
  try {
    payload = await response.json();
  } catch (error) {
    // ignore json parse errors
  }

  if (response.status === 401) {
    handleSessionExpired();
    throw new Error('Sessao expirada, faca login novamente.');
  }

  if (!response.ok) {
    throw new Error(payload.error || 'Erro inesperado.');
  }

  return payload;
}

function handleSessionExpired() {
  setToken('');
  state.userRole = 'user';
  applyRolePermissions();
  toggleOverlay(true);
}

function applyRolePermissions() {
  const isAdmin = state.userRole === 'admin';
  els.systemPrompt.disabled = !isAdmin;
  els.temperature.disabled = !isAdmin;
  els.systemPrompt.placeholder = isAdmin
    ? 'Defina limites e tom do agente'
    : 'Apenas adiministradores podem alterar as instruções.';

  if (!isAdmin) {
    els.systemPrompt.value = '';
    els.temperature.value = DEFAULT_TEMPERATURE.toString();
    els.temperatureValue.textContent = DEFAULT_TEMPERATURE.toFixed(1);
  } else {
    els.temperatureValue.textContent = Number(els.temperature.value).toFixed(1);
  }
}

function formatDate(value) {
  if (!value) return '--';
  return dateFormatter.format(new Date(value));
}

function capitalize(text) {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}
