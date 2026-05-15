import React from 'react'

export default function Input({
  label, type = 'text', placeholder, value, onChange, error, className = ''
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-xs text-slate-400 uppercase font-semibold tracking-wider">
          {label}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`h-14 bg-[#1f2937] border rounded-2xl px-4 text-white text-base focus:outline-none transition-colors
          ${error ? 'border-red-500' : 'border-white/10 focus:border-[#00C853]'}`}
      />
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  )
}
