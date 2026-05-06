const express = require('express');
const router = express.Router();
const cache = require('../services/cache');
const { getWorkerPool } = require('../services/workerPool');

router.post('/', async function(req, res) {
  try {
    var paradas = req.body.paradas;

    if (!paradas || paradas.length < 2) {
      return res.status(400).json({ error: 'Minimo 2 paradas' });
    }

    // VERIFICA CACHE
    var cached = cache.get(paradas);
    if (cached) {
      return res.json(Object.assign({}, cached, { cached: true }));
    }

    // Valida
    for (var i = 0; i < paradas.length; i++) {
      var p = paradas[i];
      if (!p.lat || !p.lng || isNaN(p.lat) || isNaN(p.lng)) {
        return res.status(400).json({ error: 'Coordenadas invalidas na parada ' + (i+1) });
      }
      p.lat = parseFloat(p.lat);
      p.lng = parseFloat(p.lng);
    }

    var resultado;
    
    // Usa Worker para rotas maiores (>30 paradas)
    if (paradas.length > 30) {
      var pool = getWorkerPool();
      var workerResult = await pool.executar({ rota: paradas }, 5000);
      resultado = { rota: workerResult.rota };
    } else {
      // Rota pequena: processa direto
      resultado = otimizarDireto(paradas);
    }

    var response = {
      success: true,
      rota: resultado.rota,
      metricas: {
        distanciaTotal: parseFloat(calcularDistancia(resultado.rota).toFixed(2)),
        tempoEstimado: Math.round((calcularDistancia(resultado.rota)/35)*60 + resultado.rota.length*5),
        totalParadas: resultado.rota.length,
        algoritmo: paradas.length > 30 ? 'nearest-neighbor + 2-opt (worker)' : 'nearest-neighbor'
      }
    };

    // SALVA CACHE
    cache.set(paradas, response, 600000);

    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function dist(a, b) {
  var R = 6371;
  var toRad = function(d) { return d * Math.PI / 180; };
  var dLat = toRad(b.lat - a.lat);
  var dLng = toRad(b.lng - a.lng);
  var x = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLng/2)*Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
}

function otimizarDireto(paradas) {
  var rest = paradas.slice();
  var rota = [rest.shift()];
  
  while (rest.length > 0) {
    var melhor = 0, melhorD = Infinity;
    var atual = rota[rota.length-1];
    for (var i = 0; i < rest.length; i++) {
      var d = dist(atual, rest[i]);
      if (d < melhorD) { melhorD = d; melhor = i; }
    }
    rota.push(rest.splice(melhor,1)[0]);
  }
  
  return { rota: rota };
}

function calcularDistancia(rota) {
  var total = 0;
  for (var i = 0; i < rota.length-1; i++) {
    total += dist(rota[i], rota[i+1]);
  }
  return total;
}

module.exports = router;
