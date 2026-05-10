// Cache em memória com TTL configurável
class MemoryCache {
  constructor() {
    this.store = new Map();
    this.stats = { hits: 0, misses: 0 };
    
    // Limpeza periódica a cada 5 minutos
    setInterval(() => this._cleanup(), 5 * 60 * 1000);
  }

  _key(data) {
    if (Array.isArray(data)) {
      const pts = data
        .map(p => `${(p.lat || 0).toFixed(4)},${(p.lng || 0).toFixed(4)}`)
        .sort()
        .join('|');
      return `rota:${pts}:${data.length}`;
    }
    return JSON.stringify(data);
  }

  get(data) {
    const key = this._key(data);
    const item = this.store.get(key);

    if (!item) {
      this.stats.misses++;
      return null;
    }

    if (Date.now() > item.expira) {
      this.store.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return item.value;
  }

  set(data, value, ttl = 600000) {
    const key = this._key(data);
    
    // Limita tamanho do cache (evita vazamento de memória)
    if (this.store.size > 500) {
      const firstKey = this.store.keys().next().value;
      this.store.delete(firstKey);
    }

    this.store.set(key, {
      value,
      expira: Date.now() + ttl,
      tamanho: Array.isArray(data) ? data.length : 1,
    });
  }

  _cleanup() {
    const agora = Date.now();
    let removidos = 0;
    for (const [key, item] of this.store) {
      if (agora > item.expira) {
        this.store.delete(key);
        removidos++;
      }
    }
    if (removidos > 0) {
      console.log(`🧹 Cache limpo: ${removidos} itens expirados`);
    }
  }

  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: total > 0 ? ((this.stats.hits / total) * 100).toFixed(1) + '%' : '0%',
      size: this.store.size,
      type: 'memory',
    };
  }

  clear() {
    this.store.clear();
    this.stats = { hits: 0, misses: 0 };
  }
}

module.exports = new MemoryCache();      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: total > 0 ? ((this.stats.hits / total) * 100).toFixed(1) + '%' : '0%',
      size: this.store.size,
      type: 'memory',
    };
  }

  clear() {
    this.store.clear();
    this.stats = { hits: 0, misses: 0 };
  }
}

module.exports = new MemoryCache();    const ttl = 3600;

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
