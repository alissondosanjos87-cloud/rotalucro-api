```javascript
const cacheDist = require('./cache');

function distancia(a, b) {
  if (!a?.lat || !a?.lng || !b?.lat || !b?.lng) return Infinity;

  const cached = cacheDist.get(a, b);
  if (cached !== null) return cached;

  const R = 6371;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const x = Math.sin(dLat/2)**2 + Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLng/2)**2;
  const d = R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));

  cacheDist.set(a, b, d);
  return d;
}

function calcularDistanciaTotal(rota) {
  if (!rota || rota.length < 2) return 0;
  let t = 0;
  for (let i = 0; i < rota.length - 1; i++) t += distancia(rota[i], rota[i+1]);
  return t;
}

function estimarTempoTotal(rota, vel = 35) {
  if (!rota?.length) return 0;
  let t = 0;
  for (let i = 0; i < rota.length - 1; i++) {
    t += (distancia(rota[i], rota[i+1]) / vel) * 60 + (rota[i].tempoParada || 5);
  }
  t += (rota[rota.length-1]?.tempoParada || 5);
  return t;
}

module.exports = { distancia, calcularDistanciaTotal, estimarTempoTotal };
