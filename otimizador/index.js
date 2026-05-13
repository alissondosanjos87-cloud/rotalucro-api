// otimizador/index.js
var nearestNeighbor = require('./nearestNeighbor');
var twoOpt = require('./twoOpt');
var { calcularDistanciaTotal, estimarTempoTotal } = require('./utils');
var rotaCache = require('../services/cache');
var logger = require('../services/logger');

async function otimizarRotaAvancada(paradas, options) {
  if (!paradas || paradas.length < 2) {
    return {
      rota: paradas || [],
      metricas: { distanciaTotal: 0, tempoEstimado: 0, algoritmo: 'sem-otimizacao', totalParadas: 0 }
    };
  }

  var cached = rotaCache.get(paradas);
  if (cached) {
    logger.info('Cache hit', { paradas: paradas.length });
    return cached;
  }

  var qtd = paradas.length;
  var inicio = Date.now();
  var tentativas, usar2Opt, algoritmo;

  if (qtd <= 60) {
    tentativas = 5; usar2Opt = true; algoritmo = 'multi-start + 2-opt';
  } else if (qtd <= 100) {
    tentativas = 3; usar2Opt = true; algoritmo = 'nearest-neighbor + 2-opt';
  } else {
    tentativas = 1; usar2Opt = false; algoritmo = 'nearest-neighbor';
  }

  var melhorRota = null, melhorDist = Infinity;

  for (var t = 0; t < tentativas; t++) {
    var startIndex = t === 0 ? 0 : Math.floor(Math.random() * qtd);
    var rota = nearestNeighbor(paradas, startIndex);
    if (usar2Opt && rota.length >= 4) {
      rota = twoOpt(rota, 2, 2000).rota;
    }
    var dist = calcularDistanciaTotal(rota);
    if (dist < melhorDist) { melhorDist = dist; melhorRota = rota; }
  }

  if (usar2Opt && melhorRota.length >= 4 && melhorRota.length <= 80) {
    melhorRota = twoOpt(melhorRota, 3, 3000).rota;
    melhorDist = calcularDistanciaTotal(melhorRota);
  }

  var resultado = {
    rota: melhorRota,
    metricas: {
      distanciaTotal: parseFloat(melhorDist.toFixed(2)),
      tempoEstimado: Math.round(estimarTempoTotal(melhorRota)),
      economia: 0,
      algoritmo: algoritmo,
      tempoExecucao: Date.now() - inicio,
      totalParadas: melhorRota.length
    }
  };

  rotaCache.set(paradas, resultado, 600000);
  return resultado;
}

module.exports = { otimizarRotaAvancada };
