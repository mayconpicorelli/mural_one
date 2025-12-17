document.addEventListener('DOMContentLoaded', () => {
  const loginCard = document.getElementById('login-card');
  const portalCard = document.getElementById('portal-card');

  const loginForm = document.getElementById('login-form');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const loginMessage = document.getElementById('login-message');

  const avisosList = document.getElementById('avisos-list');

  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const chatLog = document.getElementById('chat-log');
  const chatStatus = document.getElementById('chat-status');
  const chatSuggestions = document.querySelectorAll('.chat-suggestions button');
  const assistantShortcut = document.getElementById('assistant-shortcut');
  const atendenteSection = document.getElementById('atendente-ia');

  const calendarMonthLabel = document.getElementById('calendar-month');
  const calendarGrid = document.getElementById('calendar-grid');
  const calendarPrev = document.getElementById('calendar-prev');
  const calendarNext = document.getElementById('calendar-next');
  const calendarHolidaysList = document.getElementById('calendar-holidays-list');

  let chatHistory = [];
  let calendarEvents = [];
  const MONTH_NAMES = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro'
  ];
  const currentCalendarDate = new Date();
  currentCalendarDate.setDate(1);

  // ---------- LOGIN ----------
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      loginMessage.textContent = '';
      const username = usernameInput.value.trim();
      const password = passwordInput.value.trim();

      if (!username || !password) {
        loginMessage.textContent = 'Informe usuário e senha.';
        loginMessage.classList.add('error');
        return;
      }

      try {
        const resp = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        const data = await resp.json();

        if (!resp.ok || !data.success) {
          loginMessage.textContent =
            data.message || 'Usuário ou senha inválidos.';
          loginMessage.classList.add('error');
          return;
        }

        loginMessage.textContent = 'Login realizado com sucesso.';
        loginMessage.classList.remove('error');
        loginMessage.classList.add('success');

        // Mostra portal e esconde login
        setTimeout(() => {
          loginCard.classList.add('hidden');
          portalCard.classList.remove('hidden');
          carregarConteudo();
        }, 500);
      } catch (err) {
        console.error(err);
        loginMessage.textContent = 'Erro ao comunicar com o servidor.';
        loginMessage.classList.add('error');
      }
    });
  }

  // ---------- CARREGAR CONTEÚDO (AVISOS + CALENDÁRIO) ----------
  async function carregarConteudo() {
    try {
      const resp = await fetch('/api/content');
      if (!resp.ok) return;

      const data = await resp.json();

      // Avisos
      if (Array.isArray(data.announcements) && avisosList) {
        avisosList.innerHTML = '';
        data.announcements.forEach((aviso) => {
          const item = document.createElement('li');
          item.className = 'card aviso-item';
          item.innerHTML = `
            <div class="tag">${aviso.tag || 'Aviso'}</div>
            <h3>${aviso.title || ''}</h3>
            <p>${aviso.body || ''}</p>
          `;
          avisosList.appendChild(item);
        });
      }

      // Calendário
      if (Array.isArray(data.calendar)) {
        calendarEvents = data.calendar
          .map((evento) => {
            if (!evento.date) return null;
            const [year, month, day] = evento.date.split('-').map(Number);
            if (!year || !month || !day) return null;
            const dateObj = new Date(year, month - 1, day);
            return { ...evento, dateObj };
          })
          .filter(Boolean);
        renderCalendar();
      }
    } catch (err) {
      console.error('Erro ao carregar conteúdo:', err);
    }
  }

  function renderCalendar() {
    if (!calendarGrid || !calendarMonthLabel) return;

    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();

    calendarMonthLabel.textContent = `${MONTH_NAMES[month]} ${year}`;

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const eventsOfMonth = calendarEvents.filter(
      (evt) =>
        evt.dateObj &&
        evt.dateObj.getFullYear() === year &&
        evt.dateObj.getMonth() === month
    );

    const eventMap = eventsOfMonth.reduce((acc, evt) => {
      const day = evt.dateObj.getDate();
      if (!acc[day]) acc[day] = [];
      acc[day].push(evt);
      return acc;
    }, {});

    const totalSlots = Math.ceil((firstDayIndex + daysInMonth) / 7) * 7;
    calendarGrid.innerHTML = '';

    for (let slot = 0; slot < totalSlots; slot++) {
      const dayNumber = slot - firstDayIndex + 1;
      const cell = document.createElement('div');
      cell.className = 'calendar-cell';

      if (slot >= firstDayIndex && dayNumber <= daysInMonth) {
        const dayButton = document.createElement('button');
        dayButton.type = 'button';
        dayButton.className = 'calendar-day';
        dayButton.textContent = dayNumber;

        if (eventMap[dayNumber]) {
          dayButton.classList.add('has-event');
          dayButton.title = eventMap[dayNumber]
            .map((evt) => evt.label)
            .join(' • ');
        }

        cell.appendChild(dayButton);
      }

      calendarGrid.appendChild(cell);
    }

    if (calendarHolidaysList) {
      calendarHolidaysList.innerHTML = '';
      if (!eventsOfMonth.length) {
        const emptyItem = document.createElement('li');
        emptyItem.textContent = 'Sem feriados cadastrados.';
        calendarHolidaysList.appendChild(emptyItem);
      } else {
        eventsOfMonth
          .sort((a, b) => a.dateObj - b.dateObj)
          .forEach((evt) => {
            const li = document.createElement('li');
            const formatted = evt.dateObj.toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'long'
            });
            li.innerHTML = `<strong>${formatted}</strong> - ${evt.label || ''}`;
            calendarHolidaysList.appendChild(li);
          });
      }
    }
  }

  if (assistantShortcut && atendenteSection) {
    assistantShortcut.addEventListener('click', () => {
      atendenteSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  if (calendarPrev) {
    calendarPrev.addEventListener('click', () => {
      currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
      renderCalendar();
    });
  }

  if (calendarNext) {
    calendarNext.addEventListener('click', () => {
      currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
      renderCalendar();
    });
  }

  renderCalendar();

  // ---------- CHAT GPT ----------
  function addChatMessage(from, text) {
    const row = document.createElement('div');
    row.className = `chat-message ${from}`;
    row.innerHTML = `<span class="from">${from === 'user' ? 'Você' : 'Agente'}</span><p>${text}</p>`;
    chatLog.appendChild(row);
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  if (chatSuggestions.length && chatInput) {
    chatSuggestions.forEach((button) => {
      button.addEventListener('click', () => {
        chatInput.value = button.textContent.trim();
        chatInput.focus();
      });
    });
  }

  if (chatForm) {
    chatForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = chatInput.value.trim();
      if (!text) return;

      addChatMessage('user', text);
      chatInput.value = '';
      chatStatus.textContent = 'O agente está pensando...';

      try {
        const resp = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            history: chatHistory
          })
        });

        const data = await resp.json();
        if (!resp.ok || data.error) {
          chatStatus.textContent =
            data.error || 'Erro ao falar com o agente de IA.';
          return;
        }

        const reply = data.reply || '';
        addChatMessage('assistant', reply);
        chatStatus.textContent = '';

        // guarda histórico básico para enviar na próxima mensagem
        chatHistory.push({ role: 'user', content: text });
        chatHistory.push({ role: 'assistant', content: reply });
      } catch (err) {
        console.error(err);
        chatStatus.textContent = 'Falha na comunicação com o servidor.';
      }
    });
  }
});
