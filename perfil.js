const express = require('express');
const router = express.Router();

router.get('/bairros', async (req, res) => {
  try {
    const supabase = req.app.get('supabase');
    if (!supabase) return res.json({ bairros: [], offline: true });

    const { data } = await supabase
      .from('aprendizado_paradas')
      .select('bairro, tipo, tempo_medio, amostras')
      .eq('user_id', req.user?.id || 'anon')
      .order('amostras', { ascending: false })
      .limit(20);

    const agrupado = {};
    (data || []).forEach(d => {
      if (!agrupado[d.bairro]) agrupado[d.bairro] = { bairro: d.bairro, amostras: 0, tempoTotal: 0 };
      agrupado[d.bairro].amostras += d.amostras;
      agrupado[d.bairro].tempoTotal += d.tempo_medio * d.amostras;
    });

    const bairros = Object.values(agrupado)
      .map(b => ({ bairro: b.bairro, tempoMedio: (b.tempoTotal/b.amostras).toFixed(1), amostras: b.amostras }))
      .sort((a,b) => b.amostras - a.amostras);

    res.json({ bairros, total: bairros.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
