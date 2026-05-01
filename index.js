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
app.use('/api', rateLimit({ windowMs: 60000, max: 200 }));
app.set('supabase', supabase);

app.get('/', (req, res) => {
  res.json({
    status: 'operational',
    version: '3.0.0',
    features: ['2-opt', 'worker-threads', 'redis-cache', 'transito-aprendizado', 'calculo-lucro'],
    stats: {
      uptime: process.uptime(),
      cache: routeCache.getStats(),
      workers: getWorkerPool().getStatus()
    }
  });
});

async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Token inválido' });
    req.user = user;
    next();
  } catch (err) {
    res.status(500).json(sanitizarErro(err));
  }
}

app.use('/api/optimize', authMiddleware, require('./routes/optimize'));
app.use('/api/track', authMiddleware, require('./routes/track'));
app.use('/api/lucro', authMiddleware, require('./routes/lucro'));

app.use((err, req, res, next) => {
  logSeguro('error', 'Erro', { path: req.path, message: err.message });
  res.status(500).json(sanitizarErro(err));
});

app.listen(PORT, () => {
  console.log(`🧠 RotaLucro API v3.0 rodando na porta ${PORT}`);
});
module.exports = app;
