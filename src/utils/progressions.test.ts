import { describe, it, expect } from 'vitest'
import generateModes from './generateModes'
import { PROGRESSIONS, Progression } from './progressions'

function resolveProgression(progression: Progression, key: string, preferSharp: boolean): string[] {
  const modes = generateModes(key, preferSharp)
  return progression.steps.map((step) => {
    const mode = modes.find((m) => m.name === step.mode)
    if (!mode) return `?(${step.mode})`
    return mode.chords[step.degreeIndex]
  })
}

describe('progression chord resolution', () => {
  it('resolves 50s progression in C', () => {
    const prog = PROGRESSIONS.find((p) => p.id === '50s')!
    const chords = resolveProgression(prog, 'C', false)
    expect(chords).toEqual(['C', 'Am', 'F', 'G'])
  })

  it('resolves 50s progression in G', () => {
    const prog = PROGRESSIONS.find((p) => p.id === '50s')!
    const chords = resolveProgression(prog, 'G', false)
    expect(chords).toEqual(['G', 'Em', 'C', 'D'])
  })

  it('resolves pop-punk progression in C', () => {
    const prog = PROGRESSIONS.find((p) => p.id === 'pop-punk')!
    const chords = resolveProgression(prog, 'C', false)
    expect(chords).toEqual(['C', 'G', 'Am', 'F'])
  })

  it('resolves Andalusian cadence in C (aeolian = A minor)', () => {
    const prog = PROGRESSIONS.find((p) => p.id === 'andalusian')!
    const chords = resolveProgression(prog, 'A', false)
    expect(chords).toEqual(['Am', 'G', 'F', 'Em'])
  })

  it('resolves 12-bar blues chords in C', () => {
    const prog = PROGRESSIONS.find((p) => p.id === '12-bar-blues')!
    const chords = resolveProgression(prog, 'C', false)
    expect(chords).toEqual(['C', 'F', 'C', 'G', 'F', 'C'])
  })

  it('resolves minor descent in A aeolian', () => {
    const prog = PROGRESSIONS.find((p) => p.id === 'minor-descent')!
    const chords = resolveProgression(prog, 'A', false)
    expect(chords).toEqual(['Am', 'F', 'C', 'G'])
  })

  it('resolves modal-mixture progression (Ionian with Mixolydian bVII) in C', () => {
    const prog = PROGRESSIONS.find((p) => p.id === 'modal-mixture')!
    const chords = resolveProgression(prog, 'C', false)
    expect(chords).toEqual(['C', 'G', 'B♭', 'F'])
  })

  it('resolves doo-wop progression in C', () => {
    const prog = PROGRESSIONS.find((p) => p.id === 'doo-wop')!
    const chords = resolveProgression(prog, 'C', false)
    expect(chords).toEqual(['C', 'Am', 'Dm', 'G'])
  })

  it('resolves dorian vamp in D', () => {
    const prog = PROGRESSIONS.find((p) => p.id === 'dorian-vamp')!
    const chords = resolveProgression(prog, 'D', false)
    expect(chords).toEqual(['Dm', 'G'])
  })

  it('resolves phrygian borrow progression in Am', () => {
    const prog = PROGRESSIONS.find((p) => p.id === 'phrygian-borrow')!
    const chords = resolveProgression(prog, 'A', false)
    expect(chords).toEqual(['Am', 'B♭', 'G', 'Am'])
  })
})
