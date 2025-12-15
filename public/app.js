// public/app.js

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');
  const loginContainer = document.getElementById('login-container');
  const appContainer = document.getElementById('app-container');
  const logoutBtn = document.getElementById('btn-logout');
  const userNameSpan = document.getElementById('user-name');

  // ---------------------- Sessão ----------------------

  function getToken() {
    return localStorage.getItem('mural_token');
  }

  function getUserName() {
    return localStorage.getItem('mural_user');
  }

  function saveSession(token, username) {
    localStorage.setItem('mural_token', token);
    localStorage.setItem('mural_user', username || 'Usuário');
  }

  function clearSession() {
    localStorage.removeItem('mural_token');
    localStorage.removeItem('mural_user');
  }

  function showLogin() {
    if (loginContainer) loginContainer.style.display = 'block';
    if (appContainer) appContainer.style.display = 'none';
    if (loginError) loginError.textContent = '';
  }

  function showApp(username) {
    if (loginContainer) loginContainer.style.display = 'none';
    if (appContainer) appContainer.style.display = 'block';
    if (userNameSpan && username) {
      userNameSpan.textContent = username;
    }
  }

  // ------------------- Helper de API -------------------

  async function apiFetch(path, options = {}) {
    const token = getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(path, {
      ...options,
      headers
    });

    const text = await res.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch (err) {
      console.error('Resposta não é JSON:', text);
      alert('Resposta inesperada do servidor. Tente novamente em alguns minutos.');
      throw err;
    }

    if (!res.ok || data.success === false) {
      const msg = (data && data.message) || 'Erro ao processar requisição.';
      alert(msg);
      throw new Error(msg);
    }

    return data;
  }

  // deixa acessível globalmente, se precisar
  window.muralApiFetch = apiFetch;

  // ---------------------- Login -----------------------

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (loginError) loginError.textContent = '';

      const username = (document.getElementById('username')?.value || '').trim();
      const password = (document.getElementById('password')?.value || '').trim();

      if (!username || !password) {
        if (loginError) {
          loginError.textContent = 'Informe usuário e senha.';
        } else {
          alert('Informe usuário e senha.');
        }
        return;
      }

      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        const text = await res.text();
        let data;

        try {
          data = JSON.parse(text);
        } catch (err) {
          console.error('Resposta de /api/login não é JSON:', text);
          if (loginError) {
            loginError.textContent = 'Resposta inesperada do servidor. Tente novamente em alguns minutos.';
          } else {
            alert('Resposta inesperada do servidor. Tente novamente em alguns minutos.');
          }
          return;
        }

        if (!res.ok || !data.success) {
          const msg = data && data.message ? data.message : 'Usuário ou senha inválidos.';
          if (loginError) {
            loginError.textContent = msg;
          } else {
            alert(msg);
          }
          return;
        }

        // sucesso
        saveSession(data.token, data.username);
        showApp(data.username);
      } catch (err) {
        console.error('Erro no login:', err);
        const msg = err.message || 'Erro ao fazer login.';
        if (loginError) {
          loginError.textContent = msg;
        } else {
          alert(msg);
        }
      }
    });
  }

  // ---------------------- Logout ----------------------

  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      clearSession();
      showLogin();
    });
  }

  // ------------------- Inicialização ------------------

  const existingToken = getToken();
  if (existingToken) {
    showApp(getUserName() || 'Usuário');
  } else {
    showLogin();
  }
});

