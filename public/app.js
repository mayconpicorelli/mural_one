// public/app.js
document.addEventListener('DOMContentLoaded', () => {
  const loginScreen = document.getElementById('login-screen');
  const portalScreen = document.getElementById('portal-screen');
  const loginForm = document.getElementById('login-form');
  const loginMessage = document.getElementById('login-message');
  const logoutBtn = document.getElementById('logout-btn');

  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const chatMessages = document.getElementById('chat-messages');
  const chatStatus = document.getElementById('chat-status');

  // --- LOGIN ---
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    loginMessage.textContent = 'Validando credenciais...';
    loginMessage.className = 'feedback info';

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.ok) {
        loginMessage.textContent =
          data.message || 'Usuário ou senha inválidos.';
        loginMessage.className = 'feedback error';
        return;
      }

      loginMessage.textContent = data.message || 'Login realizado com sucesso.';
      loginMessage.className = 'feedback success';

      setTimeout(() => {
        loginScreen.classList.add('hidden');
        portalScreen.classList.remove('hidden');
      }, 400);
    } catch (err) {
      console.error('Erro de login:', err);
      loginMessage.textContent = 'Erro ao comunicar com o servidor.';
      loginMessage.className = 'feedback error';
    }
  });

  // --- LOGOUT simples (só volta para a tela de login) ---
  logoutBtn.addEventListener('click', () => {
    portalScreen.classList.add('hidden');
    loginScreen.classList.remove('hidden');
    loginMessage.textContent = '';
    loginMessage.className = 'feedback';
  });

  // --- CHAT GPT ---
  function appendMessage(text, author) {
    const div = document.createElement('div');
    div.className = `chat-bubble ${author === 'user' ? 'user' : 'assistant'}`;
    div.textContent = text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = chatInput.value.trim();
    if (!message) return;

    appendMessage(message, 'user');
    chatInput.value = '';
    chatInput.focus();

    chatStatus.textContent = 'Aguardando resposta da IA...';
    chatStatus.className = 'chat-status info';

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.ok) {
        chatStatus.textContent =
          data.message || 'Erro ao conversar com o agente.';
        chatStatus.className = 'chat-status error';
        return;
      }

      chatStatus.textContent = '';
      appendMessage(data.answer, 'assistant');
    } catch (err) {
      console.error('Erro no chat:', err);
      chatStatus.textContent = 'Erro de comunicação com o servidor.';
      chatStatus.className = 'chat-status error';
    }
  });
});
