import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Input from '../components/Input'

const DEMO = { email: 'demo@rotalucro.com', senha: 'demo123' }

function validate(email, senha) {
  if (!email || !senha) return 'Preencha email e senha.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Email inválido.'
  if (senha.length < 6) return 'Senha deve ter pelo menos 6 caracteres.'
  return null
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function entrar(e) {
    e.preventDefault()
    setErro('')
    const err = validate(email, senha)
    if (err) return setErro(err)
    setLoading(true)
    try {
      const resp = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      })
      if (resp.ok) {
        const { token } = await resp.json()
        if (token) localStorage.setItem('rl_token', token)
        navigate('/'); return
      }
    } catch (_) {}
    if (email === DEMO.email && senha === DEMO.senha) {
      localStorage.setItem('rl_token', 'demo-token')
      navigate('/'); return
    }
    setErro('Email ou senha incorretos.')
    setLoading(false)
  }

  return (
    <div className="min-h-dvh bg-[#0a0f1a] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 rounded-full bg-[#00C853] flex items-center justify-center mb-4 shadow-[0_0_40px_rgba(0,200,83,0.3)]">
            <span className="text-4xl">🚚</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Rota<span className="text-[#00C853]">Lucro</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Otimizador inteligente de rotas</p>
        </div>
        <form onSubmit={entrar} className="flex flex-col gap-3">
          <Input type="email" placeholder="Seu email" value={email} onChange={e => setEmail(e.target.value)} />
          <Input type="password" placeholder="Sua senha" value={senha} onChange={e => setSenha(e.target.value)} />
          {erro && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
              {erro}
            </div>
          )}
          <Button type="submit" fullWidth loading={loading} className="mt-2">ENTRAR</Button>
        </form>
        <p className="text-center text-slate-600 text-xs mt-8">Feito por entregadores para entregadores</p>
      </div>
    </div>
  )
}
