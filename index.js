require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const logger = require('./services/logger');
const errorHandler = require('./middleware/errorHandler');
const { globalLimiter } = require('./middleware/rateLimit');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de segurança
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limit global
app.use(globalLimiter);

// Logging de inicialização
logger.info('Inicializando RotaLucro API v8.0', { port: PORT, env: process.env.NODE_ENV });

// Rotas da API
try {
  app.use('/api/health', require('./routes/health'));
  app.use('/api/optimize', require('./routes/optimize'));
  app.use('/api/upload', require('./routes/upload'));
  app.use('/api/lucro', require('./routes/lucro'));
  app.use('/api/perfil', require('./routes/perfil'));
  app.use('/api/track', require('./routes/track'));
} catch (e) {
  logger.warn('Algumas rotas não estão disponíveis', { error: e.message });
}

// Servir build do React
const reactBuild = path.join(__dirname, 'frontend', 'dist');
const staticPublic = path.join(__dirname, 'public');

if (fs.existsSync(reactBuild)) {
  logger.info('Servindo React build', { path: reactBuild });
  app.use(express.static(reactBuild));
}

app.use(express.static(staticPublic));

// SPA fallback para React Router
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    const reactIndex = path.join(reactBuild, 'index.html');
    const staticIndex = path.join(staticPublic, 'index.html');
    if (fs.existsSync(reactIndex)) {
      res.sendFile(reactIndex);
    } else if (fs.existsSync(staticIndex)) {
      res.sendFile(staticIndex);
    } else {
      res.status(404).json({ error: 'Frontend não encontrado' });
    }
  } else {
    res.status(404).json({ error: 'Rota da API não encontrada' });
  }
});

// Middleware de tratamento de erros
app.use(errorHandler);

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Promise rejection não tratada', { reason, promise: promise.toString() });
});

process.on('uncaughtException', (error) => {
  logger.error('Exceção não capturada', { error: error.message, stack: error.stack });
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM recebido. Encerrando gracefully...');
  server.close(() => {
    logger.info('Servidor encerrado');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT recebido. Encerrando gracefully...');
  server.close(() => {
    logger.info('Servidor encerrado');
    process.exit(0);
  });
});

// Iniciar servidor
const server = app.listen(PORT, () => {
  logger.info(`✅ Servidor online na porta ${PORT}`, {
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
  console.log(`\n🚀 RotaLucro API rodando em http://localhost:${PORT}\n`);
});

module.exports = app;