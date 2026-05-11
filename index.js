// index.js - RotaLucro API v5.0
require('dotenv').config();

var express = require('express');
var cors = require('cors');
var helmet = require('helmet');
var morgan = require('morgan');
var path = require('path');

var { errorHandler, notFound } = require('./middleware/errorHandler');
var { rateLimiter } = require('./middleware/rateLimit');
var logger = require('./services/logger');

var app = express();

// Middlewares globais
app.use(helmet());
app.use(cors());
app.use(morgan('short'));
app.use(express.json({ limit: '10mb' }));
app.use(rateLimiter);

// Arquivos estáticos com cache
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1d', etag: true }));

// Rotas da API
app.use('/api/health', require('./routes/health'));
app.use('/api/optimize', require('./routes/optimize'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/lucro', require('./routes/lucro'));
app.use('/api/perfil', require('./routes/perfil'));
app.use('/api/track', require('./routes/track'));

// Página inicial
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// 404
app.use(notFound);

// Error handler (sempre por último)
app.use(errorHandler);

var port = process.env.PORT || 3000;
app.listen(port, function() {
  logger.info('RotaLucro Pro v5.0 iniciado', { port: port });
});

module.exports = app;
