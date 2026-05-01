// Worker pool simples - não usa Redis no plano free
let pool = null;

function getWorkerPool() {
  if (!pool) {
    pool = {
      query: async (fn) => await fn(),
      close: async () => {}
    };
  }
  return pool;
}

module.exports = { getWorkerPool };
