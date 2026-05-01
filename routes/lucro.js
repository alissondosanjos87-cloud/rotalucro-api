import express from 'express';
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const {
      origem,
      destino,
      valor_frete,
      distancia_km = 250,
      consumo_km_l = 2.5,
      preco_combustivel = 6.30,
      pedagio = 0,
      outros_custos = 0
    } = req.body;

    if (!origem || !destino || !valor_frete) {
      return res.status(400).json({ 
        error: 'Informe origem, destino e valor_frete' 
      });
    }

    const litros = distancia_km / consumo_km_l;
    const custo_combustivel = litros * preco_combustivel;
    const custo_total = custo_combustivel + Number(pedagio) + Number(outros_custos);
    const lucro = Number(valor_frete) - custo_total;

    res.json({
      rota: `${origem} → ${destino}`,
      distancia_km,
      valor_frete: Number(valor_frete),
      custo_combustivel: Number(custo_combustivel.toFixed(2)),
      pedagio: Number(pedagio),
      outros_custos: Number(outros_custos),
      custo_total: Number(custo_total.toFixed(2)),
      lucro: Number(lucro.toFixed(2)),
      lucro_por_km: Number((lucro / distancia_km).toFixed(2)),
      viavel: lucro > 0,
      mensagem: lucro > 0 ? 'ROTA LUCRATIVA' : 'PREJUÍZO',
      calculado_em: new Date().toLocaleString('pt-BR')
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
