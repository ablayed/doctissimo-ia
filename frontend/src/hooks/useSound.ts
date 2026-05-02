import { useEffect, useState } from 'react'

const STORAGE_KEY = 'doctissimo-muted'

function ensureAudioContext() {
  if (typeof window === 'undefined') return null
  const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  return AudioContextCtor ? new AudioContextCtor() : null
}

export function useSoundPrefs() {
  const [muted, setMuted] = useState<boolean>(() => localStorage.getItem(STORAGE_KEY) !== 'false')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, muted ? 'true' : 'false')
  }, [muted])

  const playDing = () => {
    if (muted) return
    const context = ensureAudioContext()
    if (!context) return
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = 'triangle'
    oscillator.frequency.value = 880
    gain.gain.value = 0.04
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start()
    oscillator.stop(context.currentTime + 0.12)
  }

  const playModem = () => {
    if (muted) return
    const context = ensureAudioContext()
    if (!context) return
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = 'sawtooth'
    oscillator.frequency.setValueAtTime(420, context.currentTime)
    oscillator.frequency.linearRampToValueAtTime(620, context.currentTime + 0.3)
    oscillator.frequency.linearRampToValueAtTime(300, context.currentTime + 0.6)
    gain.gain.setValueAtTime(0.015, context.currentTime)
    gain.gain.linearRampToValueAtTime(0.03, context.currentTime + 0.3)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start()
    oscillator.stop(context.currentTime + 0.7)
  }

  return { muted, setMuted, playDing, playModem }
}
