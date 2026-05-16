import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../components/Card'
import StatCard from '../components/StatCard'

const CHAVE = 'rl_historico_v2'

function carregarHistorico() {
  try { return JSON.parse(localStorage.getItem(CHAVE) || '[]') } catch { return [] }
}

function salvarHistorico(h) {
  localStorage.setItem(CHAVE, JSON.stringify(h.slice(-50)))
}

export default function Historico() {
  const [hist, setHist] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const ultima = localStorage.getItem('rl_ultima_rota')
    let historico = carregarHistorico()
    if (ultima) {
      try {
        const r = JSON.parse(ultima)
        const agora = new Date()
        historico.push({
          nome: r.nomeRota || 'Rota ' + agora.toLocaleDateString('pt-BR'),
          data: agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          paradas: r.totalParadas || 0,
          km: r.totalKm || 0,
          lucro: r.lucroEstimado || 0
        })
        salvarHistorico(historico)
        localStorage.removeItem('rl_ultima_rota')
      } catch (_) {}
    }
    setHist([...historico].reverse())
  }, [])

  function remover(idx) {
    if (!confirm('Remover esta rota?')) return
    const historico = carregarHistorico()
    historico.splice(hist.length - 1 - idx, 1)
    salvarHistorico(historico)
    setHist([...historico].reverse())
  }

  const totalLucro = hist.reduce((s, r) => s + (r.lucro || 0), 0)

  return (
    <div className="min-h-dvh bg-[#0a0f1a] px-5 py-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-[#111827] border border-white/10 flex items-center justify-center text-lg">
          ←
        </button>
        <h1 className="text-xl font-extrabold">
          Rota<span className="text-[#00C853]">Lucro</span>
        </h1>
      </div>

      {hist.length > 0 && (
        <Card accent="green" className="grid grid-cols-2 gap-4 mb-5">
          <StatCard label="Total de rotas" value={hist.length} />
          <StatCard label="Lucro acumulado" value={`R$ ${totalLucro.toFixed(2)}`} accent />
        </Card>
      )}

      {hist.length === 0 ? (
        <div className="text-center mt-20">
          <p className="text-5xl mb-4">📭</p>
          <p className="text-slate-400">Nenhuma rota salva ainda.</p>
          <p className="text-slate-500 text-sm mt-2">Complete uma rota para aparecer aqui.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {hist.map((r, i) => (
            <Card key={i}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-bold text-sm">{r.nome}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{r.data}</p>
                </div>
                <button onClick={() => remover(i)} className="text-slate-600 text-lg p-1">🗑</button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <StatCard label="Paradas" value={r.paradas} />
                <StatCard label="Distância" value={`${(r.km||0).toFixed(1)} km`} />
                <StatCard label="Lucro" value={`R$ ${(r.lucro||0).toFixed(2)}`} accent />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
