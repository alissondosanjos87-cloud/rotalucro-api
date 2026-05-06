require('dotenv').config();const express=require('express');const cors=require('cors');const app=express();
app.use(cors());app.use(express.json());
app.use('/api/health',require('./routes/health'));
app.use('/api/lucro',require('./routes/lucro'));
app.use('/api/optimize',require('./routes/optimize'));
app.get('/',(q,r)=>r.json({ok:true}));
const PORT=process.env.PORT||3000;app.listen(PORT,()=>console.log('ok'));  while (rest.length > 0) {
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
