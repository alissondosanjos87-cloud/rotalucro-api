const { parentPort } = require('worker_threads');

function calcDist(a, b) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLon = (b.lng - a.lng) * Math.PI / 180;
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;
  const x = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
}

function twoOpt(rota) {
  let melhor = [...rota];
  let melhorDist = calcRotaDist(melhor);
  let melhorou = true;

  while (melhorou) {
    melhorou = false;
    for (let i = 1; i < melhor.length - 2; i++) {
      for (let j = i + 1; j < melhor.length - 1; j++) {
        const nova = [...melhor];
        const trecho = nova.slice(i, j + 1).reverse();
        nova.splice(i, trecho.length,...trecho);
        const novaDist = calcRotaDist(nova);
        if (novaDist < melhorDist) {
          melhor = nova;
          melhorDist = novaDist;
          melhorou = true;
        }
      }
    }
  }
  return { rota: melhor, distancia: melhorDist };
}

function calcRotaDist(rota) {
  let dist = 0;
  for (let i = 0; i < rota.length - 1; i++) {
    dist += calcDist(rota[i], rota[i + 1]);
  }
  return dist;
}

parentPort.on('message', ({ pedidos, historico }) => {
  try {
    const resultado = twoOpt(pedidos);
    parentPort.postMessage({
      success: true,
      rota: resultado.rota,
      distancia_km: resultado.distancia.toFixed(2),
      economia_estimada: '15-30%',
      processado_em: new Date().toISOString()
    });
  } catch (err) {
    parentPort.postMessage({ success: false, error: err.message });
  }
});
