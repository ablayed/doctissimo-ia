import { useEffect, useState } from 'react'

const banners = ['/ads/maigrir.gif', '/ads/llmeetic.gif', '/ads/qi-test.gif', '/ads/madame-gpt.gif']

export default function FakeAds({ variant }: { variant: 'top' | 'skyscraper' }) {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % banners.length), 10000)
    return () => window.clearInterval(timer)
  }, [])
  return (
    <button className={`fake-ad fake-ad-${variant}`} type="button" onClick={() => alert('Erreur 0x80004005 : Une autre fenÃªtre s\'est ouverte.')}>
      <img src={banners[index]} alt="" />
    </button>
  )
}
