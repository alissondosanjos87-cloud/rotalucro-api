// otimizador/index.js
const multiStart = require('./multiStart');
const twoOpt = require('./twoOpt');
const nearestNeighbor = require('./nearestNeighbor');
const { calcularDistanciaTotal, estimarTempoTotal } = require('./utils');
const cacheDist = require('./cache');

async function otimizarRotaAvancada(paradas, options = {}) {
  if (!paradas || paradas.length < 2) {
    return {
      rota: paradas || [],
      metricas: { distanciaTotal: 0, tempoEstimado: 0, algoritmo: 'sem-otimizacao', totalParadas: 0 },
    };
  }

  const inicio = Date.now();
  const qtd = paradas.length;

  const tentativas = qtd <= 60 ? 6 : qtd <= 100 ? 4 : qtd <= 150 ? 2 : 1;
  const refinoFinal = qtd <= 100;
  const usarMultiStart = qtd >= 4;

  let rota, algoritmo = 'nearest-neighbor';

  if (usarMultiStart) {
    rota = multiStart(paradas, tentativas);
    algoritmo = 'multi-start (' + tentativas + 't)';
  } else {
    rota = nearestNeighbor(paradas, 0);
  }

  const distAposMS = calcularDistanciaTotal(rota);

  if (refinoFinal && rota.length >= 4 && rota.length <= 120) {
    const refino = twoOpt(rota, 3);
    rota = refino.rota;
    algoritmo += ' + 2-opt';
  }

  const distFinal = calcularDistanciaTotal(rota);
  const tempo = estimarTempoTotal(rota);
  const economia = distAposMS > 0 ? ((distAposMS - distFinal) / distAposMS * 100) : 0;

  return {
    rota,
    metricas: {
      distanciaTotal: parseFloat(distFinal.toFixed(2)),
      tempoEstimado: Math.round(tempo),
      economia: parseFloat(economia.toFixed(1)),
      algoritmo,
      tempoExecucao: Date.now() - inicio,
      totalParadas: rota.length,
      adaptativo: { tentativas, refinoFinal, usarMultiStart, tamanhoRota: qtd },
      cacheDistancia: cacheDist.getStats(),
    },
  };
}

module.exports = { otimizarRotaAvancada };
