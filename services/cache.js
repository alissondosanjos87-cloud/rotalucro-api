const Redis = require('ioredis');

class RouteCache {
  constructor() {
    this.redis = process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL)
      : null;
    this.memCache = new Map();
    this.stats = { hits: 0, misses: 0 };
  }

  _genKey(pedidos) {
    const ids = pedidos.map(p => p.id).sort().join('-');
    return `route:${ids}:${pedidos.length}`;
  }

  async get(pedidos) {
    const key = this._genKey(pedidos);

    if (this.redis) {
      const cached = await this.redis.get(key);
      if (cached) {
        this.stats.hits++;
        return JSON.parse(cached);
      }
    } else if (this.memCache.has(key)) {
      this.stats.hits++;
      return this.memCache.get(key);
    }

    this.stats.misses++;
    return null;
  }

  async set(pedidos, resultado) {
    const key = this._genKey(pedidos);
    const ttl = 3600;

    if (this.redis) {
      await this.redis.setex(key, ttl, JSON.stringify(resultado));
    } else {
      this.memCache.set(key, resultado);
      setTimeout(() => this.memCache.delete(key), ttl * 1000);
    }
  }

  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: total? ((this.stats.hits / total) * 100).toFixed(1) + '%' : '0%',
      type: this.redis? 'redis' : 'memory'
    };
  }
}

module.exports = new RouteCache();
