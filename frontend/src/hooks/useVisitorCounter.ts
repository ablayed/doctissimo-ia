import { useEffect, useState } from 'react'

export function useVisitorCounter() {
  const [counter, setCounter] = useState(347847 + Math.floor(Math.random() * 50))
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCounter((value) => value + 1 + Math.floor(Math.random() * 3))
      setElapsed((value) => value + 4)
    }, 4000)
    return () => window.clearInterval(timer)
  }, [])

  return { counter, elapsed }
}
