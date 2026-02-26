const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'ufop_caronas_secret_2024';

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (!req.user?.eh_admin) return res.status(403).json({ error: 'Acesso negado: requer privilégio de administrador' });
  next();
};

module.exports = { authMiddleware, adminMiddleware };
