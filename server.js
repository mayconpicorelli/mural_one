require('dotenv').config();

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(helmet());
app.use(cors());
app.use(bodyParser.json());

// Servir os arquivos estáticos do front (login, mural, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// ---------------- LOGIN / SESSÃO ----------------

function parseAllowedUsers(str) {
  const users = {};
  if (!str) return users;

  str
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
    .forEach((pair) => {
      const [user, pass] = pair.split(':');
      if (user && pass) users[user] = pass;
    });

  return users;
}

// Se não tiver ALLOWED_USERS no Render, usa pelo menos Admin:SenhaForte123
const allowedUsers = parseAllowedUsers(
  process.env.ALLOWED_USERS || 'Admin:SenhaForte123'
);

const SESSION_TTL_HOURS = Number(process.env.SESSION_TTL_HOURS || '12') || 12;
const sessions = new Map(); // token -> { username, expiresAt }

function createToken() {
  return crypto.randomBytes(24).toString('hex');
}

// Rota de login – sempre responde JSON
app.post('/api/login', (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res
        .status(400)
        .json({ success: false, message: 'Usuário e senha são obrigatórios.' });
    }

    const expectedPassword = allowedUsers[username];

    if (!expectedPassword || expectedPassword !== password) {
      return res
        .status(401)
        .json({ success: false, message: 'Usuário ou senha inválidos.' });
    }

    const token = createToken();
    const expiresAt = Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000;
    sessions.set(token, { username, expiresAt });

    return res.json({ success: true, token, username });
  } catch (err) {
    console.error('Erro em /api/login', err);
    return res
      .status(500)
      .json({ success: false, message: 'Erro interno no servidor (login).' });
  }
});

// Middleware de autenticação para demais rotas /api
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

  if (!token || !sessions.has(token)) {
    return res
      .status(401)
      .json({ success: false, message: 'Sessão expirada. Faça login novamente.' });
  }

  const session = sessions.get(token);
  if (session.expiresAt < Date.now()) {
    sessions.delete(token);
    return res
      .status(401)
      .json({ success: false, message: 'Sessão expirada. Faça login novamente.' });
  }

  req.user = session.username;
  next();
}

// Exemplo de rota protegida (pode adaptar depois)
app.post('/api/chat', authMiddleware, async (req, res) => {
  return res.json({
    success: true,
    reply:
      'Integração com IA ainda não está configurada aqui no servidor. Mas o login está funcionando.',
  });
});

// Qualquer /api/* que não existir -> JSON 404 (não HTML)
app.use('/api', (req, res) => {
  return res.status(404).json({ success: false, message: 'Rota de API não encontrada.' });
});

// Demais rotas -> devolve o index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Tratamento global de erros
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  if (req.path.startsWith('/api/')) {
    return res
      .status(500)
      .json({ success: false, message: 'Erro interno no servidor.' });
  }
  return res.status(500).send('Erro interno.');
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

