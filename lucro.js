const express = require('express');
const router = express.Router();

router.post('/calcular', (req, res) => {
  try {
    const { valor_frete, distancia_km, tempo_min, paradas = 1 } = req.body;
    if (!valor_frete || !distancia_km) return res.status(400).json({ error: 'valor_frete e distancia_km obrigatórios' });

    const custoKm = parseFloat(process.env.CUSTO_KM) || 0.80;
    const custoTotal = distancia_km * custoKm;
    const lucro = valor_frete - custoTotal;
    const ganhoHora = tempo_min > 0 ? (lucro / (tempo_min / 60)) : 0;

    res.json({
      lucro: parseFloat(lucro.toFixed(2)),
      ganhoHora: parseFloat(ganhoHora.toFixed(2)),
      custoTotal: parseFloat(custoTotal.toFixed(2)),
      viavel: lucro > 0,
      mensagem: lucro > 0 ? '✅ Lucrativa' : '❌ Prejuízo',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;      lucro_por_km: Number((lucro / distancia_km).toFixed(2)),
      viavel: lucro > 0,
      mensagem: lucro > 0 ? 'ROTA LUCRATIVA' : 'PREJUÍZO',
      calculado_em: new Date().toLocaleString('pt-BR')
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
