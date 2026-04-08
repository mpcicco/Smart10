import { useCallback } from 'react'

type SfxKind =
  | 'tap'
  | 'correct'
  | 'wrong'
  | 'pass'
  | 'skip'
  | 'reveal'
  | 'voteUp'
  | 'voteDown'
  | 'start'

let audioCtx: AudioContext | null = null

const ensureCtx = () => {
  if (!audioCtx) {
    audioCtx = new window.AudioContext()
  }

  if (audioCtx.state === 'suspended') {
    void audioCtx.resume()
  }

  return audioCtx
}

const beep = (
  ctx: AudioContext,
  frequency: number,
  duration = 0.09,
  type: OscillatorType = 'sine',
  gainValue = 0.05,
  whenOffset = 0,
) => {
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()
  const when = ctx.currentTime + whenOffset

  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, when)

  gain.gain.setValueAtTime(0.0001, when)
  gain.gain.exponentialRampToValueAtTime(gainValue, when + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, when + duration)

  oscillator.connect(gain)
  gain.connect(ctx.destination)

  oscillator.start(when)
  oscillator.stop(when + duration + 0.02)
}

const playPattern = (kind: SfxKind) => {
  const ctx = ensureCtx()
  switch (kind) {
    case 'tap':
      beep(ctx, 560, 0.06, 'triangle', 0.03)
      break
    case 'correct':
      beep(ctx, 640, 0.08, 'triangle', 0.05)
      beep(ctx, 840, 0.1, 'triangle', 0.06, 0.07)
      break
    case 'wrong':
      beep(ctx, 280, 0.1, 'sawtooth', 0.045)
      beep(ctx, 220, 0.12, 'sawtooth', 0.04, 0.06)
      break
    case 'pass':
      beep(ctx, 390, 0.1, 'square', 0.04)
      break
    case 'skip':
      beep(ctx, 420, 0.08, 'square', 0.04)
      beep(ctx, 350, 0.08, 'square', 0.03, 0.05)
      break
    case 'reveal':
      beep(ctx, 500, 0.08, 'sine', 0.045)
      beep(ctx, 620, 0.08, 'sine', 0.045, 0.05)
      break
    case 'voteUp':
      beep(ctx, 620, 0.08, 'triangle', 0.045)
      beep(ctx, 740, 0.08, 'triangle', 0.045, 0.05)
      break
    case 'voteDown':
      beep(ctx, 320, 0.08, 'triangle', 0.04)
      beep(ctx, 260, 0.1, 'triangle', 0.04, 0.05)
      break
    case 'start':
      beep(ctx, 520, 0.08, 'triangle', 0.045)
      beep(ctx, 700, 0.08, 'triangle', 0.05, 0.05)
      beep(ctx, 900, 0.1, 'triangle', 0.055, 0.1)
      break
  }
}

export const useGameSfx = () =>
  useCallback((kind: SfxKind) => {
    try {
      playPattern(kind)
    } catch {
      // Ignore audio errors to avoid blocking gameplay.
    }
  }, [])
