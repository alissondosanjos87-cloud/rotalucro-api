import { useState, useEffect } from 'react'

const CHAVE = 'rl_paradas'

export function useRota() {
  const [rota, setRota] = useState(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CHAVE)
      if (saved) setRota(JSON.parse(saved))
    } catch (_) {}
  }, [])

  function salvar(data) {
    localStorage.setItem(CHAVE, JSON.stringify(data))
    localStorage.setItem('rl_ultima_rota', JSON.stringify(data))
    setRota(data)
  }

  function limpar() {
    localStorage.removeItem(CHAVE)
    setRota(null)
  }

  return { rota, paradas: rota?.paradas || [], salvar, limpar }
}
