const { parentPort, workerData } = require('worker_threads');

function dist(a, b) {
  const R = 6371; const toRad = d => d * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const x = Math.sin(dLat/2)**2 + Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
}

function twoOpt(rota, maxIter = 3) {
  if (!rota || rota.length < 4) return { rota: rota ? [...rota] : [], melhorias: 0 };
  let melhor = [...rota], melhorias = 0, iter = 0;
  while (iter < maxIter) {
    let melhorou = false;
    for (let i = 1; i < melhor.length-2; i++) {
      for (let j = i+1; j < melhor.length-1; j++) {
        const antes = dist(melhor[i-1], melhor[i]) + dist(melhor[j], melhor[j+1]);
        const depois = dist(melhor[i-1], melhor[j]) + dist(melhor[i], melhor[j+1]);
        if (depois - antes < -0.0001) {
          melhor = [...melhor.slice(0,i), ...melhor.slice(i,j+1).reverse(), ...melhor.slice(j+1)];
          melhorias++; melhorou = true;
        }
      }
    }
    if (!melhorou) break;
    iter++;
  }
  return { rota: melhor, melhorias };
}

try {
  const { rota, options } = workerData || {};
  if (!rota?.length) { parentPort.postMessage({ success: false, rota: [] }); return; }
  const result = twoOpt(rota, options?.maxIteracoes || 3);
  parentPort.postMessage({ success: true, ...result });
} catch (e) {
  parentPort.postMessage({ success: false, erro: e.message, rota: workerData?.rota || [] });
}
