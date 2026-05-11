// middleware/errorHandler.js
var logger = require('../services/logger');

function errorHandler(err, req, res, next) {
  logger.error('Erro não tratado', {
    path: req.path,
    method: req.method,
    message: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
  });

  var statusCode = err.status || 500;
  var message = process.env.NODE_ENV === 'production' 
    ? 'Erro interno do servidor' 
    : err.message;

  res.status(statusCode).json({
    error: message,
    code: err.code || 'UNKNOWN'
  });
}

function notFound(req, res) {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.originalUrl,
    method: req.method
  });
}

module.exports = { errorHandler, notFound };
