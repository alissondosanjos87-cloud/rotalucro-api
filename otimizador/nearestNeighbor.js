// otimizador/nearestNeighbor.js
var { distancia } = require('./utils');
var calcularScore = require('./score');

function nearestNeighbor(paradas, startIndex) {
  if (!paradas || paradas.length <= 1) return paradas ? paradas.slice() : [];

  var rest = paradas.slice();
  var rota = [];
  var atual = rest.splice(startIndex || 0, 1)[0];
  rota.push(atual);

  var hora = new Date().getHours();

  while (rest.length > 0) {
    var melhor = 0;
    var melhorScore = Infinity;

    for (var i = 0; i < rest.length; i++) {
      var d = distancia(atual, rest[i]);
      var score = calcularScore({
        distancia: d,
        tempoParada: rest[i].tempoParada || 5,
        hora: hora,
        tipo: rest[i].tipo || 'casa'
      });

      if (score < melhorScore) {
        melhorScore = score;
        melhor = i;
      }
    }

    atual = rest.splice(melhor, 1)[0];
    rota.push(atual);
  }

  return rota;
}

module.exports = nearestNeighbor;
