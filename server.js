require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// USERS: ex: ALLOWED_USERS=Admin:SenhaForte123,usuario:Senha123
const rawAllowed = process.env.ALLOWED_USERS || "";
const allowedUsers = rawAllowed
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean)
  .map((pair) => {
    const [user, pass] = pair.split(":");
    return { user, pass };
  });

app.post("/login", (req, res) => {
  const { username, password } = req.body || {};
  const match = allowedUsers.find(
    (u) => u.user === username && u.pass === password
  );

  if (!match) {
    return res
      .status(401)
      .json({ success: false, message: "Usuário ou senha inválidos." });
  }

  return res.json({ success: true });
});

// Qualquer outra rota volta para o index.html (SPA simples)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Mural One rodando na porta ${PORT}`);
});
