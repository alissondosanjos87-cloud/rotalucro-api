javascript
const { distancia } = require('./utils');
const calcularScore = require('./score');

function nearestNeighbor(paradas, startIndex = 0) {
  if (!paradas || paradas.length <= 1) return paradas ? [...paradas] : [];

  const rest = [...paradas];
  const rota = [];
  let atual = rest.splice(startIndex, 1)[0];
  rota.push(atual);

  const hora = new Date().getHours();

  while (rest.length) {
    let melhor = 0, melhorScore = Infinity;
    for (let i = 0; i < rest.length; i++) {
      const d = distancia(atual, rest[i]);
      const score = calcularScore({ distancia: d, tempoParada: rest[i].tempoParada || 5, hora, tipo: rest[i].tipo || 'casa' });
      if (score < melhorScore) { melhorScore = score; melhor = i; }
    }
    atual = rest.splice(melhor, 1)[0];
    rota.push(atual);
  }
  return rota;
}

module.exports = nearestNeighbor;
