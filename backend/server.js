require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const sharp = require('sharp');
const bcrypt = require('bcrypt');

const sqlite3 = require("sqlite3").verbose();
const { open } = require("sqlite");
const { v4: uuidv4 } = require('uuid');

const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');
const DB_FILE = process.env.DB_FILE || path.join(__dirname, 'db.sqlite');

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const app = express();
app.use(cors());
app.use(express.json());
// Serve o frontend estático e a pasta de uploads
app.use('/', express.static(path.join(__dirname, '..', 'frontend')));
app.use('/uploads', express.static(UPLOAD_DIR));

let db;

// Inicializar banco
(async () => {
  db = await open({
    filename: DB_FILE,
    driver: sqlite3.Database
  });

  // Tabela de usuários
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Tabela de produtos (Criação inicial)
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

  // [MIGRATION] Adicionar colunas novas se não existirem
  const addColumn = async (colName) => {
    try {
      await db.exec(`ALTER TABLE products ADD COLUMN ${colName} TEXT`);
      console.log(`Coluna '${colName}' adicionada com sucesso.`);
    } catch (e) {
      // Ignora erro se a coluna já existir
    }
  };

  await addColumn('primary_color');
  await addColumn('secondary_color');
  
  // [NOVO] Adicionando Categoria e Seção no banco
  await addColumn('category');
  await addColumn('section');

  console.log("Banco SQLite carregado e atualizado!");
})();

/* =============== MULTER (Upload de Imagens) =============== */
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
    if (!name || !email || !password) return res.status(400).json({ error: "Campos faltando." });
    const hash = await bcrypt.hash(password, 10);
    const result = await db.run("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)", [name, email, hash]);
    res.json({ id: result.lastID, name, email });
  } catch (err) {
    if (err.message.includes("UNIQUE")) return res.status(400).json({ error: "Email já cadastrado." });
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
    // [NOVO] Recebendo category e section
    const { title, description, price, stock, primary_color, secondary_color, category, section } = req.body;

    if (!title || !price || !stock)
      return res.status(400).json({ error: "Dados incompletos (Título, Preço e Estoque são obrigatórios)" });

    // Tratamento de imagem
    let filename = null;
    if (req.file) {
        filename = uuidv4() + ".jpg";
        const filepath = path.join(UPLOAD_DIR, filename);
        await sharp(req.file.buffer)
          .resize(800, 800, { fit: "cover" })
          .jpeg({ quality: 85 })
          .toFile(filepath);
    } else {
        return res.status(400).json({ error: "Imagem obrigatória" });
    }

    // [NOVO] Inserindo no banco com as novas colunas
    const result = await db.run(
      `INSERT INTO products (
          title, description, price, stock, image_path, 
          primary_color, secondary_color, category, section
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, price, stock, filename, primary_color, secondary_color, category, section]
    );

    res.json({
      id: result.lastID,
      title, description, price, stock,
      primary_color, secondary_color, category, section,
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

/* --- GET único --- */
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

    // [NOVO] Recebendo campos novos
    const { title, description, price, stock, primary_color, secondary_color, category, section } = req.body;

    let newImagePath = product.image_path;

    // Se enviou nova imagem, substitui a antiga
    if (req.file) {
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

    // [NOVO] Atualizando query SQL
    // Usamos "??" para manter o valor antigo se o novo for null/undefined
    await db.run(`
      UPDATE products SET
        title = ?, description = ?, price = ?, stock = ?, image_path = ?,
        primary_color = ?, secondary_color = ?, category = ?, section = ?
      WHERE id = ?
    `, [
      title ?? product.title,
      description ?? product.description,
      price !== undefined ? parseFloat(price) : product.price,
      stock !== undefined ? parseInt(stock) : product.stock,
      newImagePath,
      primary_color ?? product.primary_color,
      secondary_color ?? product.secondary_color,
      category ?? product.category,  // <--- Novo campo
      section ?? product.section,    // <--- Novo campo
      id
    ]);

    res.json({
      id,
      title: title ?? product.title,
      description: description ?? product.description,
      price: price ?? product.price,
      stock: stock ?? product.stock,
      primary_color: primary_color ?? product.primary_color,
      secondary_color: secondary_color ?? product.secondary_color,
      category: category ?? product.category,
      section: section ?? product.section,
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

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});