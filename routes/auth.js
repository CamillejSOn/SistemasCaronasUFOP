const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');

const JWT_SECRET = process.env.JWT_SECRET || 'ufop_caronas_secret_2024';

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { nome, email, senha, cidade_base } = req.body;
    if (!nome || !email || !senha || !cidade_base)
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });

    const existe = await db.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (existe.rows.length > 0)
      return res.status(409).json({ error: 'E-mail já cadastrado' });

    const senha_hash = await bcrypt.hash(senha, 10);
    const result = await db.query(
      'INSERT INTO usuarios (nome, email, senha_hash, cidade_base) VALUES ($1,$2,$3,$4) RETURNING id, nome, email, cidade_base, is_admin',
      [nome, email, senha_hash, cidade_base]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, nome: user.nome, email: user.email, is_admin: user.is_admin }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ message: 'Usuário cadastrado com sucesso', token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });

    const result = await db.query('SELECT * FROM usuarios WHERE email = $1 AND ativo = TRUE', [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Credenciais inválidas' });

    const user = result.rows[0];
    const senhaCorreta = await bcrypt.compare(senha, user.senha_hash);
    if (!senhaCorreta) return res.status(401).json({ error: 'Credenciais inválidas' });

    const token = jwt.sign({ id: user.id, nome: user.nome, email: user.email, is_admin: user.is_admin }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Login realizado com sucesso', token, user: { id: user.id, nome: user.nome, email: user.email, cidade_base: user.cidade_base, is_admin: user.is_admin } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
