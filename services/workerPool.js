let pool = null;
function getWorkerPool() {
  if (!pool) {
    pool = {
      acquire: async () => ({}),
      release: async () => {},
      getStatus: () => ({ active: 0, idle: 0, version: 'v3.0-free' })
    };
  }
  return pool;
}
module.exports = { getWorkerPool };
