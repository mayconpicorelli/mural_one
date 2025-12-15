document.addEventListener('DOMContentLoaded', () => {
  const loginSection = document.getElementById('loginSection');
  const appSection = document.getElementById('appSection');
  const loginForm = document.getElementById('loginForm');
  const loginMessage = document.getElementById('loginMessage');
  const logoutButton = document.getElementById('logoutButton');

  if (!loginForm) {
    console.error('Formulário de login não encontrado no DOM.');
    return;
  }

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    loginMessage.textContent = 'Validando credenciais...';
    loginMessage.className = 'login-message login-message--info';

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      let data = null;
      try {
        data = await response.json();
      } catch (e) {
        console.error('Erro ao ler JSON do login:', e);
      }

      if (!response.ok || !data || !data.ok) {
        const msg =
          (data && data.message) ||
          'Usuário ou senha inválidos. Verifique e tente novamente.';
        loginMessage.textContent = msg;
        loginMessage.className = 'login-message login-message--error';
        return;
      }

      // Sucesso
      loginMessage.textContent = 'Login realizado com sucesso.';
      loginMessage.className = 'login-message login-message--success';

      // Troca de tela: esconde login, mostra mural
      loginSection.classList.add('hidden');
      appSection.classList.remove('hidden');
    } catch (error) {
      console.error('Erro na requisição de login:', error);
      loginMessage.textContent =
        'Erro ao conectar com o servidor. Tente novamente em alguns instantes.';
      loginMessage.className = 'login-message login-message--error';
    }
  });

  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      // Limpa campos
      document.getElementById('username').value = '';
      document.getElementById('password').value = '';
      loginMessage.textContent = '';
      loginMessage.className = 'login-message';

      // Volta para a tela de login
      appSection.classList.add('hidden');
      loginSection.classList.remove('hidden');
    });
  }
});
