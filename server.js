// server.js
require('dotenv').config();

const express = require('express');
const path = require('path');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// Segurança básica
app.use(helmet());

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// ----- LOGIN -----

// Formato esperado em ALLOWED_USERS:
// "Admin:SenhaForte123,usuario:Senha_Forte123"
function getAllowedUsers() {
  const raw = process.env.ALLOWED_USERS || 'Admin:SenhaForte123';
  return raw
    .split(',')
    .map((pair) => pair.trim())
    .filter(Boolean)
    .map((pair) => {
      const [user, pass] = pair.split(':');
      return {
        user: (user || '').trim(),
        pass: (pass || '').trim(),
      };
    });
}

app.post('/login', (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(200).json({
        success: false,
        message: 'Usuário e senha são obrigatórios.',
      });
    }

    const allowedUsers = getAllowedUsers();

    const isValid = allowedUsers.some((u) => {
      return (
        u.user &&
        u.pass &&
        username.toString().toLowerCase() === u.user.toLowerCase() &&
        password === u.pass
      );
    });

    if (!isValid) {
      return res.status(200).json({
        success: false,
        message: 'Usuário ou senha inválidos.',
      });
    }

    // Aqui poderíamos criar sessão/cookie.
    // Por enquanto, só avisamos sucesso para o frontend.
    return res.status(200).json({
      success: true,
      message: 'Autenticado com sucesso.',
    });
  } catch (err) {
    console.error('Erro no /login:', err);
    return res.status(500).json({
      success: false,
      message: 'Erro interno no servidor.',
    });
  }
});

// ----- ROTAS DE PÁGINA -----

// Todas as requisições GET entregam o index.html (SPA simples)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ----- START -----
app.listen(PORT, () => {
  console.log(`Servidor iniciado na porta ${PORT}`);
});
