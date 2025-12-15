// public/app.js

document.addEventListener('DOMContentLoaded', function () {
  console.log('app.js carregado');

  var loginForm = document.getElementById('login-form');
  var loginError = document.getElementById('login-error');
  var loginContainer = document.getElementById('login-container');
  var appContainer = document.getElementById('app-container');
  var logoutBtn = document.getElementById('btn-logout');
  var userNameSpan = document.getElementById('user-name');

  if (!loginForm) {
    console.error('Form de login não encontrado (id="login-form")');
    return;
  }

  // --------- SUBMIT LOGIN ----------
  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    console.log('submit de login disparado');

    if (loginError) loginError.textContent = '';

    var usernameEl = document.getElementById('username');
    var passwordEl = document.getElementById('password');

    var username = usernameEl ? usernameEl.value.trim() : '';
    var password = passwordEl ? passwordEl.value.trim() : '';

    if (!username || !password) {
      if (loginError) loginError.textContent = 'Informe usuário e senha.';
      return;
    }

    fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username, password: password })
    })
      .then(function (res) {
        return res.text().then(function (text) {
          console.log('Resposta de /api/login:', res.status, text);

          var data;
          try {
            data = JSON.parse(text);
          } catch (e) {
            console.error('Não consegui fazer parse do JSON:', text);
            if (loginError) loginError.textContent = 'Resposta inválida do servidor.';
            return;
          }

          if (!res.ok || !data.success) {
            var msg = (data && data.message) || 'Usuário ou senha inválidos.';
            if (loginError) loginError.textContent = msg;
            return;
          }

          // SUCESSO
          var token = data.token || '';
          localStorage.setItem('mural_token', token);
          localStorage.setItem('mural_user', data.username || username);

          if (loginContainer) loginContainer.style.display = 'none';
          if (appContainer) appContainer.style.display = 'block';
          if (userNameSpan) userNameSpan.textContent = data.username || username;
        });
      })
      .catch(function (err) {
        console.error('Erro ao chamar /api/login:', err);
        if (loginError) loginError.textContent = 'Erro ao conectar ao servidor.';
      });
  });

  // --------- LOGOUT ----------
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function (e) {
      e.preventDefault();
      localStorage.removeItem('mural_token');
      localStorage.removeItem('mural_user');
      if (appContainer) appContainer.style.display = 'none';
      if (loginContainer) loginContainer.style.display = 'block';
    });
  }

  // --------- INICIALIZAÇÃO (se já tiver token salvo) ----------
  var existingToken = localStorage.getItem('mural_token');
  var existingUser = localStorage.getItem('mural_user');

  if (existingToken) {
    if (loginContainer) loginContainer.style.display = 'none';
    if (appContainer) appContainer.style.display = 'block';
    if (userNameSpan && existingUser) userNameSpan.textContent = existingUser;
  }
});


