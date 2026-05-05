var http = require('http');

http.createServer(function(req, res) {
  res.writeHead(200, {'Content-Type': 'application/json'});
  res.end('{"ok":true,"msg":"RotaLucro no ar!"}');
}).listen(3000, function() {
  console.log('RotaLucro rodando na porta 3000');
});
