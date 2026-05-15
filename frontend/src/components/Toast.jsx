import React, { useEffect, useState } from 'react'

export default function Toast({ message, onClose }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!message) return
    setVisible(true)
    const t = setTimeout(() => { setVisible(false); setTimeout(onClose, 300) }, 2500)
    return () => clearTimeout(t)
  }, [message])

  if (!message) return null

  return (
    <div className={`fixed bottom-28 left-1/2 -translate-x-1/2 z-50 transition-all duration-300
      ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
      <div className="bg-black/90 backdrop-blur text-white px-5 py-3 rounded-2xl text-sm font-semibold shadow-xl whitespace-nowrap">
        {message}
      </div>
    </div>
  )
}
