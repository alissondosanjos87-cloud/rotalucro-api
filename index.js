require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { supabase, logSeguro, sanitizarErro } = require('./config/supabase');
const { getWorkerPool } = require('./services/workerPool');
const routeCache = require('./services/cache');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(helmet());
app.use(cors());
app.use(morgan('short'));
app.use(express.json({ limit: '2mb' }));

// Rate limiting
const optimizeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Muitas otimizações. Aguarde um minuto.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: 'Muitas requisições.' },
});

app.use('/api/optimize', optimizeLimiter);
app.use('/api', generalLimiter);

app.set('supabase', supabase);

// Health check
app.get('/', function(req, res) {
  res.json({
    status: 'ok',
    version: '4.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', function(req, res) {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.get('/ping', function(req, res) {
  res.send('pong');
});

// Auth middleware
async function auth(req, res, next) {
  var token = req.headers.authorization;
  
  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }
  
  token = token.replace('Bearer ', '');

  try {
    if (!supabase) {
      req.user = { id: 'offline', email: 'offline@local' };
      return next();
    }

    var result = await supabase.auth.getUser(token);
    var user = result.data.user;
    var error = result.error;
    
    if (error || !user) {
      return res.status(401).json({ error: 'Token invalido ou expirado' });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(500).json({ error: 'Erro na autenticacao' });
  }
}

// Rotas
app.use('/api/health', require('./routes/health'));
app.use('/api/optimize', auth, require('./routes/optimize'));
app.use('/api/track', auth, require('./routes/track'));
app.use('/api/lucro', auth, require('./routes/lucro'));
app.use('/api/perfil', auth, require('./routes/perfil'));

// 404
app.use(function(req, res) {
  res.status(404).json({
    error: 'Rota nao encontrada',
    path: req.originalUrl,
  });
});

// Error handler
app.use(function(err, req, res, next) {
  logSeguro('error', 'Erro nao tratado', {
    path: req.path,
    message: err.message,
  });
  res.status(err.status || 500).json(sanitizarErro(err));
});

// Start
var server = app.listen(PORT, function() {
  console.log('RotaLucro API v4.0 - Porta ' + PORT);
  console.log('Limite: 150 paradas');
  console.log('Cache: Memoria');
  console.log('Custo: R$ 0');
});

// Graceful shutdown
async function shutdown(signal) {
  console.log(signal + ' recebido. Encerrando...');
  server.close(function() {
    console.log('HTTP fechado');
  });
  var pool = getWorkerPool();
  await pool.shutdown();
  console.log('Shutdown completo');
  process.exit(0);
}

process.on('SIGTERM', function() { shutdown('SIGTERM'); });
process.on('SIGINT', function() { shutdown('SIGINT'); });

process.on('uncaughtException', function(err) {
  logSeguro('error', 'Erro fatal', { message: err.message });
  console.error(err);
  process.exit(1);
});

process.on('unhandledRejection', function(reason) {
  logSeguro('error', 'Promise rejeitada', {
    message: reason instanceof Error ? reason.message : String(reason),
  });
});

module.exports = app;});

// Rate limit geral
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: 'Muitas requisições.' },
});

app.use('/api/optimize', optimizeLimiter);
app.use('/api', generalLimiter);

// Compartilha serviços
app.set('supabase', supabase);

// ============================================================
// HEALTH CHECK (Mantém o Render awake)
// ============================================================

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    version: '4.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.get('/ping', (req, res) => {
  res.send('pong');
});

// ============================================================
// AUTH MIDDLEWARE
// ============================================================

async function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  try {
    if (!supabase) {
      // Modo offline: permite tudo
      req.user = { id: 'offline', email: 'offline@local' };
      return next();
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }

    req.user = user;
    next();
  } catch (err) {
    logSeguro('error', 'Erro auth', { message: err.message });
    res.status(500).json({ error: 'Erro na autenticação' });
  }
}

// ============================================================
// ROTAS
// ============================================================

app.use('/api/health', require('./routes/health'));
app.use('/api/optimize', auth, require('./routes/optimize'));
app.use('/api/track', auth, require('./routes/track'));
app.use('/api/lucro', auth, require('./routes/lucro'));
app.use('/api/perfil', auth, require('./routes/perfil'));

// ============================================================
// 404
// ============================================================

app.use((req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.originalUrl,
    dica: 'Use /api/health para verificar o status',
  });
});

// ============================================================
// ERROR HANDLER
// ============================================================

app.use((err, req, res, next) => {
  logSeguro('error', 'Erro não tratado', {
    path: req.path,
    message: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
  });
  res.status(err.status || 500).json(sanitizarErro(err));
});

// ============================================================
// START
// ============================================================

const server = app.listen(PORT, () => {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║  🧠 RotaLucro API v4.0 - PRODUÇÃO        ║');
  console.log(`║  🚀 Porta: ${PORT}                           ║`);
  console.log('║  🛡️  Limite: 150 paradas                  ║');
  console.log('║  📦 Cache: Memória                        ║');
  console.log('║  💰 Custo: R$ 0                           ║');
  console.log('╚══════════════════════════════════════════╝');
});

// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================

async function shutdown(signal) {
  console.log(`\n🛑 ${signal} recebido. Encerrando...`);
  
  server.close(() => console.log('✅ HTTP fechado'));

  const pool = getWorkerPool();
  await pool.shutdown();

  console.log('✅ Shutdown completo');
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Erros fatais
process.on('uncaughtException', (err) => {
  logSeguro('error', 'Erro fatal', { message: err.message });
  console.error(err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logSeguro('error', 'Promise rejeitada', {
    message: reason instanceof Error ? reason.message : String(reason),
  });
});

module.exports = app;  } catch { res.status(500).json({ error: 'Erro auth' }); }
}

// Rotas
app.use('/api/optimize', auth, require('./routes/optimize'));
app.use('/api/track', auth, require('./routes/track'));
app.use('/api/lucro', auth, require('./routes/lucro'));
app.use('/api/perfil', auth, require('./routes/perfil'));
app.use('/api/health', require('./routes/health'));

// 404
app.use((req, res) => res.status(404).json({ error: 'Rota não encontrada' }));

// Error handler
app.use((err, req, res, next) => {
  logSeguro('error', 'Erro', { message: err.message });
  res.status(500).json(sanitizarErro(err));
});

const server = app.listen(PORT, () => {
  console.log(`🧠 RotaLucro API v4.0 - Porta ${PORT} - Zero Custo`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Encerrando...');
  const pool = getWorkerPool();
  await pool.shutdown();
  server.close(() => process.exit(0));
});

module.exports = app
