// server.js
const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Usuários permitidos (pode colocar depois em ALLOWED_USERS no .env se quiser)
const VALID_USERS = (() => {
  const raw = process.env.ALLOWED_USERS || 'Admin:SenhaForte123';
  return raw.split(',').map(pair => {
    const [username, password] = pair.split(':');
    return {
      username: (username || '').trim(),
      password: (password || '').trim(),
    };
  }).filter(u => u.username && u.password);
})();

// Temas sensíveis que o agente não deve tratar
const BLOCKED_TOPICS = (process.env.BLOCKED_TOPICS || '')
  .split(',')
  .map(t => t.trim().toLowerCase())
  .filter(Boolean);

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
const GPT_SYSTEM_PROMPT =
  process.env.GPT_SYSTEM_PROMPT ||
  'Você é o assistente virtual interno da Picorelli Transportes. Responda de forma educada, objetiva e profissional.';

// Middlewares
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ------------- LOGIN -------------
app.post('/api/login', (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({
        ok: false,
        message: 'Informe usuário e senha.',
      });
    }

    const isValid = VALID_USERS.some(
      u => u.username === username && u.password === password
    );

    if (!isValid) {
      return res.status(401).json({
        ok: false,
        message: 'Usuário ou senha inválidos.',
      });
    }

    // Aqui poderíamos criar sessão/cookie.
    // Para simplificar, apenas avisamos o front que está tudo certo.
    return res.json({ ok: true, message: 'Login realizado com sucesso.' });
  } catch (err) {
    console.error('Erro em /api/login:', err);
    return res.status(500).json({
      ok: false,
      message: 'Erro interno ao validar login.',
    });
  }
});

// ------------- AGENTE GPT -------------
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body || {};

    if (!message || !message.trim()) {
      return res.status(400).json({
        ok: false,
        message: 'Mensagem vazia.',
      });
    }

    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY não configurada no ambiente.');
      return res.status(500).json({
        ok: false,
        message: 'API de IA não está configurada. Contate a Gerência de Tecnologia.',
      });
    }

    const lower = message.toLowerCase();
    if (BLOCKED_TOPICS.length && BLOCKED_TOPICS.some(t => lower.includes(t))) {
      return res.json({
        ok: true,
        answer:
          'Este assunto é sensível para a empresa. Procure diretamente o RH ou seu gestor para tratar desse tema.',
      });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: 'system', content: GPT_SYSTEM_PROMPT },
          { role: 'user', content: message },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Erro na OpenAI:', response.status, text);
      return res.status(502).json({
        ok: false,
        message: 'Erro ao conversar com o agente de IA. Tente novamente em alguns instantes.',
      });
    }

    const data = await response.json();
    const answer =
      data.choices?.[0]?.message?.content?.trim() ||
      'Não consegui gerar uma resposta no momento. Tente novamente.';

    return res.json({ ok: true, answer });
  } catch (err) {
    console.error('Erro em /api/chat:', err);
    return res.status(500).json({
      ok: false,
      message: 'Erro interno ao processar a mensagem.',
    });
  }
});

// ------------- FRONTEND (SPA em uma página) -------------
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ------------- START -------------
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
