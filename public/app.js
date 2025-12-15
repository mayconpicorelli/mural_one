document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app');

  // Monta o layout do login
  app.innerHTML = `
    <div class="page">
      <div class="card">
        <h1 class="title">Mural One</h1>
        <p class="subtitle">Acesso protegido</p>

        <form id="login-form">
          <label for="username">Usuário</label>
          <input id="username" type="text" autocomplete="username" />

          <label for="password">Senha</label>
          <input id="password" type="password" autocomplete="current-password" />

          <button type="submit">Entrar</button>
        </form>

        <div id="message" class="message"></div>

        <p class="footer-text">
          Em caso de dúvida contate a Gerencia.
        </p>
      </div>
    </div>
  `;

  const form = document.getElementById('login-form');
  const messageEl = document.getElementById('message');
  const userInput = document.getElementById('username');
  const passInput = document.getElementById('password');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    messageEl.textContent = '';
    messageEl.className = 'message';

    const username = userInput.value.trim();
    const password = passInput.value.trim();

    if (!username || !password) {
      messageEl.textContent = 'Informe usuário e senha.';
      messageEl.classList.add('error');
      return;
    }

    try {
      const resp = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await resp.json().catch(() => null);

      if (!resp.ok) {
        messageEl.textContent =
          (data && data.message) || 'Usuário ou senha inválidos.';
        messageEl.classList.add('error');
        return;
      }

      // Sucesso
      messageEl.textContent = 'Login realizado com sucesso.';
      messageEl.classList.add('success');

      // Aqui no futuro você substitui pelo mural de avisos / IA etc.
    } catch (err) {
      console.error(err);
      messageEl.textContent =
        'Erro ao contatar o servidor. Tente novamente em instantes.';
      messageEl.classList.add('error');
    }
  });
});

