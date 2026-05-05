const express = require('express');
const router = express.Router();

router.post('/', function(req, res) {
  try {
    var paradas = req.body.paradas;

    if (!paradas || paradas.length < 2) {
      return res.status(400).json({ error: 'Minimo 2 paradas' });
    }

    // Valida coordenadas
    for (var i = 0; i < paradas.length; i++) {
      var p = paradas[i];
      if (!p.lat || !p.lng || isNaN(p.lat) || isNaN(p.lng)) {
        return res.status(400).json({ error: 'Coordenadas invalidas na parada ' + (i + 1) });
      }
      p.lat = parseFloat(p.lat);
      p.lng = parseFloat(p.lng);
      if (!p.tempoParada) {
        p.tempoParada = p.tipo === 'condominio' ? 10 : p.tipo === 'apto' ? 6 : 3;
      }
      if (!p.tipo) p.tipo = 'casa';
    }

    // Otimização simples (Nearest Neighbor)
    function dist(a, b) {
      var R = 6371;
      var toRad = function(d) { return d * Math.PI / 180; };
      var dLat = toRad(b.lat - a.lat);
      var dLng = toRad(b.lng - a.lng);
      var x = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
      return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
    }

    function nearestNeighbor(pts) {
      var rest = pts.slice();
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

      return rota;
    }

    var rota = nearestNeighbor(paradas);

    // Calcula distância total
    var distTotal = 0;
    for (var i = 0; i < rota.length - 1; i++) {
      distTotal += dist(rota[i], rota[i + 1]);
    }

    res.json({
      success: true,
      rota: rota,
      metricas: {
        distanciaTotal: parseFloat(distTotal.toFixed(2)),
        tempoEstimado: Math.round((distTotal / 35) * 60 + rota.length * 5),
        totalParadas: rota.length,
        algoritmo: 'nearest-neighbor',
      },
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;      });
    }

    // 3. 🔥 LIMITE MÁXIMO (protege o servidor)
    const LIMITE_MAXIMO = 150;
    if (paradas.length > LIMITE_MAXIMO) {
      return res.status(400).json({
        error: `Limite máximo de ${LIMITE_MAXIMO} paradas por requisição`,
        recebido: paradas.length,
        sugestao: 'Divida em lotes menores ou use o plano Frota',
      });
    }

    // 4. Valida coordenadas
    const invalidas = [];
    for (let i = 0; i < paradas.length; i++) {
      const p = paradas[i];
      if (!p.lat || !p.lng || isNaN(p.lat) || isNaN(p.lng)) {
        invalidas.push({ indice: i, parada: p });
      }
      // Normaliza
      p.lat = parseFloat(p.lat);
      p.lng = parseFloat(p.lng);
      
      // Valores padrão
      if (!p.tempoParada) {
        p.tempoParada = p.tipo === 'condominio' ? 10 : p.tipo === 'apto' ? 6 : 3;
      }
      if (!p.tipo) p.tipo = 'casa';
    }

    if (invalidas.length > 0) {
      return res.status(400).json({
        error: `${invalidas.length} parada(s) com coordenadas inválidas`,
        invalidas: invalidas.slice(0, 5), // Mostra só 5
      });
    }

    // 5. 🔥 DETECTA DUPLICATAS (bug comum)
    const coords = paradas.map(p => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`);
    const unicas = new Set(coords);
    if (unicas.size < paradas.length) {
      logSeguro('warn', 'Paradas duplicadas detectadas', {
        total: paradas.length,
        unicas: unicas.size,
        duplicadas: paradas.length - unicas.size,
      });
    }

    // 6. Log de uso
    logSeguro('log', 'Otimizando', {
      paradas: paradas.length,
      faixa: paradas.length <= 60 ? 'normal' : paradas.length <= 100 ? 'alto' : 'pesado',
    });

    // ============================================================
    // CACHE
    // ============================================================
    const cached = routeCache.get(paradas);
    if (cached) {
      logSeguro('log', 'Cache HIT', { paradas: paradas.length });
      return res.json({
        success: true,
        cached: true,
        fromCache: true,
        ...cached,
      });
    }

    // ============================================================
    // OTIMIZAÇÃO ADAPTATIVA
    // ============================================================
    const resultado = await otimizarRotaAvancada(paradas, options);

    // Prepara resposta
    const response = {
      success: true,
      cached: false,
      rota: resultado.rota,
      metricas: {
        ...resultado.metricas,
        tempoProcessamento: Date.now() - req.startTime,
      },
      // 🔥 Informa qual estratégia foi usada
      estrategia: {
        tamanhoRota: paradas.length,
        qualidade: paradas.length <= 60 ? 'máxima' : 
                   paradas.length <= 100 ? 'equilibrada' : 'rápida',
        ...resultado.metricas.adaptativo,
      },
    };

    // Salva cache (TTL maior para rotas pequenas)
    const ttl = paradas.length <= 30 ? 1800000 : // 30 min
                paradas.length <= 60 ? 600000 :  // 10 min
                300000;                           // 5 min
    routeCache.set(paradas, response, ttl);

    logSeguro('log', 'Otimizado', {
      paradas: paradas.length,
      distancia: resultado.metricas.distanciaTotal + 'km',
      tempo: (Date.now() - req.startTime) + 'ms',
      algoritmo: resultado.metricas.algoritmo,
    });

    res.json(response);

  } catch (err) {
    logSeguro('error', 'Erro /optimize', {
      error: err.message,
      paradas: req.body?.paradas?.length || 0,
    });
    res.status(500).json(sanitizarErro(err));
  }
});

// ============================================================
// GET /api/optimize/limits - Informa limites
// ============================================================
router.get('/limits', (req, res) => {
  res.json({
    maximoParadas: 150,
    faixas: {
      normal: { min: 2, max: 60, qualidade: 'máxima', tentativas: 6 },
      alto: { min: 61, max: 100, qualidade: 'equilibrada', tentativas: 4 },
      pesado: { min: 101, max: 150, qualidade: 'rápida', tentativas: 2 },
    },
    cache: routeCache.getStats(),
  });
});

module.exports = router;
