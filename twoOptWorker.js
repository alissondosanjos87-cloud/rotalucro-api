// twoOptWorker.js
var { parentPort, workerData } = require('worker_threads');

function dist(a, b) {
  var R = 6371;
  var toRad = function(d) { return d * Math.PI / 180; };
  var dLat = toRad(b.lat - a.lat);
  var dLng = toRad(b.lng - a.lng);
  var x = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLng/2)*Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
}

function twoOpt(rota) {
  if (!rota || rota.length < 4) return { rota: rota || [], melhorias: 0 };
  
  var melhor = rota.slice();
  var melhorias = 0;
  
  for (var k = 0; k < 2; k++) {
    for (var i = 1; i < melhor.length - 2; i++) {
      for (var j = i + 1; j < melhor.length - 1; j++) {
        var antes = dist(melhor[i-1], melhor[i]) + dist(melhor[j], melhor[j+1]);
        var depois = dist(melhor[i-1], melhor[j]) + dist(melhor[i], melhor[j+1]);
        
        if (depois < antes - 0.01) {
          var trecho = melhor.slice(i, j+1).reverse();
          melhor = melhor.slice(0, i).concat(trecho, melhor.slice(j+1));
          melhorias++;
        }
      }
    }
  }
  
  return { rota: melhor, melhorias: melhorias };
}

try {
  var rota = workerData.rota || workerData;
  var resultado = twoOpt(rota);
  parentPort.postMessage({ success: true, rota: resultado.rota });
} catch (e) {
  parentPort.postMessage({ success: false, erro: e.message, rota: workerData.rota || [] });
}
