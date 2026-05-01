const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { rota_id, parada_id, tipo, lat, lng } = req.body;
    if (!rota_id || !parada_id || !tipo) return res.status(400).json({ error: 'rota_id, parada_id e tipo obrigatórios' });

    // Se for saída, poderia disparar aprendizado aqui
    res.json({ success: true, message: tipo === 'chegada' ? '📍 Chegada registrada' : '✅ Saída registrada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; um
module.exports = router;
