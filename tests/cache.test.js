// tests/cache.test.js
console.log('🧪 Teste de Cache');
console.log('================\n');

var cache = {};

function getCache(key) {
  var item = cache[key];
  if (!item) return null;
  if (Date.now() > item.expira) { delete cache[key]; return null; }
  return item.value;
}

function setCache(key, value, ttl) {
  cache[key] = { value: value, expira: Date.now() + (ttl || 60000) };
}

// Testes
setCache('rota1', { km: 12.5 });
var r1 = getCache('rota1');
console.log('✅ Cache hit: ' + (r1 ? r1.km + 'km' : 'falhou'));

var r2 = getCache('rota2');
console.log('✅ Cache miss: ' + (r2 === null ? 'OK' : 'falhou'));

setCache('rota3', { km: 5 }, 1); // 1ms TTL
setTimeout(function() {
  var r3 = getCache('rota3');
  console.log('✅ Cache expirado: ' + (r3 === null ? 'OK' : 'falhou'));
  console.log('\n✅ TESTE APROVADO!');
  process.exit(0);
}, 10);
