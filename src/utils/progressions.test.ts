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
  it('resolves melancholic-uplift progression in C', () => {
    const prog = PROGRESSIONS.find((p) => p.id === 'melancholic-uplift')!
    const chords = resolveProgression(prog, 'C', false)
    expect(chords).toEqual(['E♭', 'F', 'C', 'C'])
  })

  it('resolves melancholic-uplift progression in G', () => {
    const prog = PROGRESSIONS.find((p) => p.id === 'melancholic-uplift')!
    const chords = resolveProgression(prog, 'G', false)
    expect(chords).toEqual(['B♭', 'C', 'G', 'G'])
  })

  it('resolves melancholic-return progression (dorian) in C', () => {
    const prog = PROGRESSIONS.find((p) => p.id === 'melancholic-return')!
    const chords = resolveProgression(prog, 'C', false)
    expect(chords).toEqual(['E♭', 'F', 'Cm', 'Cm'])
  })

  it('resolves mario-cadence progression (aeolian cadence) in C', () => {
    const prog = PROGRESSIONS.find((p) => p.id === 'mario-cadence')!
    const chords = resolveProgression(prog, 'C', false)
    expect(chords).toEqual(['A♭', 'B♭', 'C', 'C'])
  })

  it('resolves double-plagal progression in C', () => {
    const prog = PROGRESSIONS.find((p) => p.id === 'double-plagal')!
    const chords = resolveProgression(prog, 'C', false)
    expect(chords).toEqual(['B♭', 'F', 'C', 'C'])
  })

  it('resolves backdoor-vamp progression in C', () => {
    const prog = PROGRESSIONS.find((p) => p.id === 'backdoor-vamp')!
    const chords = resolveProgression(prog, 'C', false)
    expect(chords).toEqual(['C', 'B♭', 'F', 'C'])
  })

  it('resolves haunting-progression in C', () => {
    const prog = PROGRESSIONS.find((p) => p.id === 'haunting-progression')!
    const chords = resolveProgression(prog, 'C', false)
    expect(chords).toEqual(['A♭', 'Fm', 'C', 'C'])
  })
})
