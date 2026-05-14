// otimizador/multiStart.js
const nearestNeighbor = require('./nearestNeighbor');
const twoOpt = require('./twoOpt');
const { calcularDistanciaTotal } = require('./utils');

function embaralhar(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function multiStart(paradas, tentativas = 6, timeLimitMs = 4000) {
  if (!paradas || paradas.length < 2) return paradas || [];
  let melhor = null, melhorDist = Infinity;
  const inicio = Date.now();
  const t = paradas.length > 80 ? 2 : paradas.length > 40 ? 4 : tentativas;

  for (let i = 0; i < t; i++) {
    if (Date.now() - inicio > timeLimitMs) break;
    const base = i === 0 ? [...paradas] : embaralhar(paradas);
    let rota = nearestNeighbor(base);
    if (rota.length >= 4 && Date.now() - inicio < timeLimitMs - 500) {
      rota = twoOpt(rota, 2, Math.min(1500, timeLimitMs - (Date.now() - inicio))).rota;
    }
    const d = calcularDistanciaTotal(rota);
    if (d < melhorDist) { melhorDist = d; melhor = rota; }
  }
  return melhor;
}

module.exports = multiStart;
