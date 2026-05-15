import React from 'react'

export default function Button({
  children, onClick, variant = 'primary', disabled = false,
  loading = false, fullWidth = false, size = 'md', className = '', type = 'button'
}) {
  const base = 'font-extrabold rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed'

  const variants = {
    primary: 'bg-[#00C853] text-black',
    secondary: 'bg-[#0057FF] text-white',
    ghost: 'bg-white/5 text-slate-400',
    danger: 'bg-red-600 text-white',
  }

  const sizes = {
    sm: 'h-10 px-4 text-sm',
    md: 'h-14 px-6 text-base',
    lg: 'h-16 px-8 text-lg',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {loading
        ? <div className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
        : children}
    </button>
  )
}
