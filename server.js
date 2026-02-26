require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET não definido');
}


app.use(cors({
  origin: [
    'http://localhost:5500',
    'http://127.0.0.1:5500'
  ],
  credentials: true
}));

// ─── Banco de Dados ─────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ufop_caronas',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// ─── Middlewares ─────────────────────────────────────────────
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Auth Middleware ─────────────────────────────────────────
function auth(req, res, next) {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ erro: 'Não autenticado' });
  try {
    req.usuario = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ erro: 'Token inválido' });
  }
}

function adminAuth(req, res, next) {
  auth(req, res, () => {
    if (!req.usuario.eh_admin) return res.status(403).json({ erro: 'Acesso negado' });
    next();
  });
}

// ══════════════════════════════════════════════════════════════
// ROTAS DE AUTENTICAÇÃO
// ══════════════════════════════════════════════════════════════

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  const { nome, email, senha, cidade_base, curso, telefone } = req.body;
  if (!nome || !email || !senha || !cidade_base)
    return res.status(400).json({ erro: 'Preencha todos os campos obrigatórios' });
  try {
    const existe = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (existe.rows.length) return res.status(409).json({ erro: 'E-mail já cadastrado' });
    const hash = await bcrypt.hash(senha, 10);
    const { rows } = await pool.query(
      'INSERT INTO usuarios (nome, email, senha_hash, cidade_base, curso, telefone) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, nome, email, cidade_base, eh_admin',
      [nome, email, hash, cidade_base, curso || null, telefone || null]
    );
    const token = jwt.sign({ id: rows[0].id, nome: rows[0].nome, email: rows[0].email, eh_admin: rows[0].eh_admin }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 3600 * 1000 });
    res.json({ usuario: rows[0], token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ erro: 'E-mail e senha são obrigatórios' });
  try {
    const { rows } = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (!rows.length) return res.status(401).json({ erro: 'Credenciais inválidas' });
    const ok = await bcrypt.compare(senha, rows[0].senha_hash);
    if (!ok) return res.status(401).json({ erro: 'Credenciais inválidas' });
    const usuario = { id: rows[0].id, nome: rows[0].nome, email: rows[0].email, cidade_base: rows[0].cidade_base, eh_admin: rows[0].eh_admin };
    const token = jwt.sign(usuario, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 3600 * 1000 });
    res.json({ usuario, token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// POST /api/auth/logout
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ mensagem: 'Logout realizado' });
});

// GET /api/auth/me
app.get('/api/auth/me', auth, (req, res) => {
  res.json({ usuario: req.usuario });
});

// ══════════════════════════════════════════════════════════════
// ROTAS DE CARONAS
// ══════════════════════════════════════════════════════════════

