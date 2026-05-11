// workers/twoOptWorker.js
// Worker Thread para 2-Opt
// Importa o algoritmo oficial do otimizador

const { parentPort, workerData } = require('worker_threads');
const twoOpt = require('../otimizador/twoOpt');

try {
  const { rota, options } = workerData || {};
  
  if (!rota || !Array.isArray(rota) || rota.length === 0) {
    parentPort.postMessage({ success: false, error: 'Dados inválidos', rota: [] });
    return;
  }

  const maxIteracoes = (options && options.maxIteracoes) || 3;
  const resultado = twoOpt(rota, maxIteracoes);
  
  parentPort.postMessage({
    success: true,
    rota: resultado.rota,
    melhorias: resultado.melhorias || 0,
    iteracoes: resultado.iteracoes || 0
  });

} catch (err) {
  parentPort.postMessage({
    success: false,
    error: err.message,
    rota: workerData?.rota || []
  });
}
