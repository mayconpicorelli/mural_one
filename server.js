const express = require('express');
const path = require('path');
const fs = require('fs/promises');
const helmet = require('helmet');
const cors = require('cors');
const dotenv = require('dotenv');
const crypto = require('crypto');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_TTL = Number(process.env.SESSION_TTL_HOURS || 12) * 60 * 60 * 1000;
const DATA_CACHE_SECONDS = Number(process.env.DATA_CACHE_SECONDS || 60);
const DATA_FILE = path.join(__dirname, 'data', 'content.json');
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
const DEFAULT_SYSTEM_PROMPT = process.env.GPT_SYSTEM_PROMPT ||
  'Você é o assistente virtual oficial da empresa Picorelli Transportes. Responda sempre de forma educada, objetiva e profissional, ajudando colaboradores com dúvidas gerais e informações internas da empresa. Não responda perguntas sobre sexo, drogas, política, religião, violência, conteúdos ilegais ou qualquer assunto inapropriado ou que vá contra a ética ou as políticas da empresa. Se a pergunta envolver fatos muito recentes ou externos, explique apenas que sua resposta pode não estar totalmente atualizada e recomende confirmar em fontes oficiais. Não mencione datas específicas de treinamento nem frases como “meu conhecimento vai até 2023”; apenas diga que pode não ter dados das mudanças mais recentes. Nunca fale sobre salario dos colaboradores, se ta alto ou baixo, sobre demissao ou qualquer contúdo que possa ser sensivel a empresa. Você também não da preço de nenhum tipo de serviço que a empresa presta.';
const DEFAULT_TEMPERATURE = Number(process.env.GPT_DEFAULT_TEMPERATURE || 0.3);
const ROLE_ADMIN = 'admin';
const ROLE_USER = 'user';
const blockedTopics = (process.env.BLOCKED_TOPICS || '')
  .split(',')
  .map((item) => item.trim().toLowerCase())
  .filter(Boolean);

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

const userStore = buildUserStore(process.env.ALLOWED_USERS || 'Admin:SenhaForte123,usuario:Senha_Forte123');
const activeSessions = new Map();
let cachedPayload = null;
let lastPayloadUpdate = 0;

app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (!allowedOrigins.length || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin not allowed'));
  }
}));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario e senha sao obrigatorios.' });
  }

  const account = authenticateUser(username, password);
  if (!account) {
    return res.status(401).json({ error: 'Credenciais invalidas.' });
  }

  const token = crypto.randomUUID();
  const session = {
    username: account.username,
    role: account.role,
    token,
    expiresAt: Date.now() + SESSION_TTL
  };
  activeSessions.set(token, session);

  return res.json({ token, user: { username: account.username, role: account.role } });
});

app.post('/api/logout', authenticateToken, (req, res) => {
  activeSessions.delete(req.user.token);
  return res.json({ ok: true });
});

app.get('/api/dashboard-data', authenticateToken, async (req, res) => {
  try {
    const force = req.query?.refresh === '1';
    const payload = await loadDashboardPayload(force);
    return res.json({ ...payload, user: { username: req.user.username, role: req.user.role } });
  } catch (error) {
    console.error('Falha ao carregar o dashboard', error);
    return res.status(500).json({ error: 'Nao foi possivel carregar o conteudo.' });
  }
});

app.post('/api/chat', authenticateToken, async (req, res) => {
  const { message, history = [], temperature = 0.3, systemPrompt } = req.body || {};

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OPENAI_API_KEY nao configurada no servidor.' });
  }

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Mensagem invalida.' });
  }

  if (message.length > 2000) {
    return res.status(400).json({ error: 'Mensagem muito longa.' });
  }

  if (isRestrictedTopic(message)) {
    return res.status(400).json({ error: 'Este tema esta bloqueado.' });
  }

  const canAdjustSettings = req.user.role === ROLE_ADMIN;
  const safeTemperature = canAdjustSettings
    ? clamp(parseFloat(temperature), 0, 1)
    : DEFAULT_TEMPERATURE;

  const messages = [];
  const activeSystemPrompt = (canAdjustSettings && systemPrompt && systemPrompt.trim())
    ? systemPrompt.trim()
    : DEFAULT_SYSTEM_PROMPT;
  messages.push({ role: 'system', content: activeSystemPrompt });

  if (Array.isArray(history)) {
    history.forEach((entry) => {
      if (entry && entry.role && entry.content) {
        messages.push({ role: entry.role, content: entry.content });
      }
    });
  }

  messages.push({ role: 'user', content: message });

  try {
    const completion = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: safeTemperature,
        messages
      })
    });

    if (!completion.ok) {
      const errPayload = await completion.json().catch(() => null);
      console.error('Erro na API da OpenAI', errPayload || completion.statusText);
      return res.status(502).json({ error: 'Falha ao consultar a API de IA.' });
    }

    const data = await completion.json();
    const reply = data.choices?.[0]?.message?.content?.trim();
    return res.json({ reply: reply || 'Sem resposta no momento.' });
  } catch (error) {
    console.error('Erro ao falar com a OpenAI', error);
    return res.status(500).json({ error: 'Erro interno ao consultar a IA.' });
  }
});

app.get('/api/health', (req, res) => {
  return res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use((req, res, next) => {
  if (req.method !== 'GET') {
    return next();
  }
  if (req.path.startsWith('/api')) {
    return next();
  }
  return res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

setInterval(() => {
  const now = Date.now();
  Array.from(activeSessions.entries()).forEach(([token, session]) => {
    if (session.expiresAt <= now) {
      activeSessions.delete(token);
    }
  });
}, 10 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`Portal interno rodando em http://localhost:${PORT}`);
});

function buildUserStore(value) {
  const map = new Map();
  value
    .split(',')
    .map((pair) => pair.trim())
    .filter(Boolean)
    .forEach((pair) => {
      const segments = pair.split(':');
      const username = segments.shift()?.trim();
      const password = segments.join(':').trim();
      if (username && password) {
        map.set(username, {
          password,
          role: determineRole(username)
        });
      }
    });
  return map;
}

function authenticateUser(username, password) {
  const stored = userStore.get(username);
  if (stored && stored.password === password) {
    return { username, role: stored.role };
  }
  return null;
}

async function loadDashboardPayload(forceReload = false) {
  const now = Date.now();
  if (forceReload) {
    cachedPayload = null;
  }
  if (!cachedPayload || now - lastPayloadUpdate > DATA_CACHE_SECONDS * 1000) {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    cachedPayload = JSON.parse(raw);
    lastPayloadUpdate = now;
  }
  return cachedPayload;
}

function isRestrictedTopic(message) {
  if (!blockedTopics.length) return false;
  const normalized = message.toLowerCase();
  return blockedTopics.some((topic) => normalized.includes(topic));
}

function clamp(value, min, max) {
  if (Number.isNaN(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer', '').trim();
  if (!token) {
    return res.status(401).json({ error: 'Nao autorizado.' });
  }

  const session = activeSessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    activeSessions.delete(token);
    return res.status(401).json({ error: 'Sessao expirada.' });
  }

  req.user = { username: session.username, role: session.role, token };
  return next();
}

function determineRole(username = '') {
  return username.toLowerCase() === 'admin' ? ROLE_ADMIN : ROLE_USER;
}