// GET /api/caronas — busca com filtros
app.get('/api/caronas', async (req, res) => {
  const { origem, destino, data, vagas_min } = req.query;
  let query = `
    SELECT c.*, u.nome AS motorista_nome, u.telefone AS motorista_telefone, u.curso AS motorista_curso
    FROM caronas c
    JOIN usuarios u ON u.id = c.motorista_id
    WHERE c.status = 'ativa' AND c.data_viagem >= CURRENT_DATE AND c.vagas_disponiveis > 0
  `;
  const params = [];
  if (origem) { params.push(`%${origem}%`); query += ` AND c.origem ILIKE $${params.length}`; }
  if (destino) { params.push(`%${destino}%`); query += ` AND c.destino ILIKE $${params.length}`; }
  if (data) { params.push(data); query += ` AND c.data_viagem = $${params.length}`; }
  if (vagas_min) { params.push(parseInt(vagas_min)); query += ` AND c.vagas_disponiveis >= $${params.length}`; }
  query += ' ORDER BY c.data_viagem, c.horario';
  try {
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// GET /api/caronas/:id
app.get('/api/caronas/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.*, u.nome AS motorista_nome, u.telefone AS motorista_telefone
       FROM caronas c JOIN usuarios u ON u.id = c.motorista_id WHERE c.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ erro: 'Carona não encontrada' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// POST /api/caronas
app.post('/api/caronas', auth, async (req, res) => {
  const { origem, destino, data_viagem, horario, vagas_total, valor_contribuicao, observacoes } = req.body;
  if (!origem || !destino || !data_viagem || !horario || !vagas_total)
    return res.status(400).json({ erro: 'Preencha todos os campos obrigatórios' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO caronas (motorista_id, origem, destino, data_viagem, horario, vagas_total, vagas_disponiveis, valor_contribuicao, observacoes)
       VALUES ($1,$2,$3,$4,$5,$6,$6,$7,$8) RETURNING *`,
      [req.usuario.id, origem, destino, data_viagem, horario, vagas_total, valor_contribuicao || 0, observacoes || null]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// DELETE /api/caronas/:id (cancelar)
app.delete('/api/caronas/:id', auth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM caronas WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ erro: 'Carona não encontrada' });
    if (rows[0].motorista_id !== req.usuario.id && !req.usuario.eh_admin)
      return res.status(403).json({ erro: 'Sem permissão' });
    await pool.query("UPDATE caronas SET status = 'cancelada' WHERE id = $1", [req.params.id]);
    res.json({ mensagem: 'Carona cancelada' });
  } catch (e) {
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// GET /api/caronas/:id/passageiros
app.get('/api/caronas/:id/passageiros', auth, async (req, res) => {
  try {
    const carona = await pool.query('SELECT motorista_id FROM caronas WHERE id = $1', [req.params.id]);
    if (!carona.rows.length) return res.status(404).json({ erro: 'Carona não encontrada' });
    if (carona.rows[0].motorista_id !== req.usuario.id && !req.usuario.eh_admin)
      return res.status(403).json({ erro: 'Sem permissão' });
    const { rows } = await pool.query(
      `SELECT u.nome, u.email, u.telefone, u.curso, r.criado_em, r.id AS reserva_id
       FROM reservas r JOIN usuarios u ON u.id = r.passageiro_id
       WHERE r.carona_id = $1 AND r.status = 'confirmada'`,
      [req.params.id]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// ══════════════════════════════════════════════════════════════
// ROTAS DE RESERVAS
// ══════════════════════════════════════════════════════════════

// POST /api/reservas
app.post('/api/reservas', auth, async (req, res) => {
  const { carona_id } = req.body;
  if (!carona_id) return res.status(400).json({ erro: 'carona_id é obrigatório' });
  try {
    const carona = await pool.query('SELECT * FROM caronas WHERE id = $1', [carona_id]);
    if (!carona.rows.length) return res.status(404).json({ erro: 'Carona não encontrada' });
    if (carona.rows[0].status !== 'ativa') return res.status(400).json({ erro: 'Carona não está ativa' });
    if (carona.rows[0].vagas_disponiveis <= 0) return res.status(400).json({ erro: 'Sem vagas disponíveis' });
    if (carona.rows[0].motorista_id === req.usuario.id) return res.status(400).json({ erro: 'Motorista não pode reservar sua própria carona' });
    const jaReservou = await pool.query(
      "SELECT id FROM reservas WHERE passageiro_id = $1 AND carona_id = $2 AND status = 'confirmada'",
      [req.usuario.id, carona_id]
    );
    if (jaReservou.rows.length) return res.status(409).json({ erro: 'Você já tem uma reserva nesta carona' });
    const { rows } = await pool.query(
      'INSERT INTO reservas (passageiro_id, carona_id) VALUES ($1, $2) RETURNING *',
      [req.usuario.id, carona_id]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// DELETE /api/reservas/:id (cancelar reserva)
app.delete('/api/reservas/:id', auth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM reservas WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ erro: 'Reserva não encontrada' });
    if (rows[0].passageiro_id !== req.usuario.id && !req.usuario.eh_admin)
      return res.status(403).json({ erro: 'Sem permissão' });
    await pool.query("UPDATE reservas SET status = 'cancelada' WHERE id = $1", [req.params.id]);
    res.json({ mensagem: 'Reserva cancelada' });
  } catch (e) {
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// ══════════════════════════════════════════════════════════════
// HISTÓRICO
// ══════════════════════════════════════════════════════════════

app.get('/api/historico', auth, async (req, res) => {
  try {
    const oferecidas = await pool.query(
      `SELECT c.*, COUNT(r.id) FILTER (WHERE r.status = 'confirmada') AS total_passageiros
       FROM caronas c LEFT JOIN reservas r ON r.carona_id = c.id
       WHERE c.motorista_id = $1 GROUP BY c.id ORDER BY c.data_viagem DESC`,
      [req.usuario.id]
    );
    const reservadas = await pool.query(
      `SELECT c.*, u.nome AS motorista_nome, u.telefone AS motorista_telefone, r.id AS reserva_id, r.status AS reserva_status
       FROM reservas r JOIN caronas c ON c.id = r.carona_id JOIN usuarios u ON u.id = c.motorista_id
       WHERE r.passageiro_id = $1 ORDER BY c.data_viagem DESC`,
      [req.usuario.id]
    );
    res.json({ oferecidas: oferecidas.rows, reservadas: reservadas.rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// ══════════════════════════════════════════════════════════════
// ADMIN
// ══════════════════════════════════════════════════════════════

app.get('/api/admin/relatorios', adminAuth, async (req, res) => {
  try {
    const [usuarios, caronas, reservas, ativas, canceladas, concluidas] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM usuarios WHERE NOT eh_admin'),
      pool.query('SELECT COUNT(*) FROM caronas'),
      pool.query("SELECT COUNT(*) FROM reservas WHERE status = 'confirmada'"),
      pool.query("SELECT COUNT(*) FROM caronas WHERE status = 'ativa'"),
      pool.query("SELECT COUNT(*) FROM caronas WHERE status = 'cancelada'"),
      pool.query("SELECT COUNT(*) FROM caronas WHERE status = 'concluida'"),
    ]);
    res.json({
      total_usuarios: parseInt(usuarios.rows[0].count),
      total_caronas: parseInt(caronas.rows[0].count),
      total_reservas: parseInt(reservas.rows[0].count),
      caronas_ativas: parseInt(ativas.rows[0].count),
      caronas_canceladas: parseInt(canceladas.rows[0].count),
      caronas_concluidas: parseInt(concluidas.rows[0].count),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

app.get('/api/admin/rotas', adminAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT origem, destino, COUNT(*) AS total,
             SUM(CASE WHEN status = 'ativa' THEN 1 ELSE 0 END) AS ativas,
             SUM(CASE WHEN status = 'concluida' THEN 1 ELSE 0 END) AS concluidas
      FROM caronas
      GROUP BY origem, destino
      ORDER BY total DESC
      LIMIT 20
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ erro: 'Erro interno' });
  }
});

app.get('/api/admin/usuarios', adminAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.nome, u.email, u.cidade_base, u.curso, u.criado_em,
              COUNT(DISTINCT c.id) AS caronas_oferecidas,
              COUNT(DISTINCT r.id) AS reservas_feitas
       FROM usuarios u
       LEFT JOIN caronas c ON c.motorista_id = u.id
       LEFT JOIN reservas r ON r.passageiro_id = u.id AND r.status = 'confirmada'
       WHERE NOT u.eh_admin
       GROUP BY u.id ORDER BY u.criado_em DESC`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// ─── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚗 UFOP Caronas rodando em http://localhost:${PORT}\n`);
});
