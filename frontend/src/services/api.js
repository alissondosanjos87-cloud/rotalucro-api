const BASE = '/api'

function getToken() {
  return localStorage.getItem('rl_token') || ''
}

async function request(path, options = {}) {
  const resp = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { 'Authorization': `Bearer ${getToken()}`, ...options.headers }
  })
  const data = await resp.json()
  if (!resp.ok) throw new Error(data.error || 'Erro na requisição')
  return data
}

export const api = {
  async upload(file, raio = 30) {
    const fd = new FormData()
    fd.append('file', file)
    const resp = await fetch(`${BASE}/upload?raio=${raio}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getToken()}` },
      body: fd
    })
    const data = await resp.json()
    if (!resp.ok) throw new Error(data.error || 'Erro no upload')
    return data
  },

  async track(paradaId, nome, tipo = 'concluida') {
    return fetch(`${BASE}/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parada_id: paradaId, nome, tipo })
    }).catch(() => {})
  },

  async health() {
    return request('/health')
  }
}
