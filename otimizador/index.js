// otimizador/index.js
var multiStart = require('./multiStart');
var twoOpt = require('./twoOpt');
var { calcularDistanciaTotal, estimarTempoTotal } = require('./utils');

async function otimizarRotaAvancada(paradas, opcoes) {
  if (!paradas || paradas.length < 2) {
    return { rota: paradas || [], metricas: { distanciaTotal: 0, tempoEstimado: 0 } };
  }

  var tentativas = (opcoes && opcoes.tentativas) || 5;
  var inicio = Date.now();
  var qtd = paradas.length;

  // Ajusta tentativas ao tamanho
  if (qtd > 100) tentativas = 2;
  else if (qtd > 60) tentativas = 3;

  // MultiStart
  var rota = multiStart(paradas, tentativas);
  var algoritmo = 'multi-start (' + tentativas + 't)';

  // Refino final com 2-Opt
  if (rota.length >= 4 && rota.length <= 120) {
    var refino = twoOpt(rota, 3);
    rota = refino.rota;
    algoritmo += ' + 2-opt';
  }

  var distFinal = calcularDistanciaTotal(rota);
  var tempo = estimarTempoTotal(rota);

  return {
    rota: rota,
    metricas: {
      distanciaTotal: parseFloat(distFinal.toFixed(2)),
      tempoEstimado: Math.round(tempo),
      algoritmo: algoritmo,
      tempoExecucao: Date.now() - inicio,
      totalParadas: rota.length,
    },
  };
}

module.exports = { otimizarRotaAvancada };
