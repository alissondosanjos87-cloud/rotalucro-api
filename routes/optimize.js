const express = require('express');
const router = express.Router();
const routeCache = require('../services/cache');
const { otimizarRotaAvancada } = require('../otimizador/index');
const { logSeguro, sanitizarErro } = require('../config/supabase');

router.use((req, res, next) => { req.startTime = Date.now(); next(); });

router.post('/', async (req, res) => {
  try {
    const { paradas, options } = req.body;
    if (!paradas?.length || paradas.length < 2) return res.status(400).json({ error: 'Mínimo 2 paradas' });

    // Valida coordenadas
    for (const p of paradas) {
      if (!p.lat || !p.lng || isNaN(p.lat) || isNaN(p.lng)) {
        return res.status(400).json({ error: 'Coordenadas inválidas', parada: p });
      }
      p.lat = parseFloat(p.lat); p.lng = parseFloat(p.lng);
      if (!p.tempoParada) p.tempoParada = p.tipo === 'condominio' ? 10 : p.tipo === 'apto' ? 6 : 3;
    }

    // Cache
    const cached = routeCache.get(paradas);
    if (cached) {
      logSeguro('log', 'Cache HIT', { paradas: paradas.length });
      return res.json({ success: true, cached: true, ...cached });
    }

    logSeguro('log', 'Otimizando', { paradas: paradas.length });
    const resultado = await otimizarRotaAvancada(paradas, options);
    const response = { success: true, cached: false, ...resultado };
    
    routeCache.set(paradas, response);
    res.json(response);
  } catch (err) {
    logSeguro('error', 'Erro optimize', { error: err.message });
    res.status(500).json(sanitizarErro(err));
  }
});

module.exports = router;      qtd_pedidos: pedidos.length,
      distancia_km: parseFloat(resultado.distancia_km),
      tempo_processamento_ms: Date.now() - req.startTime
    });

    res.json({ ...resultado, cached: false });

  } catch (err) {
    logSeguro('error', 'Erro /optimize', { error: err.message });
    res.status(500).json(sanitizarErro(err));
  }
});

router.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});

module.exports = router;
