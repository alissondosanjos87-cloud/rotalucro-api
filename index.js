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

app.use(helmet());
app.use(cors());
app.use(morgan('short'));
app.use(express.json({ limit: '10mb' }));
app.use(rateLimiter);

// Sirva a pasta public
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1d', etag: true }));

// Rotas da API
app.use('/api/health', require('./routes/health'));
app.use('/api/optimize', require('./routes/optimize'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/lucro', require('./routes/lucro'));
app.use('/api/perfil', require('./routes/perfil'));
app.use('/api/track', require('./routes/track'));

// Página inicial → login
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use(notFound);
app.use(errorHandler);

var port = process.env.PORT || 3000;
app.listen(port, function() {
  logger.info('RotaLucro v5.1 iniciado', { port: port });
});

module.exports = app;
