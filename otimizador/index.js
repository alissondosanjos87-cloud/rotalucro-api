const multiStart = require('./multiStart');
const nearestNeighbor = require('./nearestNeighbor');
const twoOpt = require('./twoOpt');

const {
  calcularDistanciaTotal,
  estimarTempoTotal,
} = require('./utils');

async function otimizarRotaAvancada(paradas) {
  if (!paradas || paradas.length < 2) {
    return {
      rota: [],
      metricas: {},
    };
  }

  const inicio = Date.now();
  const qtd = paradas.length;

  const tentativas =
    qtd <= 60 ? 6 :
    qtd <= 100 ? 4 :
    2;

  let rota =
    qtd >= 4
      ? multiStart(paradas, tentativas)
      : nearestNeighbor(paradas);

  const distInicial = calcularDistanciaTotal(rota);

  if (qtd >= 4 && qtd <= 120) {
    rota = twoOpt(rota, 3).rota;
  }

  const distFinal = calcularDistanciaTotal(rota);

  return {
    rota,
    metricas: {
      distanciaInicial: Number(distInicial.toFixed(2)),
      distanciaTotal: Number(distFinal.toFixed(2)),
      economia: distInicial
        ? Number((((distInicial - distFinal) / distInicial) * 100).toFixed(1))
        : 0,
      tempoEstimado: Math.round(estimarTempoTotal(rota)),
      algoritmo: qtd >= 4 ? 'multi-start + 2-opt' : 'nearest-neighbor',
      tempoExecucao: Date.now() - inicio,
      totalParadas: qtd,
    },
  };
}

module.exports = { otimizarRotaAvancada };
