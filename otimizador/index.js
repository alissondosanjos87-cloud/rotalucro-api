const nn=require('./nearestNeighbor');const two=require('./twoOpt');const {calcularDistanciaTotal,estimarTempoTotal}=require('./utils');
async function otimizarRotaAvancada(paradas){if(!paradas||paradas.length<2)return{rota:paradas||[]};let rota=nn(paradas);const di=calcularDistanciaTotal(rota);rota=two(rota).rota;const df=calcularDistanciaTotal(rota);return{rota,metricas:{distanciaInicial:+di.toFixed(2),distanciaTotal:+df.toFixed(2),economia:di?+((di-df)/di*100).toFixed(1):0,tempoEstimado:Math.round(estimarTempoTotal(rota)),algoritmo:'2-opt'}};}
module.exports={otimizarRotaAvancada};  const usarMultiStart = qtd >= 4;        // Multi-start só com 4+
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
