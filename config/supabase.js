const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function sanitizarErro(err) {
  if (process.env.NODE_ENV === 'production') {
    return { error: 'Erro interno', code: err.code || 'UNKNOWN' };
  }
  return { error: err.message, code: err.code };
}

function logSeguro(nivel, mensagem, dados = {}) {
  const safe = { ...dados };
  delete safe.token; delete safe.apiKey; delete safe.authorization;
  console[nivel](`[${new Date().toISOString()}] ${mensagem}`, JSON.stringify(safe));
}

module.exports = { supabase, sanitizarErro, logSeguro };
