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

app.use(helmet());
app.use(cors());
app.use(morgan('short'));
app.use(express.json({ limit: '5mb' }));
app.use('/api', rateLimit({ windowMs: 60000, max: 100 }));

app.set('supabase', supabase);

// Health check (ping para manter awake)
app.get('/', (req, res) => res.json({ status: 'ok', version: '4.0.0' }));
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.get('/ping', (req, res) => res.send('pong'));

// Auth middleware
async function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  try {
    if (!supabase) { req.user = { id: 'anon' }; return next(); }
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Token inválido' });
    req.user = user;
    next();
  } catch { res.status(500).json({ error: 'Erro auth' }); }
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
