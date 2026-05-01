```javascript
// Cache de distâncias Haversine
// Evita recalcular pares já calculados
const cache = new Map();
let hits = 0, misses = 0;

function get(a, b) {
  const key = a.lat < b.lat 
    ? `${a.lat.toFixed(5)},${a.lng.toFixed(5)}|${b.lat.toFixed(5)},${b.lng.toFixed(5)}`
    : `${b.lat.toFixed(5)},${b.lng.toFixed(5)}|${a.lat.toFixed(5)},${a.lng.toFixed(5)}`;
  
  if (cache.has(key)) { hits++; return cache.get(key); }
  misses++;
  return null;
}

function set(a, b, valor) {
  const key = a.lat < b.lat 
    ? `${a.lat.toFixed(5)},${a.lng.toFixed(5)}|${b.lat.toFixed(5)},${b.lng.toFixed(5)}`
    : `${b.lat.toFixed(5)},${b.lng.toFixed(5)}|${a.lat.toFixed(5)},${a.lng.toFixed(5)}`;
  cache.set(key, valor);
}

function getStats() {
  const total = hits + misses;
  return { size: cache.size, hits, misses, hitRate: total > 0 ? ((hits/total)*100).toFixed(1)+'%' : '0%' };
}

function clear() { cache.clear(); hits = 0; misses = 0; }

module.exports = { get, set, getStats, clear };
```
