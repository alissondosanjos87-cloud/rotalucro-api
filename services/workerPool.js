
const { Worker } = require('worker_threads');
const path = require('path');

class WorkerPool {
  constructor(max = 4) {
    this.max = max;
    this.active = 0;
    this.queue = [];
    this.processed = 0;
    this.errors = 0;
  }

  executar(data, timeout = 5000) {
    return new Promise(resolve => {
      this.queue.push({ data, timeout, resolve, ts: Date.now() });
      this._processar();
    });
  }

  _processar() {
    if (this.active >= this.max || !this.queue.length) return;
    const job = this.queue.shift();
    this.active++;

    try {
      const worker = new Worker(path.join(__dirname, '..', 'twoOptWorker.js'), { workerData: job.data });
      const timer = setTimeout(() => { worker.terminate(); this.active--; this.errors++; job.resolve({ rota: job.data.rota || [], interrompido: true }); this._processar(); }, job.timeout);

      worker.on('message', r => { clearTimeout(timer); this.active--; this.processed++; job.resolve({ ...r, interrompido: false }); this._processar(); });
      worker.on('error', e => { clearTimeout(timer); this.active--; this.errors++; job.resolve({ rota: job.data.rota || [], erro: e.message }); this._processar(); });
    } catch (e) {
      this.active--; this.errors++;
      job.resolve({ rota: job.data.rota || [], erro: e.message });
      this._processar();
    }
  }

  getStatus() { return { active: this.active, queue: this.queue.length, max: this.max, processed: this.processed, errors: this.errors }; }
  async shutdown() { while (this.queue.length || this.active) await new Promise(r => setTimeout(r, 100)); }
}

let instance;
function getWorkerPool() {
  if (!instance) instance = new WorkerPool(parseInt(process.env.MAX_WORKERS) || 2);
  return instance;
}

module.exports = { getWorkerPool };
