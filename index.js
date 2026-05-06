// index.js - RotaLucro API v3.0
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const app = express();

// Middlewares básicos
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// Rate limit simples para não derrubar no Render free
app.use(rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 200,
  standardHeaders: true
}));

// Supabase (opcional)
const supabase = require('./config/supabase');
app.set('supabase', supabase);

// Rotas
app.use('/api/health', require('./routes/health'));
app.use('/api/lucro', require('./routes/lucro'));
app.use('/api/optimize', require('./routes/optimize'));
app.use('/api/perfil', require('./routes/perfil'));
app.use('/api/track', require('./routes/track'));

// Rota raiz
app.get('/', (req, res) => {
  res.json({ 
    message: 'RotaLucro API v3.0',
    status: 'online',
    endpoints: ['/api/health','/api/lucro','/api/optimize']
  });
});

// Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ RotaLucro API rodando na porta ${PORT}`);
});    }
  });
});

app.listen(3000, function() {
  console.log('RotaLucro API port 3000');
});
