require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Monta mapa de usuários permitidos a partir do .env
function parseAllowedUsers(envValue) {
  return (envValue || '')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
    .reduce((acc, pair) => {
      const [user, pass] = pair.split(':');
      if (user && pass) acc[user] = pass;
      return acc;
    }, {});
}

const allowedUsers =
  parseAllowedUsers(process.env.ALLOWED_USERS) || { Admin: 'SenhaForte123' };

app.use(helmet());
app.use(cors());
app.use(express.json());

// Arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Login simples (sem sessão de servidor, só validação)
app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res
      .status(400)
      .json({ success: false, message: 'Usuário e senha são obrigatórios.' });
  }

  const stored = allowedUsers[username];
  if (!stored || stored !== password) {
    return res
      .status(401)
      .json({ success: false, message: 'Usuário ou senha inválidos.' });
  }

  return res.json({ success: true });
});

// Logout “fake” (apenas para manter a API consistente)
app.post('/api/logout', (req, res) => {
  return res.json({ success: true });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Rota raiz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Mural One rodando na porta ${PORT}`);
});
