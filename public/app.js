// public/app.js

// Utilitário: mostrar/esconder telas
function showScreen(screenIdToShow) {
  const screens = document.querySelectorAll('.screen');
  screens.forEach((el) => el.classList.add('screen-hidden'));
  screens.forEach((el) => el.classList.remove('screen-visible'));

  const screen = document.getElementById(screenIdToShow);
  if (screen) {
    screen.classList.remove('screen-hidden');
    screen.classList.add('screen-visible');
  }
}

// ---------- LOGIN ----------
function setupLogin() {
  const form = document.getElementById('login-form');
  const message = document.getElementById('login-message');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    message.textContent = 'Validando...';
    message.className = 'login-message';

    try {
      const res = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        message.textContent = data.message || 'Usuário ou senha inválidos.';
        message.className = 'login-message error';
        return;
      }

      message.textContent = 'Login realizado com sucesso.';
      message.className = 'login-message success';

      // Marca login simples no navegador
      localStorage.setItem('muralOneLoggedIn', 'true');

      // Mostra o mural após um pequeno delay
      setTimeout(() => {
        showScreen('mural-screen');
      }, 500);
    } catch (err) {
      console.error(err);
      message.textContent = 'Erro ao comunicar com o servidor.';
      message.className = 'login-message error';
    }
  });
}

// ---------- MENU DO MURAL ----------
function setupMuralMenu() {
  const buttons = document.querySelectorAll('.menu-item');
  const sections = document.querySelectorAll('.content-section');
  const logoutButton = document.getElementById('logout-button');

  if (!buttons.length) return;

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const sectionKey = btn.dataset.section;
      if (!sectionKey) return;

      // ativa/desativa botões
      buttons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      // mostra a seção correspondente
      sections.forEach((sec) => {
        if (sec.id === `section-${sectionKey}`) {
          sec.classList.add('section-visible');
        } else {
          sec.classList.remove('section-visible');
        }
      });
    });
  });

  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      localStorage.removeItem('muralOneLoggedIn');
      showScreen('login-screen');
    });
  }
}

// ---------- CALENDÁRIO ----------
function buildCalendar() {
  const grid = document.getElementById('calendar-grid');
  const title = document.getElementById('calendar-title');
  const prevBtn = document.getElementById('prev-month');
  const nextBtn = document.getElementById('next-month');
  const holidayList = document.getElementById('holiday-list');

  if (!grid || !title || !holidayList) return;

  // Exemplo: feriados fixos (podemos puxar de JSON depois)
  const feriadosFixos = [
    { dia: 1, mes: 1, nome: 'Confraternização Universal' },
    { dia: 21, mes: 4, nome: 'Tiradentes' },
    { dia: 1, mes: 5, nome: 'Dia do Trabalho' },
    { dia: 7, mes: 9, nome: 'Independência do Brasil' },
    { dia: 12, mes: 10, nome: 'Nossa Senhora Aparecida' },
    { dia: 2, mes: 11, nome: 'Finados' },
    { dia: 15, mes: 11, nome: 'Proclamação da República' },
    { dia: 25, mes: 12, nome: 'Natal' },
  ];

  let current = new Date();

  function render(monthDate) {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth(); // 0-11

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date();

    const monthNames = [
      'janeiro',
      'fevereiro',
      'março',
      'abril',
      'maio',
      'junho',
      'julho',
      'agosto',
      'setembro',
      'outubro',
      'novembro',
      'dezembro',
    ];
    const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

    title.textContent = `${monthNames[month]} de ${year}`;

    grid.innerHTML = '';

    // cabeçalho com dias da semana
    weekDays.forEach((d) => {
      const cell = document.createElement('div');
      cell.className = 'day-header';
      cell.textContent = d;
      grid.appendChild(cell);
    });

    // dias em branco antes do dia 1
    for (let i = 0; i < firstDay.getDay(); i += 1) {
      const empty = document.createElement('div');
      empty.className = 'day-cell';
      grid.appendChild(empty);
    }

    // dias do mês
    for (let day = 1; day <= lastDay.getDate(); day += 1) {
      const cell = document.createElement('div');
      cell.className = 'day-cell';
      cell.textContent = day;

      // hoje
      if (
        day === today.getDate() &&
        month === today.getMonth() &&
        year === today.getFullYear()
      ) {
        cell.classList.add('today');
      }

      // feriado
      const holiday = feriadosFixos.find(
        (f) => f.dia === day && f.mes === month + 1,
      );
      if (holiday) {
        cell.classList.add('holiday');
        cell.title = holiday.nome;
      }

      grid.appendChild(cell);
    }

    // Lista de feriados do mês
    holidayList.innerHTML = '';
    const feriadosDoMes = feriadosFixos.filter((f) => f.mes === month + 1);
    if (feriadosDoMes.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'Nenhum feriado cadastrado neste mês.';
      holidayList.appendChild(li);
    } else {
      feriadosDoMes.forEach((f) => {
        const li = document.createElement('li');
        li.textContent = `${String(f.dia).padStart(2, '0')}/${String(
          f.mes,
        ).padStart(2, '0')} - ${f.nome}`;
        holidayList.appendChild(li);
      });
    }
  }

  render(current);

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      current = new Date(current.getFullYear(), current.getMonth() - 1, 1);
      render(current);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
      render(current);
    });
  }
}

// ---------- Chat GPT interno (placeholder) ----------
function setupChat() {
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  const history = document.getElementById('chat-history');

  if (!form || !input || !history) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    // mensagem do usuário
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-message chat-message-user';
    userMsg.textContent = text;
    history.appendChild(userMsg);

    // resposta fictícia do sistema
    const systemMsg = document.createElement('div');
    systemMsg.className = 'chat-message chat-message-system';
    systemMsg.textContent =
      'Este é apenas um layout de demonstração. A integração com o agente GPT será configurada pela equipe de TI.';
    history.appendChild(systemMsg);

    history.scrollTop = history.scrollHeight;
    input.value = '';
  });
}

// ---------- Inicialização ----------
document.addEventListener('DOMContentLoaded', () => {
  // Decide qual tela mostrar ao carregar
  const logged = localStorage.getItem('muralOneLoggedIn') === 'true';
  if (logged) {
    showScreen('mural-screen');
  } else {
    showScreen('login-screen');
  }

  setupLogin();
  setupMuralMenu();
  buildCalendar();
  setupChat();
});
