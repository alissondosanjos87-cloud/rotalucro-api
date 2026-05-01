const express = require('express');
const router = express.Router();
const { getWorkerPool } = require('../services/workerPool');
const routeCache = require('../services/cache');
const { logSeguro, sanitizarErro } = require('../config/supabase');

router.post('/', async (req, res) => {
  try {
    const { pedidos } = req.body;
    const userId = req.user.id;

    if (!pedidos || !Array.isArray(pedidos) || pedidos.length < 2) {
      return res.status(400).json({ error: 'Envie ao menos 2 pedidos com lat/lng' });
    }

    const cached = await routeCache.get(pedidos);
    if (cached) {
      logSeguro('info', 'Cache HIT', { userId, pedidos: pedidos.length });
      return res.json({ ...cached, cached: true });
    }

    const supabase = req.app.get('supabase');
    const { data: historico } = await supabase
      .from('historico_transito')
      .select('origem, destino, tempo_estimado, tempo_real')
      .eq('user_id', userId)
      .limit(100);

    logSeguro('info', 'Iniciando otimização', { userId, pedidos: pedidos.length });
    const pool = getWorkerPool();
    const resultado = await pool.execute(pedidos, historico || []);

    await routeCache.set(pedidos, resultado);

    await supabase.from('metricas_otimizacao').insert({
      user_id: userId,
      qtd_pedidos: pedidos.length,
      distancia_km: parseFloat(resultado.distancia_km),
      tempo_processamento_ms: Date.now() - req.startTime
    });

    res.json({ ...resultado, cached: false });

  } catch (err) {
    logSeguro('error', 'Erro /optimize', { error: err.message });
    res.status(500).json(sanitizarErro(err));
  }
});

router.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});

module.exports = router;
