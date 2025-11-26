const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(cors());
app.use(express.json());

// Conectar ao SQLite
const db = new sqlite3.Database('./database.db');

// Criar tabela caso não exista
db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT,
  email TEXT UNIQUE,
  senha TEXT
)`);

// Rota de registrar
app.post('/register', (req, res) => {
  const { nome, email, senha } = req.body;

  db.run(
    `INSERT INTO users (nome, email, senha) VALUES (?, ?, ?)`,
    [nome, email, senha],
    function(err) {
      if (err) return res.json({ error: err.message });
      res.json({ message: "Conta criada!" });
    }
  );
});

// Rota de login
app.post('/login', (req, res) => {
  const { email, senha } = req.body;

  db.get(
    `SELECT * FROM users WHERE email = ? AND senha = ?`,
    [email, senha],
    (err, row) => {
      if (err) return res.json({ error: err.message });
      if (!row) return res.json({ error: "Credenciais inválidas" });

      res.json({ message: "Login realizado!", user: row });
    }
  );
});

app.listen(3000, () => console.log("Servidor rodando na porta 3000"));
