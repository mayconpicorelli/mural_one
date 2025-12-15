// public/app.js

document.addEventListener('DOMContentLoaded', () => {
  const loginSection = document.getElementById('loginSection');
  const appSection = document.getElementById('appSection');
  const loginForm = document.getElementById('loginForm');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const loginStatus = document.getElementById('loginStatus');
  const logoutButton = document.getElementById('logoutButton');
  const menuButtons = document.querySelectorAll('.menu-item');
  const appContent = document.getElementById('appContent');

  let contentData = null;

  async function loadContent() {
    try {
      const response = await fetch('/data/content.json');
      if (!response.ok) {
        throw new Error('Falha ao carregar conteúdo do mural.');
      }
      contentData = await response.json();
    } catch (error) {
      console.error(error);
      contentData = null;
    }
  }

  function showSection(section) {
    menuButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.section === section);
    });

    switch (section) {
      case 'board':
        renderBoard();
        break;
      case 'calendar':
        renderCalendar();
        break;
      case 'gpt':
        renderGpt();
        break;
      default:
        renderBoard();
    }
  }

  // === SEÇÃO: PAREDE DE AVISOS ===
  function renderBoard() {
    const items = contentData && Array.isArray(contentData.announcements)
      ? contentData.announcements
      : [];

    const listHtml = items.length
      ? items
          .map((item) => {
            const title = item.title || item.titulo || 'Comunicado';
            const body =
              item.description ||
              item.descricao ||
              item.summary ||
              'Detalhes não informados.';
            const date = item.date || item.data || '';
            const category = item.category || item.categoria || '';
            const importance = item.importance || item.importancia || '';

            return `
              <article class="notice-card">
                <div class="notice-meta">
                  ${date ? `<span>${date}</span>` : ''}
                  ${category ? `<span class="badge">${category}</span>` : ''}
                  ${
                    importance === 'alta'
                      ? '<span class="badge badge--high">Importante</span>'
                      : ''
                  }
                </div>
                <h3 class="notice-title">${title}</h3>
                <p class="notice-body">${body}</p>
              </article>
            `;
          })
          .join('')
      : '<p class="section-subtitle">Nenhum comunicado cadastrado ainda.</p>';

    appContent.innerHTML = `
      <h2 class="section-title">Parede de avisos</h2>
      <p class="section-subtitle">
        Espaço reservado para comunicados oficiais do RH, diretoria e demais setores.
      </p>
      <div class="notice-list">
        ${listHtml}
      </div>
    `;
  }

  // === SEÇÃO: CALENDÁRIO OPERACIONAL ===
  function renderCalendar() {
    const items = contentData && Array.isArray(contentData.calendar)
      ? contentData.calendar
      : [];

    const rowsHtml = items.length
      ? items
          .map((item) => {
            const date = item.date || item.data || '';
            const title = item.title || item.titulo || 'Evento';
            const description =
              item.description || item.descricao || '';
            const unit = item.unit || item.unidade || '';

            const meta = [description, unit].filter(Boolean).join(' • ');

            return `
              <div class="calendar-row">
                <div class="calendar-date">${date}</div>
                <div>
                  <div class="notice-title">${title}</div>
                  ${meta ? `<div class="calendar-label">${meta}</div>` : ''}
                </div>
              </div>
            `;
          })
          .join('')
      : '<p class="section-subtitle">Nenhum evento cadastrado no calendário.</p>';

    appContent.innerHTML = `
      <h2 class="section-title">Calendário operacional</h2>
      <p class="section-subtitle">
        Consulte feriados, plantões, folgas programadas e unidades abertas/fechadas.
      </p>
      <div class="calendar-list">
        ${rowsHtml}
      </div>
    `;
  }

  // === SEÇÃO: AGENTE GPT INTERNO ===
  function renderGpt() {
    const gptInfo = (contentData && contentData.gptAgent) || {};

    const statusText =
      gptInfo.status ||
      'Em configuração. Em breve o agente GPT interno estará disponível.';

    const description =
      gptInfo.description ||
      'Área reservada para o agente de IA conectado à base interna da empresa.';

    appContent.innerHTML = `
      <h2 class="section-title">Agente GPT interno</h2>
      <p class="section-subtitle">
        Aqui ficará o agente de IA que apoiará colaboradores com dúvidas internas,
        políticas, processos e consultas ao SSW.
      </p>

      <p class="gpt-summary">${description}</p>

      <p class="gpt-status">
        <span class="status-dot"></span>
        ${statusText}
      </p>

      <p class="section-subtitle" style="margin-top:16px;">
        A integração com o agente GPT ainda será configurada. Assim que estiver ativa,
        o acesso será feito por esta mesma área.
      </p>
    `;
  }

  // === LOGIN / LOGOUT ===
  async function handleLogin(event) {
    event.preventDefault();

    loginStatus.textContent = '';
    loginStatus.className = 'login-status';

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
      loginStatus.textContent = 'Informe usuário e senha.';
      loginStatus.classList.add('login-status--error');
      return;
    }

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        const message =
          (data && data.message) ||
          'Usuário ou senha inválidos. Verifique e tente novamente.';
        loginStatus.textContent = message;
        loginStatus.classList.add('login-status--error');
        return;
      }

      loginStatus.textContent = 'Login realizado com sucesso.';
      loginStatus.classList.add('login-status--success');

      localStorage.setItem('muralOneLogged', 'true');

      loginSection.classList.add('hidden');
      appSection.classList.remove('hidden');

      await loadContent();
      showSection('board');
    } catch (error) {
      console.error(error);
      loginStatus.textContent =
        'Falha ao conectar ao servidor. Tente novamente em instantes.';
      loginStatus.classList.add('login-status--error');
    }
  }

  function handleLogout() {
    // backend não guarda sessão; só limpamos o front
    fetch('/api/logout', { method: 'POST' }).catch(() => {});
    localStorage.removeItem('muralOneLogged');
    appSection.classList.add('hidden');
    loginSection.classList.remove('hidden');
    loginForm.reset();
    loginStatus.textContent = '';
    loginStatus.className = 'login-status';
    usernameInput.focus();
  }

  // Eventos
  loginForm.addEventListener('submit', handleLogin);
  logoutButton.addEventListener('click', handleLogout);

  menuButtons.forEach((btn) => {
    btn.addEventListener('click', () => showSection(btn.dataset.section));
  });

  // Se já estiver logado neste navegador, entra direto
  if (localStorage.getItem('muralOneLogged') === 'true') {
    loginSection.classList.add('hidden');
    appSection.classList.remove('hidden');
    loadContent().then(() => showSection('board'));
  } else {
    loginSection.classList.remove('hidden');
    appSection.classList.add('hidden');
  }
});
