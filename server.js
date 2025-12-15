const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares básicos
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// ----- LOGIN SIMPLES -----
// Formato esperado (em variável de ambiente ou .env):
// ALLOWED_USERS=Admin:SenhaForte123,outroUsuario:OutraSenha
const USERS_CONFIG = process.env.ALLOWED_USERS || 'Admin:SenhaForte123';

const USERS = USERS_CONFIG.split(',')
  .map((pair) => {
    const [user, pass] = pair.split(':');
    return { user: (user || '').trim(), pass: (pass || '').trim() };
  })
  .filter((u) => u.user && u.pass);

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({
      ok: false,
      error: 'MISSING_FIELDS',
      message: 'Informe usuário e senha.',
    });
  }

  const match = USERS.find(
    (u) => u.user === username.trim() && u.pass === password.trim()
  );

  if (!match) {
    return res.status(401).json({
      ok: false,
      error: 'INVALID_CREDENTIALS',
      message: 'Usuário ou senha inválidos.',
    });
  }

  return res.json({
    ok: true,
    message: 'Login realizado com sucesso.',
  });
});

// Rota principal -> index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// Sobe o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
