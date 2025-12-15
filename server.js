// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares básicos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos da pasta "public"
app.use(express.static(path.join(__dirname, 'public')));

// Login super simples: usuário/senha fixos
// (depois podemos ligar isso ao .env ou a um banco)
const VALID_USERS = {
  Admin: 'SenhaForte123', // ajuste aqui se quiser outra senha
};

// Rota de login: recebe JSON { username, password }
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (VALID_USERS[username] && VALID_USERS[username] === password) {
    return res.json({ success: true });
  }

  return res.status(401).json({
    success: false,
    message: 'Usuário ou senha inválidos.',
  });
});

// Rota principal: sempre entrega o index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
