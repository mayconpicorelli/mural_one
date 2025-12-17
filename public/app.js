document.addEventListener('DOMContentLoaded', () => {
  const loginCard = document.getElementById('login-card');
  const portalCard = document.getElementById('portal-card');

  const loginForm = document.getElementById('login-form');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const loginMessage = document.getElementById('login-message');

  const avisosList = document.getElementById('avisos-list');
  const calendarioList = document.getElementById('calendario-list');

  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const chatLog = document.getElementById('chat-log');
  const chatStatus = document.getElementById('chat-status');
  const chatSuggestions = document.querySelectorAll('.chat-suggestions button');

  let chatHistory = [];

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
      if (Array.isArray(data.calendar) && calendarioList) {
        calendarioList.innerHTML = '';
        data.calendar.forEach((evento) => {
          const item = document.createElement('li');
          item.className = 'card calendario-item';
          item.innerHTML = `
            <div class="cal-date">${evento.date || ''}</div>
            <div class="cal-info">
              <strong>${evento.label || ''}</strong>
              <span>${evento.unit || ''}</span>
            </div>
          `;
          calendarioList.appendChild(item);
        });
      }
    } catch (err) {
      console.error('Erro ao carregar conteúdo:', err);
    }
  }

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
