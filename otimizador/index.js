// otimizador/index.js
// Orquestrador adaptativo: se ajusta ao tamanho da rota

const multiStart = require('./multiStart');
const twoOpt = require('./twoOpt');
const nearestNeighbor = require('./nearestNeighbor');
const { calcularDistanciaTotal, estimarTempoTotal } = require('./utils');
const cacheDist = require('./cache');

/**
 * Otimização adaptativa
 * A qualidade se ajusta ao tamanho da rota
 */
async function otimizarRotaAvancada(paradas, options = {}) {
  if (!paradas || paradas.length < 2) {
    return {
      rota: paradas || [],
      metricas: {
        distanciaTotal: 0,
        tempoEstimado: 0,
        algoritmo: 'sem-otimizacao',
        totalParadas: 0,
      },
    };
  }

  const inicio = Date.now();
  const qtd = paradas.length;

  // 🔥 ADAPTATIVO: qualidade vs velocidade
  const tentativas = qtd <= 60 ? 6 :      // Máxima qualidade
                     qtd <= 100 ? 4 :     // Equilíbrio
                     qtd <= 150 ? 2 :     // Prioriza velocidade
                     1;                   // Só uma tentativa

  const refinoFinal = qtd <= 100;         // Só refina até 100
  const usarMultiStart = qtd >= 4;        // Multi-start só com 4+
  const limiteWorker = qtd > 30;          // Worker thread só acima de 30

  let rota;
  let algoritmo = 'nearest-neighbor';

  if (usarMultiStart) {
    // Multi-start (testa várias partidas)
    rota = multiStart(paradas, tentativas);
    algoritmo = `multi-start (${tentativas}t)`;
  } else {
    // Rota pequena: só nearest neighbor
    rota = nearestNeighbor(paradas, 0);
  }

  const distAposMS = calcularDistanciaTotal(rota);

  // Refino final com 2-Opt
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
      adaptativo: {
        tentativas,
        refinoFinal,
        usarMultiStart,
        tamanhoRota: qtd,
      },
      cacheDistancia: cacheDist.getStats(),
    },
  };
}

module.exports = { otimizarRotaAvancada };      tempoExecucao: Date.now() - inicio,
      totalParadas: rota.length,
      cacheDistancia: cacheDist.getStats(),
    },
  };
}

module.exports = { otimizarRotaAvancada };
