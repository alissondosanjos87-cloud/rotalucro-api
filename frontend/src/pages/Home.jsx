import React, { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'
import Input from '../components/Input'
import StatCard from '../components/StatCard'
import Toast from '../components/Toast'
import { useToast } from '../hooks/useToast'
import { useRota } from '../hooks/useRota'
import { api } from '../services/api'

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [nomeRota, setNomeRota] = useState('Minha Rota')
  const { rota, salvar } = useRota()
  const { message, show } = useToast()
  const fileRef = useRef()
  const navigate = useNavigate()

  async function importar(file) {
    if (!file) return
    setLoading(true)
    try {
      const data = await api.upload(file)
      salvar({ ...data, nomeRota })
      show(`✅ ${data.totalParadas} paradas carregadas!`)
    } catch (e) {
      show('❌ ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  function confirmar() {
    if (!rota) return
    salvar({ ...rota, nomeRota })
    navigate('/mapa')
  }

  return (
    <div className="min-h-dvh bg-[#0a0f1a] px-5 py-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-extrabold">
          Rota<span className="text-[#00C853]">Lucro</span>
        </h1>
        <button onClick={() => { localStorage.removeItem('rl_token'); navigate('/login') }}
          className="text-slate-400 text-sm font-semibold">Sair</button>
      </div>

      <Input label="Nome da rota" value={nomeRota}
        onChange={e => setNomeRota(e.target.value)} className="mb-6" />

      <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider mb-3">
        Adicionar paradas
      </p>

      <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls"
        className="hidden" onChange={e => importar(e.target.files[0])} />

      <Card onClick={() => fileRef.current.click()} className="flex items-center gap-4 mb-3">
        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl flex-shrink-0">📂</div>
        <div className="flex-1">
          <p className="font-bold text-sm">Importar planilha</p>
          <p className="text-slate-400 text-xs mt-0.5">
            {rota ? `${rota.totalParadas} paradas carregadas ✅` : 'CSV ou Excel com as paradas'}
          </p>
        </div>
        {rota && (
          <span className="bg-[#00C853] text-black text-xs font-extrabold px-3 py-1 rounded-full">
            {rota.totalParadas}
          </span>
        )}
      </Card>

      <Card onClick={() => navigate('/historico')} className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl flex-shrink-0">📋</div>
        <div>
          <p className="font-bold text-sm">Histórico</p>
          <p className="text-slate-400 text-xs mt-0.5">Ver rotas anteriores</p>
        </div>
      </Card>

      {rota && (
        <Card accent="green" className="mt-5 grid grid-cols-3 gap-4">
          <StatCard label="Paradas" value={rota.totalParadas} />
          <StatCard label="Distância" value={`${(rota.totalKm||0).toFixed(1)} km`} />
          <StatCard label="Lucro est." value={`R$${(rota.lucroEstimado||0).toFixed(0)}`} accent />
        </Card>
      )}

      <Button fullWidth disabled={!rota} loading={loading} onClick={confirmar} className="mt-6">
        ▶ INICIAR ROTA
      </Button>

      <Toast message={message} onClose={() => {}} />
    </div>
  )
}
