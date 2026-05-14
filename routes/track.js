// routes/track.js
const express = require('express');
const router = express.Router();
const eventos = [];

router.post('/', (req, res) => {
  try {
    const { rota_id, parada_id, tipo, lat, lng, nome } = req.body;
    if (!tipo) return res.status(400).json({ error: 'tipo obrigatório' });
    const evento = { rota_id:rota_id||'sem-rota', parada_id:parada_id||0,
      nome:nome||'', tipo, lat:lat||null, lng:lng||null,
      timestamp: new Date().toISOString() };
    eventos.push(evento);
    if (eventos.length > 2000) eventos.shift();
    res.json({ ok: true, evento });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:rota_id', (req, res) => {
  res.json(eventos.filter(e => e.rota_id === req.params.rota_id));
});

router.get('/', (req, res) => {
  res.json({ total: eventos.length, eventos: eventos.slice(-50).reverse() });
});

module.exports = router;
