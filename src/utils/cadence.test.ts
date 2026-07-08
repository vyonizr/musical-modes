import { describe, it, expect } from 'vitest'
import { classifyCadence } from './cadence'
import generateModes from './generateModes'
import { PROGRESSIONS } from './progressions'

describe('classifyCadence', () => {
  describe('named cadences', () => {
    it('classifies IV → I as plagal', () => {
      const result = classifyCadence(['IV', 'I'])
      expect(result.cadence).toBe('Plagal cadence')
      expect(result.confidence).toBe('high')
    })

    it('classifies V → I as authentic', () => {
      const result = classifyCadence(['V', 'I'])
      expect(result.cadence).toBe('Authentic cadence')
      expect(result.confidence).toBe('high')
    })

    it('classifies ♭VII → IV → I as double plagal (3-chord pattern wins over plagal)', () => {
      const result = classifyCadence(['♭VII', 'IV', 'I'])
      expect(result.cadence).toBe('Double plagal cadence')
    })

    it('classifies ♭VI → ♭VII → I as Aeolian', () => {
      const result = classifyCadence(['♭VI', '♭VII', 'I'])
      expect(result.cadence).toBe('Aeolian cadence')
    })

    it('classifies single V as half cadence', () => {
      const result = classifyCadence(['V'])
      expect(result.cadence).toBe('Half cadence')
    })

    it('classifies I → V as half cadence (ends on V)', () => {
      const result = classifyCadence(['I', 'V'])
      expect(result.cadence).toBe('Half cadence')
    })

    it('skips named cadence for unparseable numerals', () => {
      const result = classifyCadence(['?', 'I'])
      expect(result.cadence).toBe('Other / no clear cadence')
      expect(result.confidence).toBe('low')
    })
  })

  describe('mode independence', () => {
    it('classifies Mixolydian ♭VII → I as no clear cadence (not a named pattern)', () => {
      const result = classifyCadence(['♭VII', 'I'])
      expect(result.cadence).toBe('Other / no clear cadence')
    })
  })

  describe('edge cases', () => {
    it('returns other for single chord with no named cadence', () => {
      const result = classifyCadence(['I'])
      expect(result.cadence).toBe('Other / no clear cadence')
      expect(result.motions).toEqual([])
    })

    it('returns other for empty array', () => {
      const result = classifyCadence([])
      expect(result.cadence).toBe('Other / no clear cadence')
      expect(result.motions).toEqual([])
    })

    it('classifies repeat as repeat motion', () => {
      const result = classifyCadence(['I', 'I'])
      expect(result.motions).toEqual(['repeat'])
    })

    it('classifies I → IV as authentic motion (ascending 4th)', () => {
      const result = classifyCadence(['I', 'IV'])
      expect(result.motions).toEqual(['authentic'])
    })

    it('classifies tritone motion correctly (I → ♯IV = 6 semitones)', () => {
      const result = classifyCadence(['I', '♯IV'])
      expect(result.motions).toContain('tritone')
    })

    it('sets low confidence when a numeral is unparseable', () => {
      const result = classifyCadence(['I', '??', 'V'])
      expect(result.confidence).toBe('low')
    })
  })

  describe('motions array', () => {
    it('returns correct motions for I → IV → V → I', () => {
      const result = classifyCadence(['I', 'IV', 'V', 'I'])
      expect(result.motions).toEqual(['authentic', 'step-up', 'authentic'])
    })

    it('returns motions for double plagal pattern', () => {
      const result = classifyCadence(['♭VII', 'IV', 'I'])
      expect(result.motions).toEqual(['plagal', 'plagal'])
    })
  })
})

describe('existing PROGRESSIONS cadence classification', () => {
  it('double-plagal progression classifies as double plagal cadence', () => {
    const prog = PROGRESSIONS.find(p => p.id === 'double-plagal')!
    const modes = generateModes('C', false)
    const romanNumerals = prog.steps.map(step => {
      const mode = modes.find(m => m.name === step.mode)
      return mode ? mode.romanNumerals[step.degreeIndex] : '?'
    })
    expect(romanNumerals).toEqual(['♭VII', 'IV', 'I', 'I'])
    const result = classifyCadence(romanNumerals)
    expect(result.cadence).toBe('Double plagal cadence')
  })

  it('mario-cadence progression classifies as Aeolian cadence', () => {
    const prog = PROGRESSIONS.find(p => p.id === 'mario-cadence')!
    const modes = generateModes('C', false)
    const romanNumerals = prog.steps.map(step => {
      const mode = modes.find(m => m.name === step.mode)
      return mode ? mode.romanNumerals[step.degreeIndex] : '?'
    })
    expect(romanNumerals).toEqual(['♭VI', '♭VII', 'I', 'I'])
    const result = classifyCadence(romanNumerals)
    expect(result.cadence).toBe('Aeolian cadence')
  })
})
