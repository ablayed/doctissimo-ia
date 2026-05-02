import { useEffect, useState } from 'react'

type Props = {
  onSelect: (demoNumber: number) => void
}

export default function DemoToggle({ onSelect }: Props) {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    setEnabled(localStorage.getItem('demo_mode') === '1')
  }, [])

  if (!enabled) return null

  return (
    <div className="demo-toggle">
      <div className="demo-toggle-title">Mode demo</div>
      <div className="demo-toggle-buttons">
        {[1, 2, 3, 4, 5].map((demoNumber) => (
          <button key={demoNumber} className="btn-pink" type="button" onClick={() => onSelect(demoNumber)}>
            Demo {demoNumber}
          </button>
        ))}
      </div>
    </div>
  )
}
