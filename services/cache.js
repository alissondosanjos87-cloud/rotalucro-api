// services/cache.js
class MemoryCache {
  constructor() {
    this.store = new Map();
    this.stats = { hits: 0, misses: 0 };
    
    setInterval(() => this._cleanup(), 5 * 60 * 1000);
  }

  _key(data) {
    if (Array.isArray(data)) {
      const pts = data.map(p => (p.lat || 0).toFixed(4) + ',' + (p.lng || 0).toFixed(4)).sort().join('|');
      return 'rota:' + pts + ':' + data.length;
    }
    return JSON.stringify(data);
  }

  get(data) {
    const key = this._key(data);
    const item = this.store.get(key);
    if (!item || Date.now() > item.expira) {
      this.stats.misses++;
      return null;
    }
    this.stats.hits++;
    return item.value;
  }

  set(data, value, ttl) {
    const key = this._key(data);
    if (this.store.size > 500) {
      const first = this.store.keys().next().value;
      this.store.delete(first);
    }
    this.store.set(key, {
      value: value,
      expira: Date.now() + (ttl || 600000),
    });
  }

  _cleanup() {
    const agora = Date.now();
    for (const [key, item] of this.store) {
      if (agora > item.expira) this.store.delete(key);
    }
  }

  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: total > 0 ? ((this.stats.hits / total) * 100).toFixed(1) + '%' : '0%',
      size: this.store.size,
    };
  }
}

module.exports = new MemoryCache();
