`javascript
const multiStart = require('./multiStart');
const twoOpt = require('./twoOpt');
const { calcularDistanciaTotal, estimarTempoTotal } = require('./utils');
const cacheDist = require('./cache');

async function otimizarRotaAvancada(paradas, options = {}) {
  if (!paradas || paradas.length < 2) {
    return { rota: paradas || [], metricas: { distanciaTotal: 0, tempoEstimado: 0, algoritmo: 'sem-otimizacao' } };
  }

  const inicio = Date.now();
  const tentativas = options.tentativas || 6;

  // 1. Multi-start
  let rota = multiStart(paradas, tentativas);
  const distMS = calcularDistanciaTotal(rota);
  let algoritmo = 'multi-start';

  // 2. Refino final
  if (rota.length >= 4 && rota.length <= 120) {
    const refino = twoOpt(rota, 3);
    rota = refino.rota;
    algoritmo = 'multi-start + 2-opt';
  }

  const distFinal = calcularDistanciaTotal(rota);
  const tempo = estimarTempoTotal(rota);

  return {
    rota,
    metricas: {
      distanciaTotal: parseFloat(distFinal.toFixed(2)),
      tempoEstimado: Math.round(tempo),
      economia: distMS > 0 ? parseFloat(((distMS - distFinal) / distMS * 100).toFixed(1)) : 0,
      algoritmo,
      tempoExecucao: Date.now() - inicio,
      totalParadas: rota.length,
      cacheDistancia: cacheDist.getStats(),
    },
  };
}

module.exports = { otimizarRotaAvancada };
