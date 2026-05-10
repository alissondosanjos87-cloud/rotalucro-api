const express = require('express');
const router = express.Router();

const routeCache = require('../services/cache');
const { otimizarRotaAvancada } = require('../otimizador');

router.post('/', async (req, res) => {
  try {
    const { paradas } = req.body;

    if (!Array.isArray(paradas)) {
      return res.status(400).json({
        error: 'Envie um array de paradas',
      });
    }

    if (paradas.length < 2) {
      return res.status(400).json({
        error: 'Mínimo de 2 paradas',
      });
    }

    if (paradas.length > 150) {
      return res.status(400).json({
        error: 'Limite máximo de 150 paradas',
      });
    }

    for (const parada of paradas) {
      parada.lat = Number(parada.lat);
      parada.lng = Number(parada.lng);

      if (Number.isNaN(parada.lat) || Number.isNaN(parada.lng)) {
        return res.status(400).json({
          error: 'Coordenadas inválidas',
        });
      }
    }

    const cached = routeCache.get(paradas);

    if (cached) {
      return res.json({
        success: true,
        cached: true,
        ...cached,
      });
    }

    const resultado = await Promise.race([
      otimizarRotaAvancada(paradas),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout otimização')), 5000)
      ),
    ]);

    routeCache.set(paradas, resultado);

    return res.json({
      success: true,
      cached: false,
      ...resultado,
    });
  } catch (err) {
    return res.status(500).json({
      error: err.message,
    });
  }
});

module.exports = router;
