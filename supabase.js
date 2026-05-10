const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl) {
  console.warn('⚠️ SUPABASE_URL não configurada - usando modo offline');
}

const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  : null;

const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  : supabase;

function sanitizarErro(err) {
  if (process.env.NODE_ENV === 'production') {
    return { error: 'Erro interno', code: err.code || 'UNKNOWN' };
  }
  return { error: err.message, code: err.code };
}

function logSeguro(nivel, mensagem, dados = {}) {
  const safe = { ...dados };
  delete safe.token; delete safe.apiKey; delete safe.authorization;
  const ts = new Date().toISOString();
  console[nivel](`[${ts}] ${mensagem}`, Object.keys(safe).length ? JSON.stringify(safe).substring(0, 300) : '');
}

async function verificarConexao() {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('paradas').select('count', { count: 'exact', head: true });
    return !error;
  } catch { return false; }
}

module.exports = { supabase, supabaseAdmin, sanitizarErro, logSeguro, verificarConexao };
