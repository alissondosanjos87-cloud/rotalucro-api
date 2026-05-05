var express = require('express');
var app = express();

app.get('/', function(req, res) {
  res.json({ ok: true, msg: 'RotaLucro no ar!', version: '4.0.0' });
});

app.get('/api/health', function(req, res) {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.listen(3000, function() {
  console.log('RotaLucro API rodando na porta 3000');
});
