// routes/health.js
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ ok: true, version: '4.0', timestamp: new Date().toISOString() });
});

router.get('/detalhado', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    memoria: (process.memoryUsage().rss / 1024 / 1024).toFixed(0) + ' MB',
    node: process.version,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
