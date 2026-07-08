import { describe, it, expect } from 'vitest'
import { analyzeLoop } from './loop'
import generateModes from './generateModes'
import { PROGRESSIONS } from './progressions'

describe('analyzeLoop', () => {
  describe('single-chord progressions', () => {
    it('plain tonic I is not a loop', () => {
      const result = analyzeLoop(['I'])
      expect(result.isLoop).toBe(false)
      expect(result.character).toBeNull()
    })

    it('non-tonic chord is a drone', () => {
      const result = analyzeLoop(['♭VII'])
      expect(result.isLoop).toBe(true)
      expect(result.character).toBe('drone')
      expect(result.closureMotion).toBe('repeat')
      expect(result.palette).toEqual(['♭VII'])
    })
  })

  describe('two-chord loops vs cadences', () => {
    it('IV → ♭VII is an oscillation (plagal closure)', () => {
      const result = analyzeLoop(['IV', '♭VII'])
      expect(result.isLoop).toBe(true)
      expect(result.character).toBe('oscillation')
    })

    it('IV → I is not a loop (ends on plain tonic, cadence owns it)', () => {
      const result = analyzeLoop(['IV', 'I'])
      expect(result.isLoop).toBe(false)
      expect(result.character).toBeNull()
    })

    it('I → IV is an oscillation (last is IV, not plain tonic)', () => {
      const result = analyzeLoop(['I', 'IV'])
      expect(result.isLoop).toBe(true)
      expect(result.character).toBe('oscillation')
    })
  })

  describe('modal-vamp detection', () => {
    it('aeolian-style loop with flats is a modal vamp', () => {
      const result = analyzeLoop(['IV', '♭VI', '♭VII'])
      expect(result.isLoop).toBe(true)
      expect(result.character).toBe('modal-vamp')
      expect(result.palette).toEqual(['IV', '♭VI', '♭VII'])
    })
  })

  describe('circular detection', () => {
    it('all repeated motion is captured by drone before circular', () => {
      const result = analyzeLoop(['I', 'I', 'I'])
      expect(result.isLoop).toBe(false)
      expect(result.character).toBeNull()
    })
  })

  describe('closure motion', () => {
    it('computes closure motion from last back to first', () => {
      const result = analyzeLoop(['i', '♭VII'])
      const firstSemitone = 0  // i = degree 0, no accidental
      const lastSemitone = 10  // ♭VII = degree 6, ♭: 11-1 = 10
      const closureDiff = ((firstSemitone - lastSemitone) % 12 + 12) % 12  // (0-10) mod 12 = 2 → step-up
      expect(result.closureMotion).toBe('step-up')
    })
  })

  describe('edge cases', () => {
    it('empty input returns isLoop false', () => {
      const result = analyzeLoop([])
      expect(result.isLoop).toBe(false)
      expect(result.closureMotion).toBe('other')
      expect(result.palette).toEqual([])
      expect(result.character).toBeNull()
    })

    it('unparseable numeral returns isLoop false', () => {
      const result = analyzeLoop(['I', '??', 'V'])
      expect(result.isLoop).toBe(false)
      expect(result.character).toBeNull()
    })
  })
})

describe('existing PROGRESSIONS negative fixtures', () => {
  it('double-plagal ends on plain I → isLoop false', () => {
    const prog = PROGRESSIONS.find(p => p.id === 'double-plagal')!
    const modes = generateModes('C', false)
    const romanNumerals = prog.steps.map(step => {
      const mode = modes.find(m => m.name === step.mode)
      return mode ? mode.romanNumerals[step.degreeIndex] : '?'
    })
    const result = analyzeLoop(romanNumerals)
    expect(result.isLoop).toBe(false)
  })

  it('mario-cadence ends on plain I → isLoop false', () => {
    const prog = PROGRESSIONS.find(p => p.id === 'mario-cadence')!
    const modes = generateModes('C', false)
    const romanNumerals = prog.steps.map(step => {
      const mode = modes.find(m => m.name === step.mode)
      return mode ? mode.romanNumerals[step.degreeIndex] : '?'
    })
    const result = analyzeLoop(romanNumerals)
    expect(result.isLoop).toBe(false)
  })
})
