require('dotenv').config();

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- LOGIN SIMPLES COM USUÁRIOS DO .ENV ----------
const rawUsers = process.env.ALLOWED_USERS || '';
const ALLOWED_USERS = rawUsers
  .split(',')
  .map((pair) => {
    const [user, pass] = pair.split(':');
    return user && pass ? { user: user.trim(), pass: pass.trim() } : null;
  })
  .filter(Boolean);

function isValidUser(username, password) {
  return ALLOWED_USERS.some(
    (u) => u.user === username && u.pass === password
  );
}

// ---------- MIDDLEWARES ----------
app.use(helmet());
app.use(cors());
app.use(express.json());

// arquivos estáticos (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// ---------- ROTAS DE API ----------

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res
      .status(400)
      .json({ success: false, message: 'Usuário e senha são obrigatórios.' });
  }

  if (!isValidUser(username, password)) {
    return res
      .status(401)
      .json({ success: false, message: 'Usuário ou senha inválidos.' });
  }

  // Sem sessão real por enquanto: frontend só usa esse "ok"
  return res.json({
    success: true,
    user: { name: username }
  });
});

async function loadAnnouncementsFromSheet() {
  const sheetId = process.env.SHEETS_SPREADSHEET_ID;
  const sheetRange = process.env.SHEETS_RANGE;
  const apiKey = process.env.SHEETS_API_KEY;

  if (!sheetId || !sheetRange || !apiKey) {
    return null;
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(
    sheetRange
  )}?key=${apiKey}`;

  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Sheets API respondeu ${resp.status}`);
  }

  const sheetData = await resp.json();
  const rows = Array.isArray(sheetData.values) ? sheetData.values : [];

  return rows
    .map((row) => ({
      tag: row[0] || 'Aviso',
      title: row[1] || '',
      body: row[2] || ''
    }))
    .filter(
      (item) => item.title.trim() || item.body.trim()
    );
}

// Conteúdo do mural (avisos + calendário)
app.get('/api/content', async (req, res) => {
  try {
    const contentPath = path.join(__dirname, 'data', 'content.json');
    const raw = fs.readFileSync(contentPath, 'utf8');
    const data = JSON.parse(raw);

    try {
      const sheetAnnouncements = await loadAnnouncementsFromSheet();
      if (sheetAnnouncements && sheetAnnouncements.length) {
        data.announcements = sheetAnnouncements;
      }
    } catch (sheetError) {
      console.error('Falha ao buscar dados da planilha:', sheetError);
    }

    res.json(data);
  } catch (err) {
    console.error('Erro ao ler content.json:', err);
    res.status(500).json({ error: 'Erro ao carregar conteúdo do mural.' });
  }
});

// Chat com GPT usando fetch nativo (Node 18+)
app.post('/api/chat', async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res
        .status(500)
        .json({ error: 'OPENAI_API_KEY não configurada no servidor.' });
    }

    const { message, history } = req.body || {};
    if (!message) {
      return res
        .status(400)
        .json({ error: 'Mensagem é obrigatória.' });
    }

    const systemPrompt =
      process.env.GPT_SYSTEM_PROMPT ||
      'Você é o assistente virtual oficial de uma empresa. Responda sempre de forma educada, objetiva e profissional, ajudando colaboradores com dúvidas gerais e informações internas da empresa. Não responda perguntas sobre sexo, drogas, política, religião, violência, conteúdos ilegais ou qualquer assunto inapropriado ou que vá contra a ética ou as políticas da empresa. Se a pergunta envolver fatos muito recentes ou externos, explique apenas que sua resposta pode não estar totalmente atualizada mas se empenhe em pesquisar em fontes confiaveis na internet e recomende confirmar em fontes oficiais. Não mencione datas específicas de treinamento nem frases como “meu conhecimento vai até 2023”; apenas diga que pode não ter dados das mudanças mais recentes. Nunca fale sobre salario dos colaboradores, se ta alto ou baixo, sobre demissao ou qualquer contúdo que possa ser sensivel a empresa. Você também não da preço de nenhum tipo de serviço que a empresa presta. Você não incentiva praticas colaborativas ou valorizações sobre raças, ou opções de generos, Você se for perguntado sobre isso, apenas fale que a empresa valoriza sempre promove um ambiente de respeito, mas nunca diga que diversidades sexuais são boas ou ruins para a empresa, se contenha apenas em respeito independente de generos, não mencione nada sobre ambiente inclusivo.';

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(Array.isArray(history) ? history : []),
      { role: 'user', content: message }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
        messages,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Erro OpenAI:', response.status, text);
      return res
        .status(502)
        .json({ error: 'Erro ao comunicar com o agente de IA.' });
    }

    const data = await response.json();
    const reply =
      data.choices?.[0]?.message?.content ||
      'Não foi possível gerar uma resposta no momento.';

    res.json({ reply });
  } catch (error) {
    console.error('Erro em /api/chat:', error);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// Rota principal (devolve index.html)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Healthcheck
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ---------- INICIAR SERVIDOR ----------
app.listen(PORT, () => {
  console.log(`Servidor Mural One rodando na porta ${PORT}`);
});
