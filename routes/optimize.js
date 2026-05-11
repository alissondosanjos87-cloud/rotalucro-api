// routes/optimize.js
var express = require('express');
var router = express.Router();
var { validarParadas } = require('../otimizador/validacoes');
var { otimizarRotaAvancada } = require('../otimizador/index');
var logger = require('../services/logger');

// POST /api/optimize
router.post('/', async function(req, res) {
  var inicio = Date.now();

  try {
    var { paradas, options } = req.body;

    // Valida entrada
    var validacao = validarParadas(paradas);
    if (!validacao.valido) {
      return res.status(400).json({ error: validacao.error });
    }

    logger.info('Otimização iniciada', {
      paradas: paradas.length,
      faixa: paradas.length <= 60 ? 'normal' : paradas.length <= 100 ? 'alto' : 'pesado'
    });

    // Otimiza
    var resultado = await otimizarRotaAvancada(paradas, options);

    var tempoMs = Date.now() - inicio;

    logger.info('Otimização concluída', {
      paradas: paradas.length,
      distancia: resultado.metricas.distanciaTotal + 'km',
      tempo: tempoMs + 'ms',
      algoritmo: resultado.metricas.algoritmo
    });

    res.json({
      success: true,
      rota: resultado.rota,
      metricas: {
        distanciaTotal: resultado.metricas.distanciaTotal,
        tempoEstimado: resultado.metricas.tempoEstimado,
        economia: resultado.metricas.economia || 0,
        algoritmo: resultado.metricas.algoritmo,
        tempoProcessamento: tempoMs,
        totalParadas: resultado.metricas.totalParadas
      }
    });

  } catch (err) {
    logger.error('Erro na otimização', { message: err.message });
    res.status(500).json({ error: 'Erro ao otimizar rota' });
  }
});

// GET /api/optimize/limits
router.get('/limits', function(req, res) {
  var limites = require('../otimizador/validacoes').getLimites();
  res.json({
    maximoParadas: limites.MAX_PARADAS,
    minimoParadas: limites.MIN_PARADAS,
    faixas: {
      normal:  { min: 2,  max: 60,  qualidade: 'máxima' },
      alto:    { min: 61, max: 100, qualidade: 'equilibrada' },
      pesado:  { min: 101, max: 150, qualidade: 'rápida' }
    }
  });
});

module.exports = router;
