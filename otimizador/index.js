// otimizador/index.js
const multiStart = require('./multiStart');
const twoOpt = require('./twoOpt');
const { calcularDistanciaTotal, estimarTempoTotal } = require('./utils');
const { getNivelTransito } = require('../aprendizado/transito');
const rotaCache = require('../services/cache');
const logger = require('../services/logger');

async function otimizarRotaAvancada(paradas) {
  if (!paradas || paradas.length < 2) {
    return {
      rota: paradas || [],
      metricas: { distanciaTotal:0, tempoEstimado:0, algoritmo:'sem-otimizacao', totalParadas:0 }
    };
  }

  const cached = rotaCache.get(paradas);
  if (cached) { logger.info('Cache hit', { paradas: paradas.length }); return cached; }

  const inicio = Date.now();
  const transito = getNivelTransito(new Date().getHours());
  logger.info('Otimizando', { paradas: paradas.length, transito: transito.nivel });

  let melhorRota = multiStart(paradas, 6, 4000);

  if (melhorRota.length >= 4 && melhorRota.length <= 80) {
    melhorRota = twoOpt(melhorRota, 3, 3000).rota;
  }

  const resultado = {
    rota: melhorRota,
    metricas: {
      distanciaTotal: parseFloat(calcularDistanciaTotal(melhorRota).toFixed(2)),
      tempoEstimado: Math.round(estimarTempoTotal(melhorRota)),
      algoritmo: 'multi-start + 2-opt',
      tempoExecucao: Date.now() - inicio,
      totalParadas: melhorRota.length,
      transito
    }
  };

  rotaCache.set(paradas, resultado, 600000);
  return resultado;
}

module.exports = { otimizarRotaAvancada };
