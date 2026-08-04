const SOUND_ENABLED_KEY = 'asoiaf_sounds_enabled'

function getEnabled() {
  return localStorage.getItem(SOUND_ENABLED_KEY) === '1'
}

function setEnabled(on) {
  localStorage.setItem(SOUND_ENABLED_KEY, on ? '1' : '0')
}

function playTone(freq, duration, type = 'sine', volume = 0.1) {
  if (!getEnabled()) return
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.value = freq
    gain.gain.value = volume
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + duration)
    setTimeout(() => ctx.close(), duration * 1000 + 100)
  } catch {
    // Audio not available
  }
}

function playSequence(notes) {
  if (!getEnabled()) return
  notes.forEach((note, i) => {
    setTimeout(() => playTone(note.freq, note.duration, note.type, note.volume), i * note.delay)
  })
}

export const sounds = {
  raven: () => playSequence([
    { freq: 800, duration: 0.08, type: 'square', volume: 0.05, delay: 0 },
    { freq: 600, duration: 0.12, type: 'square', volume: 0.04, delay: 80 },
    { freq: 400, duration: 0.15, type: 'sine', volume: 0.03, delay: 100 },
  ]),
  success: () => playSequence([
    { freq: 523, duration: 0.1, type: 'sine', volume: 0.06, delay: 0 },
    { freq: 659, duration: 0.1, type: 'sine', volume: 0.06, delay: 100 },
    { freq: 784, duration: 0.15, type: 'sine', volume: 0.06, delay: 100 },
  ]),
  error: () => playSequence([
    { freq: 200, duration: 0.15, type: 'sawtooth', volume: 0.05, delay: 0 },
    { freq: 150, duration: 0.2, type: 'sawtooth', volume: 0.05, delay: 150 },
  ]),
  click: () => playTone(1000, 0.03, 'sine', 0.03),
  war: () => playSequence([
    { freq: 100, duration: 0.2, type: 'sawtooth', volume: 0.08, delay: 0 },
    { freq: 80, duration: 0.3, type: 'sawtooth', volume: 0.06, delay: 200 },
  ]),
  isEnabled: getEnabled,
  toggle: () => {
    const newVal = !getEnabled()
    setEnabled(newVal)
    return newVal
  },
}
