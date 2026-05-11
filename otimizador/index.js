// otimizador/index.js
// Orquestrador - escolhe o melhor algoritmo baseado no tamanho da rota

var nearestNeighbor = require('./nearestNeighbor');
var twoOpt = require('./twoOpt');
var { calcularDistanciaTotal, estimarTempoTotal } = require('./utils');
var logger = require('../services/logger');

/**
 * Otimização adaptativa
 * Rotas pequenas: multi-start + 2-opt
 * Rotas médias: nearest neighbor + 2-opt
 * Rotas grandes: só nearest neighbor
 */
async function otimizarRotaAvancada(paradas, options) {
  if (!paradas || paradas.length < 2) {
    return {
      rota: paradas || [],
      metricas: {
        distanciaTotal: 0,
        tempoEstimado: 0,
        algoritmo: 'sem-otimizacao',
        totalParadas: 0
      }
    };
  }

  var qtd = paradas.length;
  var inicio = Date.now();

  // Define estratégia baseado no tamanho
  var tentativas, usar2Opt, algoritmo;

  if (qtd <= 60) {
    tentativas = 5;
    usar2Opt = true;
    algoritmo = 'multi-start + 2-opt';
  } else if (qtd <= 100) {
    tentativas = 3;
    usar2Opt = true;
    algoritmo = 'nearest-neighbor + 2-opt';
  } else {
    tentativas = 1;
    usar2Opt = false;
    algoritmo = 'nearest-neighbor';
  }

  logger.info('Estratégia escolhida', {
    paradas: qtd,
    algoritmo: algoritmo,
    tentativas: tentativas
  });

  var melhorRota = null;
  var melhorDist = Infinity;

  // Executa múltiplas tentativas com pontos de partida diferentes
  for (var t = 0; t < tentativas; t++) {
    var startIndex = t === 0 ? 0 : Math.floor(Math.random() * qtd);
    var rota = nearestNeighbor(paradas, startIndex);

    if (usar2Opt && rota.length >= 4) {
      var refino = twoOpt(rota, 2);
      rota = refino.rota;
    }

    var dist = calcularDistanciaTotal(rota);
    if (dist < melhorDist) {
      melhorDist = dist;
      melhorRota = rota;
    }
  }

  // Refino final para rotas pequenas
  if (usar2Opt && melhorRota.length >= 4 && melhorRota.length <= 80) {
    var refinoFinal = twoOpt(melhorRota, 3);
    melhorRota = refinoFinal.rota;
    melhorDist = calcularDistanciaTotal(melhorRota);
  }

  var tempoEstimado = estimarTempoTotal(melhorRota);
  var tempoMs = Date.now() - inicio;

  return {
    rota: melhorRota,
    metricas: {
      distanciaTotal: parseFloat(melhorDist.toFixed(2)),
      tempoEstimado: Math.round(tempoEstimado),
      economia: 0,
      algoritmo: algoritmo,
      tempoExecucao: tempoMs,
      totalParadas: melhorRota.length
    }
  };
}

module.exports = { otimizarRotaAvancada };
