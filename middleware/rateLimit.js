// middleware/rateLimit.js
var rateLimit = require('express-rate-limit');

var optimizeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Muitas requisições. Aguarde um minuto.' },
  standardHeaders: true,
  legacyHeaders: false,
});

var generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: 'Muitas requisições.' },
  standardHeaders: true,
  legacyHeaders: false,
});

function rateLimiter(req, res, next) {
  if (req.path.startsWith('/api/optimize') || req.path.startsWith('/api/upload')) {
    return optimizeLimiter(req, res, next);
  }
  return generalLimiter(req, res, next);
}

module.exports = { rateLimiter, optimizeLimiter, generalLimiter };
