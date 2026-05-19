const rateLimit = require('express-rate-limit');

// Rate limit global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requisições por janela
  message: 'Muitas requisições, tente novamente mais tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit para otimização (endpoint pesado)
const optimizeLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 30, // 30 otimizações por minuto
  message: 'Limite de otimizações atingido. Tente novamente em 1 minuto.',
  skip: (req) => req.path === '/api/health',
});

// Rate limit para upload
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 20, // 20 uploads por hora
  message: 'Limite de uploads atingido. Tente novamente em 1 hora.',
});

module.exports = {
  globalLimiter,
  optimizeLimiter,
  uploadLimiter,
};