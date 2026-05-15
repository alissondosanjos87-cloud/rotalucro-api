import { useState, useRef } from 'react'

export function useToast() {
  const [message, setMessage] = useState('')
  const timer = useRef(null)

  function show(msg) {
    setMessage(msg)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setMessage(''), 3000)
  }

  return { message, show, clear: () => setMessage('') }
}
