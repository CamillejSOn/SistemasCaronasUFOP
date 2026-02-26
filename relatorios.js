const express = require("express");
const router = express.Router();
const { Pool } = require("pg");

// Conexão com o banco de dados (usa variáveis do .env)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// ===============================
// HISTÓRIA 9
// Relatório geral de uso do sistema
// ===============================
router.get("/relatorios", async (req, res) => {
  try {
    const usuarios = await pool.query("SELECT COUNT(*) FROM usuarios");
    const caronas = await pool.query("SELECT COUNT(*) FROM caronas");
    const reservas = await pool.query("SELECT COUNT(*) FROM reservas");

    res.json({
      total_usuarios: usuarios.rows[0].count,
      total_caronas: caronas.rows[0].count,
      total_reservas: reservas.rows[0].count,
    });
  } catch (error) {
    res.status(500).json({
      erro: "Erro ao gerar relatório do sistema",
    });
  }
});

// ===============================
// HISTÓRIA 10
// Rotas mais utilizadas
// ===============================
router.get("/rotas-populares", async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT origem, destino, COUNT(*) AS quantidade
      FROM caronas
      GROUP BY origem, destino
      ORDER BY quantidade DESC
    `);

    res.json(resultado.rows);
  } catch (error) {
    res.status(500).json({
      erro: "Erro ao gerar relatório de rotas populares",
    });
  }
});

module.exports = router;
