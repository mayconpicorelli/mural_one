// public/app.js

document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app');

  function renderLogin() {
    app.innerHTML = `
      <div class="page">
        <div class="card">
          <div class="card-left">
            <div class="highlight">
              <span class="highlight-dot"></span>
              Acesso exclusivo para colaboradores Picorelli
            </div>
            <h1 class="logo-title">Mural One</h1>
            <p class="subtitle">
              Portal interno com mural de avisos, calendário operacional e agente de IA.
            </p>
            <ul>
              <li>Informações atualizadas das unidades.</li>
              <li>Comunicados oficiais e documentos importantes.</li>
              <li>Acesso ao assistente virtual treinado na realidade da empresa.</li>
            </ul>
            <p class="help-text">
              Em caso de dúvida, contate a Gerência de Tecnologia.
            </p>
          </div>

          <div class="card-right">
            <h2>Acesso protegido</h2>
            <p>Use seu usuário e senha autorizados para entrar.</p>

            <form id="login-form">
              <div class="form-group">
                <label for="username">Usuário</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autocomplete="username"
                  required
                />
              </div>

              <div class="form-group">
                <label for="password">Senha</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autocomplete="current-password"
                  required
                />
              </div>

              <button type="submit" id="login-button">Entrar</button>
              <div id="login-error" class="login-error" style="display:none;"></div>
            </form>
          </div>
        </div>
      </div>
    `;

    const form = document.getElementById('login-form');
    const errorDiv = document.getElementById('login-error');
    const button = document.getElementById('login-button');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value;

      errorDiv.style.display = 'none';
      errorDiv.textContent = '';

      if (!username || !password) {
        errorDiv.textContent = 'Preencha usuário e senha.';
        errorDiv.style.display = 'block';
        return;
      }

      button.disabled = true;

      try {
        const response = await fetch('/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });

        let data;
        try {
          data = await response.json();
        } catch (e) {
          console.error('Falha ao interpretar JSON do servidor:', e);
          throw new Error('Resposta do servidor não está em JSON.');
        }

        if (!data || typeof data.success !== 'boolean') {
          throw new Error('Formato de resposta inesperado.');
        }

        if (data.success) {
          renderMural();
        } else {
          errorDiv.textContent =
            data.message || 'Usuário ou senha inválidos.';
          errorDiv.style.display = 'block';
        }
      } catch (err) {
        console.error('Erro na requisição /login:', err);
        errorDiv.textContent =
          'Resposta inválida do servidor. Tente novamente em instantes.';
        errorDiv.style.display = 'block';
      } finally {
        button.disabled = false;
      }
    });
  }

  function renderMural() {
    app.innerHTML = `
      <div class="page">
        <div class="mural-wrapper">
          <div class="mural-header">
            <div>
              <h1 class="mural-title">Mural One</h1>
              <p class="mural-subtitle">
                Acesso liberado. Em breve: avisos, calendário e agente GPT integrados.
              </p>
            </div>
          </div>

          <div class="mural-grid">
            <section class="panel">
              <h3>Parede de avisos</h3>
              <p>
                Espaço reservado para comunicados internos do RH,
                operações e diretoria. Aqui ficarão os cards com avisos
                e links importantes.
              </p>
            </section>

            <section class="panel">
              <h3>Próximos passos</h3>
              <p>
                Nesta primeira versão, apenas o login está ativo.
                Nas próximas iterações vamos conectar o calendário,
                mural dinâmico e o agente de IA oficial da Picorelli.
              </p>
            </section>
          </div>
        </div>
      </div>
    `;
  }

  // Inicia mostrando o login
  renderLogin();
});



