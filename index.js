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

// ============================================================
// MIDDLEWARES
// ============================================================

// Segurança
app.use(helmet());

// CORS
app.use(cors());

// Logging
app.use(morgan('short'));

// Body parser com limite de tamanho
app.use(express.json({ limit: '2mb' })); // Reduzido para evitar payloads enormes

// 🔥 Rate limiting mais restritivo para /optimize
const optimizeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30,             // Máximo 30 requisições por minuto
  message: { error: 'Muitas otimizações. Aguarde um minuto.' },
  standardHeaders: true,
  legacyHeaders: false,
});

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
