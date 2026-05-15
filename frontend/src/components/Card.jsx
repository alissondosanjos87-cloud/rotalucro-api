import React from 'react'

export default function Card({ children, className = '', onClick, accent }) {
  const accents = {
    green: 'border-[#00C853]',
    blue: 'border-[#0057FF]',
    default: 'border-white/10',
  }
  const border = accents[accent] || accents.default
  const interactive = onClick ? 'cursor-pointer active:border-[#00C853] transition-colors' : ''

  return (
    <div onClick={onClick}
      className={`bg-[#111827] border ${border} rounded-2xl p-4 ${interactive} ${className}`}>
      {children}
    </div>
  )
}
