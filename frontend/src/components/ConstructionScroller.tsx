import { useEffect, useState } from 'react'

export default function ConstructionScroller() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const interval = window.setInterval(() => {
      setShow(true)
      window.setTimeout(() => setShow(false), 4000)
    }, 30000)
    return () => window.clearInterval(interval)
  }, [])

  if (!show) return null

  return (
    <div className="construction-scroller">
      ATTENTION ! Cette page est en construction permanente. Les bugs sont des features. Webmaster bientôt absent.
    </div>
  )
}
