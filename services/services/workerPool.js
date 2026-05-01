const { Worker } = require('worker_threads');
const path = require('path');

class WorkerPool {
  constructor() {
    this.workers = [];
    this.queue = [];
    this.maxWorkers = 2;
    this.busy = new Set();
  }

  async execute(pedidos, historico) {
    return new Promise((resolve, reject) => {
      const job = { pedidos, historico, resolve, reject };
      const worker = this.getAvailableWorker();
      if (worker) {
        this.runJob(worker, job);
      } else {
        this.queue.push(job);
      }
    });
  }

  getAvailableWorker() {
    for (let i = 0; i < this.maxWorkers; i++) {
      if (!this.busy.has(i)) {
        if (!this.workers[i]) {
          this.workers[i] = new Worker(path.resolve(__dirname, '../twoOptWorker.js'));
        }
        return { id: i, worker: this.workers[i] };
      }
    }
    return null;
  }

  runJob({ id, worker }, { pedidos, historico, resolve, reject }) {
    this.busy.add(id);
    const timeout = setTimeout(() => {
      this.busy.delete(id);
      reject(new Error('Worker timeout'));
    }, 25000);

    worker.once('message', (result) => {
      clearTimeout(timeout);
      this.busy.delete(id);
      resolve(result);
      this.processQueue();
    });

    worker.once('error', (err) => {
      clearTimeout(timeout);
      this.busy.delete(id);
      reject(err);
      this.processQueue();
    });

    worker.postMessage({ pedidos, historico });
  }

  processQueue() {
    if (this.queue.length === 0) return;
    const worker = this.getAvailableWorker();
    if (worker) {
      const job = this.queue.shift();
      this.runJob(worker, job);
    }
  }

  getStatus() {
    return {
      total: this.maxWorkers,
      busy: this.busy.size,
      queued: this.queue.length
    };
  }
}

let pool;
function getWorkerPool() {
  if (!pool) pool = new WorkerPool();
  return pool;
}

module.exports = { getWorkerPool };
