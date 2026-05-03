type SoundName = 'aol-mail' | 'xp-startup' | 'error-chime' | 'tada' | 'modem' | 'post-ding'

const audioCache: Partial<Record<SoundName, HTMLAudioElement>> = {}

function isMuted() {
  try {
    return localStorage.getItem('doctissimo-muted') !== 'false'
  } catch {
    return true
  }
}

function getAudioContext() {
  if (typeof window === 'undefined') return null
  const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  return AudioContextCtor ? new AudioContextCtor() : null
}

function tone(context: AudioContext, start: number, frequency: number, duration: number, volume: number, type: OscillatorType = 'square') {
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, start)
  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(volume, start + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  oscillator.connect(gain)
  gain.connect(context.destination)
  oscillator.start(start)
  oscillator.stop(start + duration + 0.02)
}

function playSynthetic(name: SoundName, volume: number) {
  const context = getAudioContext()
  if (!context) return
  const now = context.currentTime + 0.01
  const v = Math.max(0.01, Math.min(volume, 0.5)) * 0.22

  if (name === 'error-chime') {
    tone(context, now, 440, 0.12, v, 'square')
    tone(context, now + 0.14, 330, 0.18, v, 'square')
    return
  }

  if (name === 'tada') {
    ;[523, 784, 659, 1046].forEach((frequency, index) => tone(context, now + index * 0.13, frequency, 0.22, v, 'triangle'))
    return
  }

  if (name === 'xp-startup') {
    ;[392, 523, 659, 784].forEach((frequency, index) => tone(context, now + index * 0.16, frequency, 0.32, v, 'sine'))
    return
  }

  if (name === 'modem') {
    ;[420, 620, 300, 880, 540].forEach((frequency, index) => tone(context, now + index * 0.1, frequency, 0.15, v * 0.65, 'sawtooth'))
    return
  }

  ;[740, 988].forEach((frequency, index) => tone(context, now + index * 0.09, frequency, 0.13, v, 'triangle'))
}

export function playSound(name: SoundName, volume = 0.3) {
  if (isMuted()) return
  try {
    if (!audioCache[name]) {
      const audio = new Audio(`/sounds/${name}.mp3`)
      audio.volume = volume
      audioCache[name] = audio
    }
    const audio = audioCache[name]
    if (!audio) {
      playSynthetic(name, volume)
      return
    }
    audio.currentTime = 0
    audio.play().catch(() => playSynthetic(name, volume))
  } catch {
    playSynthetic(name, volume)
  }
}
