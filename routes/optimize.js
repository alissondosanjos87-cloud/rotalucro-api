const express = require('express');
const router = express.Router();
const routeCache = require('../services/cache');
const { otimizarRotaAvancada } = require('../otimizador/index');
const { logSeguro, sanitizarErro } = require('../config/supabase');

// Middleware de tempo
router.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});

// ============================================================
// POST /api/optimize
// ============================================================
router.post('/', async (req, res) => {
  try {
    const { paradas, options } = req.body;

    // ============================================================
    // 🔥 VALIDAÇÕES DE ENTRADA (PROTEÇÃO CONTRA BUGS)
    // ============================================================

    // 1. Array vazio ou não-array
    if (!paradas || !Array.isArray(paradas)) {
      return res.status(400).json({
        error: 'Envie um array de paradas',
        exemplo: { paradas: [{ lat: -23.55, lng: -46.63 }] },
      });
    }

    // 2. Mínimo de paradas
    if (paradas.length < 2) {
      return res.status(400).json({
        error: 'Mínimo de 2 paradas para otimizar',
        recebido: paradas.length,
      });
    }

    // 3. 🔥 LIMITE MÁXIMO (protege o servidor)
    const LIMITE_MAXIMO = 150;
    if (paradas.length > LIMITE_MAXIMO) {
      return res.status(400).json({
        error: `Limite máximo de ${LIMITE_MAXIMO} paradas por requisição`,
        recebido: paradas.length,
        sugestao: 'Divida em lotes menores ou use o plano Frota',
      });
    }

    // 4. Valida coordenadas
    const invalidas = [];
    for (let i = 0; i < paradas.length; i++) {
      const p = paradas[i];
      if (!p.lat || !p.lng || isNaN(p.lat) || isNaN(p.lng)) {
        invalidas.push({ indice: i, parada: p });
      }
      // Normaliza
      p.lat = parseFloat(p.lat);
      p.lng = parseFloat(p.lng);
      
      // Valores padrão
      if (!p.tempoParada) {
        p.tempoParada = p.tipo === 'condominio' ? 10 : p.tipo === 'apto' ? 6 : 3;
      }
      if (!p.tipo) p.tipo = 'casa';
    }

    if (invalidas.length > 0) {
      return res.status(400).json({
        error: `${invalidas.length} parada(s) com coordenadas inválidas`,
        invalidas: invalidas.slice(0, 5), // Mostra só 5
      });
    }

    // 5. 🔥 DETECTA DUPLICATAS (bug comum)
    const coords = paradas.map(p => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`);
    const unicas = new Set(coords);
    if (unicas.size < paradas.length) {
      logSeguro('warn', 'Paradas duplicadas detectadas', {
        total: paradas.length,
        unicas: unicas.size,
        duplicadas: paradas.length - unicas.size,
      });
    }

    // 6. Log de uso
    logSeguro('log', 'Otimizando', {
      paradas: paradas.length,
      faixa: paradas.length <= 60 ? 'normal' : paradas.length <= 100 ? 'alto' : 'pesado',
    });

    // ============================================================
    // CACHE
    // ============================================================
    const cached = routeCache.get(paradas);
    if (cached) {
      logSeguro('log', 'Cache HIT', { paradas: paradas.length });
      return res.json({
        success: true,
        cached: true,
        fromCache: true,
        ...cached,
      });
    }

    // ============================================================
    // OTIMIZAÇÃO ADAPTATIVA
    // ============================================================
    const resultado = await otimizarRotaAvancada(paradas, options);

    // Prepara resposta
    const response = {
      success: true,
      cached: false,
      rota: resultado.rota,
      metricas: {
        ...resultado.metricas,
        tempoProcessamento: Date.now() - req.startTime,
      },
      // 🔥 Informa qual estratégia foi usada
      estrategia: {
        tamanhoRota: paradas.length,
        qualidade: paradas.length <= 60 ? 'máxima' : 
                   paradas.length <= 100 ? 'equilibrada' : 'rápida',
        ...resultado.metricas.adaptativo,
      },
    };

    // Salva cache (TTL maior para rotas pequenas)
    const ttl = paradas.length <= 30 ? 1800000 : // 30 min
                paradas.length <= 60 ? 600000 :  // 10 min
                300000;                           // 5 min
    routeCache.set(paradas, response, ttl);

    logSeguro('log', 'Otimizado', {
      paradas: paradas.length,
      distancia: resultado.metricas.distanciaTotal + 'km',
      tempo: (Date.now() - req.startTime) + 'ms',
      algoritmo: resultado.metricas.algoritmo,
    });

    res.json(response);

  } catch (err) {
    logSeguro('error', 'Erro /optimize', {
      error: err.message,
      paradas: req.body?.paradas?.length || 0,
    });
    res.status(500).json(sanitizarErro(err));
  }
});

// ============================================================
// GET /api/optimize/limits - Informa limites
// ============================================================
router.get('/limits', (req, res) => {
  res.json({
    maximoParadas: 150,
    faixas: {
      normal: { min: 2, max: 60, qualidade: 'máxima', tentativas: 6 },
      alto: { min: 61, max: 100, qualidade: 'equilibrada', tentativas: 4 },
      pesado: { min: 101, max: 150, qualidade: 'rápida', tentativas: 2 },
    },
    cache: routeCache.getStats(),
  });
});

module.exports = router;
