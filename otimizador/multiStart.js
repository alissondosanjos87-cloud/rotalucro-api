javascript
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

function multiStart(paradas, tentativas = 6) {
  if (!paradas || paradas.length < 3) return paradas ? [...paradas] : [];

  const n = Math.min(tentativas, Math.max(3, Math.floor(paradas.length / 5)));
  let melhorRota = null, melhorDist = Infinity;

  for (let i = 0; i < n; i++) {
    const base = embaralhar(paradas);
    let rota = nearestNeighbor(base, 0);
    if (rota.length >= 4 && rota.length <= 120) {
      rota = twoOpt(rota, 2).rota;
    }
    const d = calcularDistanciaTotal(rota);
    if (d < melhorDist) { melhorDist = d; melhorRota = rota; }
  }
  return melhorRota || paradas;
}

module.exports = multiStart;
