var express = require('express');
var app = express();

app.use(express.json());

app.get('/', function(req, res) {
  res.json({ ok: true, msg: 'RotaLucro no ar!', version: '4.0.0' });
});

app.get('/api/health', function(req, res) {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// Rota de otimização
app.post('/api/optimize', function(req, res) {
  var paradas = req.body.paradas;

  if (!paradas || paradas.length < 2) {
    return res.status(400).json({ error: 'Minimo 2 paradas' });
  }

  // Calcula distância entre dois pontos
  function dist(a, b) {
    var R = 6371;
    var dLat = (b.lat - a.lat) * Math.PI / 180;
    var dLng = (b.lng - a.lng) * Math.PI / 180;
    var x = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(a.lat * Math.PI/180) * Math.cos(b.lat * Math.PI/180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
  }

  // Nearest Neighbor simples
  var rest = paradas.slice();
  var rota = [rest.shift()];

  while (rest.length > 0) {
    var melhor = 0;
    var melhorD = Infinity;
    var atual = rota[rota.length - 1];

    for (var i = 0; i < rest.length; i++) {
      var d = dist(atual, rest[i]);
      if (d < melhorD) {
        melhorD = d;
        melhor = i;
      }
    }

    rota.push(rest.splice(melhor, 1)[0]);
  }

  // Distância total
  var distTotal = 0;
  for (var i = 0; i < rota.length - 1; i++) {
    distTotal += dist(rota[i], rota[i+1]);
  }

  res.json({
    success: true,
    rota: rota,
    metricas: {
      distanciaTotal: parseFloat(distTotal.toFixed(2)),
      tempoEstimado: Math.round((distTotal / 35) * 60 + rota.length * 5),
      totalParadas: rota.length,
      algoritmo: 'nearest-neighbor'
    }
  });
});

app.listen(3000, function() {
  console.log('RotaLucro API port 3000');
});
