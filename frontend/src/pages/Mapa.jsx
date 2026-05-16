import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import L from 'leaflet'
import Toast from '../components/Toast'
import { useToast } from '../hooks/useToast'
import { useRota } from '../hooks/useRota'
import { api } from '../services/api'

const VELOCIDADES = [40,42,44,45,44,40,25,22,20,22,32,35,28,30,36,38,35,18,15,20,28,32,35,38]

function getTransito(h) {
  const v = VELOCIDADES[h] || 35
  if (v <= 18) return '🔴 Trânsito pesado'
  if (v <= 28) return '🟡 Trânsito moderado'
  return '🟢 Trânsito leve'
}

function getCor(tipo) {
  if (tipo === 'condominio') return '#FFD700'
  if (tipo === 'apto') return '#FF9800'
  return '#0057FF'
}

function mkIcon(num, tipo, feita) {
  const cor = feita ? '#374151' : getCor(tipo)
  const txt = feita ? '✓' : num
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:36px;height:44px;display:flex;align-items:center;justify-content:center">
      <div style="position:absolute;width:36px;height:36px;background:${cor};border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>
      <span style="position:relative;z-index:1;font-weight:800;color:#fff;font-size:13px">${txt}</span>
    </div>`,
    iconSize: [36, 44], iconAnchor: [18, 40]
  })
}

export default function Mapa() {
  const mapRef = useRef(null)
  const mapObj = useRef(null)
  const markers = useRef([])
  const polyRef = useRef(null)
  const navigate = useNavigate()

  const { rota, paradas } = useRota()
  const { message, show } = useToast()

  const [feitas, setFeitas] = useState(new Set())
  const [emRota, setEmRota] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [modal, setModal] = useState(null)
  const [transito, setTransito] = useState(getTransito(new Date().getHours()))
  const [termino, setTermino] = useState('--:--')

  // Inicializa mapa
  useEffect(() => {
    if (mapObj.current) return
    mapObj.current = L.map(mapRef.current, { zoomControl: false }).setView([-23.55, -46.63], 13)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(mapObj.current)

    const iv = setInterval(() => setTransito(getTransito(new Date().getHours())), 60000)
    return () => clearInterval(iv)
  }, [])

  // Renderiza marcadores quando rota muda
  useEffect(() => {
    if (!mapObj.current || !rota) return

    markers.current.forEach(m => mapObj.current.removeLayer(m))
    markers.current = []
    if (polyRef.current) { mapObj.current.removeLayer(polyRef.current); polyRef.current = null }

    const pts = []
    paradas.forEach((p, i) => {
      pts.push([p.lat, p.lng])
      const m = L.marker([p.lat, p.lng], { icon: mkIcon(i + 1, p.tipo, feitas.has(i)) }).addTo(mapObj.current)
      m.on('click', () => abrirModal(i))
      markers.current.push(m)
    })

    if (pts.length > 1) {
      polyRef.current = L.polyline(pts, { color: '#0057FF', weight: 4, opacity: .7 }).addTo(mapObj.current)
    }
    if (pts.length) mapObj.current.fitBounds(L.latLngBounds(pts).pad(.15))

    const min = rota.totalMin || 60
    const fim = new Date(Date.now() + min * 60000)
    setTermino(fim.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
  }, [rota, feitas])

  function abrirModal(i) {
    const p = paradas[i]
    if (!p) return
    setModal({ ...p, idx: i })
    mapObj.current.flyTo([p.lat, p.lng], 17, { duration: 1 })
    setMenuOpen(false)
  }

  function concluir() {
    if (!modal) return
    const novas = new Set(feitas)
    novas.add(modal.idx)
    setFeitas(novas)
    setModal(null)
    show(`✅ Parada ${modal.idx + 1} concluída!`)
    api.track(modal.idx, modal.nome)

    let prox = modal.idx + 1
    while (prox < paradas.length && novas.has(prox)) prox++
    if (prox < paradas.length) setTimeout(() => abrirModal(prox), 800)
    else if (novas.size === paradas.length) show('🎉 Rota concluída!')
  }

  function gps() {
    navigator.geolocation?.getCurrentPosition(p => {
      mapObj.current.setView([p.coords.latitude, p.coords.longitude], 17)
      L.circleMarker([p.coords.latitude, p.coords.longitude], {
        radius: 10, color: '#fff', fillColor: '#0057FF', fillOpacity: 1, weight: 3
      }).addTo(mapObj.current)
      show('📍 GPS ativado')
    })
    setMenuOpen(false)
  }

  const pct = paradas.length > 0 ? Math.round(feitas.size / paradas.length * 100) : 0

  const menuItems = [
    { icon: '📍', label: 'GPS', fn: gps },
    { icon: '🗺️', label: 'VER TUDO', fn: () => { if (markers.current.length) mapObj.current.fitBounds(L.featureGroup(markers.current).getBounds().pad(.1)); setMenuOpen(false) } },
    { icon: '📋', label: 'HISTÓRICO', fn: () => navigate('/historico') },
    { icon: '🏠', label: 'INÍCIO', fn: () => navigate('/') },
  ]

  return (
    <div className="h-dvh w-full relative overflow-hidden">
      <div ref={mapRef} className="absolute inset-0 z-0" />

      {/* TOPBAR */}
      <div className="absolute top-3 left-3 right-3 z-10 flex justify-between items-start gap-2">
        <div className="flex items-center gap-2">
          <span className="bg-black/85 backdrop-blur px-3 py-2 rounded-xl text-sm font-extrabold border border-white/10">
            Rota<span className="text-[#00C853]">Lucro</span>
          </span>
        </div>
        <div className="bg-black/88 backdrop-blur rounded-xl px-3 py-2 text-right border-2 border-[#0057FF] min-w-[130px]">
          <p className="text-[9px] text-slate-400 uppercase">⏱ Término est.</p>
          <p className="text-lg font-extrabold text-[#0057FF] leading-tight">{termino}</p>
          <p className="text-[10px] text-slate-400">{paradas.length} paradas • {(rota?.totalKm||0).toFixed(1)} km</p>
          <p className="text-[11px] font-bold mt-1">{transito}</p>
        </div>
      </div>

      {/* MENU */}
      <div className="absolute top-[72px] left-3 z-10">
        <button onClick={() => setMenuOpen(o => !o)}
          className="w-14 h-14 bg-red-600 rounded-xl flex flex-col items-center justify-center text-white font-extrabold text-[10px] gap-1 shadow-lg">
          <span className="text-lg">☰</span>MENU
        </button>
        {menuOpen && (
          <div className="absolute top-0 left-[60px] flex flex-col gap-1 z-20">
            {menuItems.map(b => (
              <button key={b.label} onClick={b.fn}
                className="px-4 py-2.5 bg-black/92 backdrop-blur rounded-xl text-white font-bold text-sm text-left whitespace-nowrap shadow-lg border border-white/5 active:bg-[#00C853] active:text-black">
                {b.icon} {b.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* BOTTOM SHEET */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-[#111827] rounded-t-3xl border-t-[3px] border-[#0057FF] px-4 pt-3 pb-5">
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label: 'PARADAS', val: paradas.length },
            { label: 'DISTÂNCIA', val: `${(rota?.totalKm||0).toFixed(1)} km` },
            { label: 'LUCRO', val: `R$${(rota?.lucroEstimado||0).toFixed(0)}`, green: true },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-[9px] text-slate-400 uppercase tracking-wider">{s.label}</p>
              <p className={`text-lg font-extrabold mt-0.5 ${s.green ? 'text-[#00C853]' : ''}`}>{s.val}</p>
            </div>
          ))}
        </div>

        {(emRota || feitas.size > 0) && (
          <>
            <p className="text-[11px] text-slate-400 text-center mb-1">{feitas.size} de {paradas.length} concluídas ({pct}%)</p>
            <div className="h-1.5 bg-white/8 rounded-full mb-3 overflow-hidden">
              <div className="h-full bg-[#00C853] rounded-full transition-all duration-500" style={{ width: pct + '%' }} />
            </div>
          </>
        )}

        <button onClick={() => setEmRota(r => !r)}
          className={`w-full h-12 font-extrabold text-sm rounded-xl mb-2 ${emRota ? 'bg-[#0057FF] text-white' : 'bg-[#00C853] text-black'}`}>
          {emRota ? '⏹ ENCERRAR ROTA' : '▶ INICIAR ROTA'}
        </button>

        <div className="overflow-y-auto max-h-[28vh]">
          {paradas.map((p, i) => (
            <button key={i} onClick={() => abrirModal(i)}
              className={`w-full flex items-center gap-3 py-2.5 border-b border-white/5 text-left ${feitas.has(i) ? 'opacity-40' : ''}`}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-xs text-white flex-shrink-0"
                style={{ background: feitas.has(i) ? '#374151' : getCor(p.tipo) }}>
                {feitas.has(i) ? '✓' : i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{p.nome}</p>
                <p className="text-[10px] text-slate-400">{p.bairro} {p.tipo ? '• ' + p.tipo.toUpperCase() : ''}</p>
              </div>
              <span>{feitas.has(i) ? '✅' : '◯'}</span>
            </button>
          ))}
        </div>
      </div>

      {/* MODAL PARADA */}
      {modal && (
        <div className="absolute inset-0 z-30 flex items-end" onClick={() => setModal(null)}>
          <div className="w-full bg-[#111827] rounded-t-3xl border-t-[3px] border-[#00C853] px-4 pt-4 pb-6"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-14 h-14 rounded-full bg-[#0057FF] flex items-center justify-center font-extrabold text-xl text-white">
                {modal.idx + 1}
              </div>
              <div className="text-right">
                <p className="text-[#0057FF] font-extrabold text-xl">-- min</p>
                <p className="text-[10px] text-slate-400">até aqui</p>
              </div>
            </div>
            <h2 className="text-lg font-extrabold mb-1">{modal.nome}</h2>
            <p className="text-xs text-slate-400 mb-3">{modal.bairro}</p>
            <div className="bg-white/5 rounded-xl px-3 py-2.5 text-sm mb-4">
              📦 {modal.subparadas || 1} pacote |{' '}
              {modal.tipo === 'condominio' ? '🏘️' : modal.tipo === 'apto' ? '🏢' : '🏠'}{' '}
              {(modal.tipo || 'casa').toUpperCase()} (3min)
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <button onClick={() => window.open(`https://waze.com/ul?ll=${modal.lat},${modal.lng}&navigate=yes`, '_blank')}
                className="h-12 bg-white text-black font-extrabold rounded-xl text-sm">
                🗺️ WAZE
              </button>
              <button onClick={concluir}
                className="h-12 bg-[#00C853] text-black font-extrabold rounded-xl text-sm">
                ✓ CONCLUIR
              </button>
            </div>
            <button onClick={() => setModal(null)}
              className="w-full h-10 bg-white/5 rounded-xl text-slate-400 text-sm">
              Fechar
            </button>
          </div>
        </div>
      )}

      <Toast message={message} onClose={() => {}} />
    </div>
  )
}
