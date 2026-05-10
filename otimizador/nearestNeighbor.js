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
  let melhor = null;
  let melhorDist = Infinity;

  for (let i = 0; i < tentativas; i++) {
    const base = i === 0 ? [...paradas] : embaralhar(paradas);

    let rota = nearestNeighbor(base);

    if (rota.length >= 4) {
      rota = twoOpt(rota, 2).rota;
    }

    const d = calcularDistanciaTotal(rota);

    if (d < melhorDist) {
      melhorDist = d;
      melhor = rota;
    }
  }

  return melhor;
}

module.exports = multiStart;
