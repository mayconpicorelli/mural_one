// server.js
const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const OpenAI = require("openai");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// --------- OpenAI ----------
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// --------- Middlewares básicos ----------
app.use(express.json());

// CORS simples (útil caso você abra de outro domínio em algum momento)
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && (!allowedOrigins.length || allowedOrigins.includes(origin))) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
  }

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

// --------- Autenticação simples ----------

const rawUsers = process.env.ALLOWED_USERS || "Admin:SenhaForte123";

const allowedUsers = rawUsers
  .split(",")
  .map((pair) => {
    const [user, pass] = pair.split(":");
    return {
      user: (user || "").trim(),
      pass: (pass || "").trim(),
    };
  })
  .filter((u) => u.user && u.pass);

app.post("/login", (req, res) => {
  const { username, password } = req.body || {};

  const isValid = allowedUsers.some(
    (u) => u.user === username && u.pass === password
  );

  if (!isValid) {
    return res
      .status(401)
      .json({ success: false, message: "Usuário ou senha inválidos." });
  }

  return res.json({
    success: true,
    message: "Login realizado com sucesso.",
  });
});

// --------- Rota do agente GPT ----------

app.post("/api/chat", async (req, res) => {
  const { message, history } = req.body || {};

  if (!message) {
    return res
      .status(400)
      .json({ error: "Mensagem é obrigatória para o agente." });
  }

  try {
    const systemPrompt =
      process.env.GPT_SYSTEM_PROMPT ||
      "Você é o assistente virtual oficial da empresa Picorelli Transportes. Responda de forma objetiva, clara e profissional.";

    const messages = [
      { role: "system", content: systemPrompt },
      ...(Array.isArray(history) ? history : []),
      { role: "user", content: message },
    ];

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      messages,
      temperature: 0.3,
    });

    const reply =
      completion.choices?.[0]?.message?.content ||
      "Não foi possível gerar uma resposta agora.";

    res.json({ reply });
  } catch (error) {
    console.error("Erro ao consultar OpenAI:", error);
    res
      .status(500)
      .json({ error: "Erro ao consultar o agente de IA. Tente novamente." });
  }
});

// --------- Arquivos estáticos e SPA ----------
app.use(express.static(path.join(__dirname, "public")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Servidor Mural One rodando na porta ${PORT}`);
});
