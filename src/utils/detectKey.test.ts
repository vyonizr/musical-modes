import { describe, it, expect } from 'vitest'
import { isValidChordToken, detectKey } from './detectKey'

describe('isValidChordToken', () => {
  it('accepts all 7 natural roots', () => {
    const roots = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
    for (const r of roots) {
      expect(isValidChordToken(r)).toBe(true)
    }
  })

  it('accepts sharp roots', () => {
    expect(isValidChordToken('C\u266F')).toBe(true)
    expect(isValidChordToken('C#')).toBe(true)
    expect(isValidChordToken('D\u266F')).toBe(true)
    expect(isValidChordToken('F\u266F')).toBe(true)
    expect(isValidChordToken('G\u266F')).toBe(true)
    expect(isValidChordToken('A\u266F')).toBe(true)
  })

  it('accepts flat roots', () => {
    expect(isValidChordToken('D\u266D')).toBe(true)
    expect(isValidChordToken('Db')).toBe(true)
    expect(isValidChordToken('E\u266D')).toBe(true)
    expect(isValidChordToken('G\u266D')).toBe(true)
    expect(isValidChordToken('A\u266D')).toBe(true)
    expect(isValidChordToken('B\u266D')).toBe(true)
  })

  it('accepts minor chords', () => {
    expect(isValidChordToken('Am')).toBe(true)
    expect(isValidChordToken('C#m')).toBe(true)
    expect(isValidChordToken('D\u266Dm')).toBe(true)
  })

  it('accepts diminished chords', () => {
    expect(isValidChordToken('Bdim')).toBe(true)
    expect(isValidChordToken('C\u266Fdim')).toBe(true)
  })

  it('rejects stray letters outside A-G', () => {
    expect(isValidChordToken('Z')).toBe(false)
    expect(isValidChordToken('K')).toBe(false)
    expect(isValidChordToken('L')).toBe(false)
    expect(isValidChordToken('H')).toBe(false)
  })

  it('rejects garbage strings', () => {
    expect(isValidChordToken('Xyz')).toBe(false)
    expect(isValidChordToken('123')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isValidChordToken('')).toBe(false)
  })
})

describe('detectKey with invalid tokens', () => {
  it('places Z in invalidChords and excludes from matches', () => {
    const results = detectKey(['C G Z Am'])
    expect(results.length).toBeGreaterThan(0)

    const top = results[0]
    const section = top.sections[0]

    expect(section.invalidChords).toContain('Z')
    expect(section.invalidChords.length).toBe(1)

    const matchChords = section.matches.map((m) => m.chord)
    expect(matchChords).not.toContain('Z')
    expect(matchChords.length).toBe(3)
  })

  it('does not lower score for invalid tokens vs clean input', () => {
    const withJunk = detectKey(['C G Z Am'])
    const withoutJunk = detectKey(['C G Am'])

    const topWith = withJunk[0]
    const topWithout = withoutJunk[0]

    expect(topWith.totalScore).toBe(topWithout.totalScore)
    expect(topWith.sections[0].score).toBe(topWithout.sections[0].score)
  })

  it('handles all-invalid section gracefully', () => {
    const results = detectKey(['Z K'])
    expect(results.length).toBeGreaterThan(0)

    const section = results[0].sections[0]
    expect(section.invalidChords).toEqual(['Z', 'K'])
    expect(section.matches).toHaveLength(0)
    expect(section.distinctChords).toHaveLength(0)
  })
})

describe('detectKey scale-degree weighting', () => {
  it('weights tonic/IV higher than ii/vii° even though both are fully diatonic', () => {
    const strongTier = detectKey(['C F'])
    const weakTier = detectKey(['Dm Bdim'])

    const strongCandidate = strongTier.find(
      (r) => r.root === 'C' && r.mode === 'ionian'
    )!
    const weakCandidate = weakTier.find(
      (r) => r.root === 'C' && r.mode === 'ionian'
    )!

    expect(strongCandidate.totalScore).toBeGreaterThan(weakCandidate.totalScore)
  })
})

describe('detectKey harmonic-minor cadence chords', () => {
  it('treats the harmonic-minor V (raised leading tone) as native, not borrowed', () => {
    const results = detectKey(['Am F E Am'])
    const aMinor = results.find((r) => r.root === 'A' && r.mode === 'aeolian')!
    const eMatch = aMinor.sections[0].matches.find((m) => m.chord === 'E')!

    expect(eMatch.native).toBe(true)
    expect(eMatch.borrowed).toBe(false)
  })
})

describe('detectKey chord-occurrence weighting', () => {
  it('weights a repeated tonic more than a single occurrence', () => {
    const repeated = detectKey(['C C C C G'])
    const single = detectKey(['C G'])

    const repeatedCandidate = repeated.find(
      (r) => r.root === 'C' && r.mode === 'ionian'
    )!
    const singleCandidate = single.find(
      (r) => r.root === 'C' && r.mode === 'ionian'
    )!

    expect(repeatedCandidate.sections[0].score).toBeGreaterThan(
      singleCandidate.sections[0].score
    )
  })
})

describe('detectKey first-chord and resolution bonuses', () => {
  it('rewards a section that opens on the tonic', () => {
    const opensOnTonic = detectKey(['C G Dm'])
    const doesNotOpen = detectKey(['Dm C G'])

    const opensCandidate = opensOnTonic.find(
      (r) => r.root === 'C' && r.mode === 'ionian'
    )!
    const doesNotCandidate = doesNotOpen.find(
      (r) => r.root === 'C' && r.mode === 'ionian'
    )!

    expect(opensCandidate.sections[0].score).toBeGreaterThan(
      doesNotCandidate.sections[0].score
    )
  })

  it('rewards a IV→I or V→I resolution occurring anywhere in a section, not only at the end', () => {
    const withResolution = detectKey(['Dm F C Dm'])
    const withoutResolution = detectKey(['Dm C F Dm'])

    const withCandidate = withResolution.find(
      (r) => r.root === 'C' && r.mode === 'ionian'
    )!
    const withoutCandidate = withoutResolution.find(
      (r) => r.root === 'C' && r.mode === 'ionian'
    )!

    expect(withCandidate.sections[0].score).toBeGreaterThan(
      withoutCandidate.sections[0].score
    )
  })
})
