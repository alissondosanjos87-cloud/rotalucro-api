console.log('=== TESTE ===');
console.log('Node versao:', process.version);
console.log('Diretorio:', __dirname);

var http = require('http');

var server = http.createServer(function(req, res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: true, msg: 'RotaLucro funcionando!' }));
});

server.listen(3000, function() {
  console.log('Servidor rodando na porta 3000');
});
