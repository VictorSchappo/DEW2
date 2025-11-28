require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const sharp = require('sharp');
const bcrypt = require('bcrypt');

// CORRETO: usar sqlite + sqlite3
const sqlite3 = require("sqlite3").verbose();
const { open } = require("sqlite");

const { v4: uuidv4 } = require('uuid');

const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');
const DB_FILE = process.env.DB_FILE || path.join(__dirname, 'db.sqlite');

// cria pasta uploads se não existir
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const app = express();
app.use(cors());
app.use(express.json());

// servir frontend (opcional)
app.use('/', express.static(path.join(__dirname, '..', 'frontend')));

// servir imagens
app.use('/uploads', express.static(UPLOAD_DIR));

let db;

// Inicializar banco corretamente
(async () => {
  db = await open({
    filename: DB_FILE,
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      stock INTEGER NOT NULL,
      image_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log("Banco SQLite carregado!");
})();

/* =============== MULTER =============== */
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/'))
      return cb(new Error('Arquivo inválido — somente imagens.'));
    cb(null, true);
  }
});

/* =============== ROTAS AUTH =============== */

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: "Campos faltando." });

    const hash = await bcrypt.hash(password, 10);

    const result = await db.run(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      [name, email, hash]
    );

    res.json({ id: result.lastID, name, email });

  } catch (err) {
    if (err.message.includes("UNIQUE"))
      return res.status(400).json({ error: "Email já cadastrado." });

    console.error(err);
    res.status(500).json({ error: "Erro interno." });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await db.get("SELECT * FROM users WHERE email = ?", [email]);

    if (!user) return res.status(401).json({ error: "Credenciais inválidas." });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Credenciais inválidas." });

    res.json({ id: user.id, name: user.name, email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno." });
  }
});

/* =============== ROTAS PRODUCTS =============== */

/* --- POST criar produto --- */
app.post('/api/products', upload.single('image'), async (req, res) => {
  try {
    const { title, description, price, stock } = req.body;

    if (!title || !price || !stock)
      return res.status(400).json({ error: "Dados incompletos" });

    if (!req.file)
      return res.status(400).json({ error: "Imagem obrigatória" });

    const filename = uuidv4() + ".jpg";
    const filepath = path.join(UPLOAD_DIR, filename);

    await sharp(req.file.buffer)
      .resize(800, 800, { fit: "cover" })
      .jpeg({ quality: 85 })
      .toFile(filepath);

    const result = await db.run(
      `INSERT INTO products (title, description, price, stock, image_path)
       VALUES (?, ?, ?, ?, ?)`,
      [title, description, price, stock, filename]
    );

    res.json({
      id: result.lastID,
      title,
      description,
      price,
      stock,
      image_url: "/uploads/" + filename
    });

  } catch (err) {
    console.error("ERRO EM POST /api/products:", err);
    res.status(500).json({ error: "Erro interno" });
  }
});

/* --- GET todos --- */
app.get('/api/products', async (req, res) => {
  try {
    const rows = await db.all("SELECT * FROM products ORDER BY id DESC");
    res.json(
      rows.map(p => ({
        ...p,
        image_url: p.image_path ? "/uploads/" + p.image_path : null
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar produtos" });
  }
});

/* --- GET único (para preencher edição) --- */
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await db.get("SELECT * FROM products WHERE id = ?", [req.params.id]);
    if (!product) return res.status(404).json({ error: "Produto não encontrado." });
    
    res.json({
      ...product,
      image_url: product.image_path ? "/uploads/" + product.image_path : null
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar produto." });
  }
});

/* --- PUT atualizar produto --- */
app.put('/api/products/:id', upload.single('image'), async (req, res) => {
  try {
    const id = req.params.id;

    const product = await db.get("SELECT * FROM products WHERE id = ?", [id]);
    if (!product) return res.status(404).json({ error: "Produto não encontrado." });

    const { title, description, price, stock } = req.body;

    let newImagePath = product.image_path;

    // Se enviaram nova imagem
    if (req.file) {
      // Apaga imagem antiga
      if (product.image_path) {
        const old = path.join(UPLOAD_DIR, product.image_path);
        if (fs.existsSync(old)) fs.unlinkSync(old);
      }

      const filename = uuidv4() + ".jpg";
      const filepath = path.join(UPLOAD_DIR, filename);

      await sharp(req.file.buffer)
        .resize(800, 800, { fit: "cover" })
        .jpeg({ quality: 85 })
        .toFile(filepath);

      newImagePath = filename;
    }

    await db.run(`
      UPDATE products SET
        title = ?, description = ?, price = ?, stock = ?, image_path = ?
      WHERE id = ?
    `, [
      title ?? product.title,
      description ?? product.description,
      price !== undefined ? parseFloat(price) : product.price,
      stock !== undefined ? parseInt(stock) : product.stock,
      newImagePath,
      id
    ]);

    res.json({
      id,
      title: title ?? product.title,
      description: description ?? product.description,
      price: price ?? product.price,
      stock: stock ?? product.stock,
      image_url: "/uploads/" + newImagePath
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao atualizar produto." });
  }
});

/* --- DELETE --- */
app.delete('/api/products/:id', async (req, res) => {
  try {
    const p = await db.get("SELECT image_path FROM products WHERE id = ?", [req.params.id]);

    if (!p) return res.status(404).json({ error: "Produto não encontrado." });

    if (p.image_path) {
      const f = path.join(UPLOAD_DIR, p.image_path);
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }

    await db.run("DELETE FROM products WHERE id = ?", [req.params.id]);

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao apagar produto." });
  }
});

/* ==== Start ==== */
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
