// otimizador/utils.js
const { estimarMinutos } = require('../aprendizado/transito');

function distancia(a, b) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const h = Math.sin(dLat/2)**2 +
    Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLng/2)**2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function calcularDistanciaTotal(rota) {
  if (!rota || rota.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < rota.length - 1; i++) total += distancia(rota[i], rota[i+1]);
  return total;
}

function estimarTempoTotal(rota) {
  if (!rota || rota.length < 2) return 0;
  const hora = new Date().getHours();
  let minutos = 0;
  for (let i = 0; i < rota.length - 1; i++) {
    minutos += estimarMinutos(distancia(rota[i], rota[i+1]), hora);
    minutos += (rota[i].tempoParada || 3);
  }
  return minutos;
}

module.exports = { distancia, calcularDistanciaTotal, estimarTempoTotal };
