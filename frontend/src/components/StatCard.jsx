import React from 'react'

export default function StatCard({ label, value, accent }) {
  return (
    <div className="text-center">
      <p className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">{label}</p>
      <p className={`text-lg font-extrabold mt-0.5 ${accent ? 'text-[#00C853]' : 'text-white'}`}>
        {value}
      </p>
    </div>
  )
}
