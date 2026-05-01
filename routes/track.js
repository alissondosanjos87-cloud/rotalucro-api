const express = require('express');
const router = express.Router();
const { logSeguro, sanitizarErro } = require('../config/supabase');

router.post('/', async (req, res) => {
  try {
    const { origem, destino, tempo_estimado, tempo_real, distancia_km } = req.body;
    const userId = req.user.id;

    if (!origem || !destino || !tempo_real) {
      return res.status(400).json({ error: 'origem, destino e tempo_real são obrigatórios' });
    }

    const supabase = req.app.get('supabase');
    const { error } = await supabase
      .from('historico_transito')
      .insert({
        user_id: userId,
        origem,
        destino,
        tempo_estimado: tempo_estimado || null,
        tempo_real,
        distancia_km: distancia_km || null,
        fator_transito: tempo_estimado? (tempo_real / tempo_estimado).toFixed(2) : null
      });

    if (error) throw error;

    logSeguro('info', 'Track salvo', { userId, origem, destino });
    res.json({ success: true, message: 'Dados de trânsito salvos. IA aprendendo...' });

  } catch (err) {
    logSeguro('error', 'Erro /track', { error: err.message });
    res.status(500).json(sanitizarErro(err));
  }
});

module.exports = router;
