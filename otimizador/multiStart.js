// otimizador/multiStart.js
var nearestNeighbor = require('./nearestNeighbor');
var twoOpt = require('./twoOpt');
var { calcularDistanciaTotal } = require('./utils');

function embaralhar(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

function multiStart(paradas, tentativas) {
  if (!paradas || paradas.length < 3) return paradas ? paradas.slice() : [];
  
  var numTentativas = Math.min(tentativas || 5, Math.max(3, Math.floor(paradas.length / 5)));
  var melhorRota = null;
  var melhorDist = Infinity;

  for (var t = 0; t < numTentativas; t++) {
    var base = embaralhar(paradas);
    var rota = nearestNeighbor(base);
    
    if (rota.length >= 4) {
      var refino = twoOpt(rota, 2);
      rota = refino.rota;
    }
    
    var dist = calcularDistanciaTotal(rota);
    if (dist < melhorDist) {
      melhorDist = dist;
      melhorRota = rota;
    }
  }

  return melhorRota || paradas;
}

module.exports = multiStart;
