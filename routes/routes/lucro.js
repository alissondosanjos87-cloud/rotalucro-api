const express = require('express');
const router = express.Router();
const { logSeguro, sanitizarErro } = require('../config/supabase');

router.post('/', async (req, res) => {
  try {
    const { rota, distancia_km, valor_frete, custo_km, custo_hora, tempo_estimado_horas } = req.body;
    const userId = req.user.id;

    if (!distancia_km || !valor_frete) {
      return res.status(400).json({ error: 'distancia_km e valor_frete são obrigatórios' });
    }

    const custoKm = custo_km || 2.50;
    const custoHora = custo_hora || 25.00;
    const tempoHoras = tempo_estimado_horas || (distancia_km / 40);

    const custoCombustivel = distancia_km * custoKm;
    const custoTempo = tempoHoras * custoHora;
    const custoTotal = custoCombustivel + custoTempo;
    const lucroLiquido = valor_frete - custoTotal;
    const margem = ((lucroLiquido / valor_frete) * 100).toFixed(1);

    const resultado = {
      distancia_km: parseFloat(distancia_km).toFixed(1),
      tempo_estimado_h: tempoHoras.toFixed(1),
      valor_frete: `R$ ${valor_frete.toFixed(2)}`,
      custos: {
        combustivel: `R$ ${custoCombustivel.toFixed(2)}`,
        tempo: `R$ ${custoTempo.toFixed(2)}`,
        total: `R$ ${custoTotal.toFixed(2)}`
      },
      lucro_liquido: `R$ ${lucroLiquido.toFixed(2)}`,
      margem: `${margem}%`,
      vale_a_pena: lucroLiquido > 0
    };

    const supabase = req.app.get('supabase');
    await supabase.from('historico_lucro').insert({
      user_id: userId,
      distancia_km,
      valor_frete,
      custo_total: custoTotal,
      lucro_liquido: lucroLiquido,
      margem_percent: parseFloat(margem)
    });

    logSeguro('info', 'Cálculo lucro', { userId, margem: margem + '%' });
    res.json(resultado);

  } catch (err) {
    logSeguro('error', 'Erro /lucro', { error: err.message });
    res.status(500).json(sanitizarErro(err));
  }
});

module.exports = router;
