// otimizador/utils.js
const cacheDist = require('./cache');

function distancia(a, b) {
  if (!a || !b) return 0;
  
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

function calcularDistanciaTotal(r) {
  let t = 0;
  for (let i = 0; i < r.length - 1; i++) t += distancia(r[i], r[i+1]);
  return t;
}

function estimarTempoTotal(r, v = 35) {
  let t = 0;
  for (let i = 0; i < r.length - 1; i++) {
    t += (distancia(r[i], r[i+1]) / v) * 60;
    t += (r[i].tempoParada || 5);
  }
  return t;
}

module.exports = { distancia, calcularDistanciaTotal, estimarTempoTotal };
