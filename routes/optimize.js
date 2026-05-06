const express = require('express');
const router = express.Router();
const cache = require('../services/cache');

router.post('/', function(req, res) {
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

    // Valida coordenadas
    for (var i = 0; i < paradas.length; i++) {
      var p = paradas[i];
      if (!p.lat || !p.lng || isNaN(p.lat) || isNaN(p.lng)) {
        return res.status(400).json({ error: 'Coordenadas invalidas' });
      }
      p.lat = parseFloat(p.lat);
      p.lng = parseFloat(p.lng);
    }

    // Otimização
    function dist(a, b) {
      var R = 6371;
      var toRad = function(d) { return d * Math.PI / 180; };
      var dLat = toRad(b.lat - a.lat);
      var dLng = toRad(b.lng - a.lng);
      var x = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLng/2)*Math.sin(dLng/2);
      return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
    }

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

    var distTotal = 0;
    for (var i = 0; i < rota.length-1; i++) {
      distTotal += dist(rota[i], rota[i+1]);
    }

    var resultado = {
      success: true,
      rota: rota,
      metricas: {
        distanciaTotal: parseFloat(distTotal.toFixed(2)),
        tempoEstimado: Math.round((distTotal/35)*60 + rota.length*5),
        totalParadas: rota.length,
        algoritmo: 'nearest-neighbor'
      }
    };

    // SALVA CACHE
    cache.set(paradas, resultado, 600000);

    res.json(resultado);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
