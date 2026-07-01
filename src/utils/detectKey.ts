import generateModes from './generateModes'
import { KEYS, NOTE_TO_SEMITONE } from './constants'

export interface ChordMatch {
  chord: string
  native: boolean
  borrowed: boolean
  borrowedFrom?: string
  nonDiatonic: boolean
}

export interface SectionAnalysis {
  sectionIndex: number
  chords: string[]
  distinctChords: string[]
  invalidChords: string[]
  matches: ChordMatch[]
  score: number
  cadentialMatch: boolean
}

export interface DetectionResult {
  root: string
  mode: string
  displayName: string
  totalScore: number
  hasBorrowed: boolean
  sections: SectionAnalysis[]
}

function normalizeAccidental(s: string): string {
  return s
    .replace(/([A-G])b/gi, (_m, letter) => letter + '\u266D')
    .replace(/([A-G])#/gi, (_m, letter) => letter + '\u266F')
}

function chordSemitoneQuality(
  chordName: string
): { semitone: number; quality: string } | null {
  const normalized = normalizeAccidental(chordName.trim())
  if (!normalized) return null

  let quality = 'major'
  let root = normalized
  if (root.endsWith('dim')) {
    quality = 'diminished'
    root = root.slice(0, -3)
  } else if (root.endsWith('m')) {
    quality = 'minor'
    root = root.slice(0, -1)
  }

  const semitone = NOTE_TO_SEMITONE[root]
  if (semitone === undefined) return null
  return { semitone, quality }
}

function chordsEquivalent(a: string, b: string): boolean {
  const ca = chordSemitoneQuality(a)
  const cb = chordSemitoneQuality(b)
  if (!ca || !cb) return false
  return ca.semitone === cb.semitone && ca.quality === cb.quality
}

function chordInSet(chord: string, set: string[]): boolean {
  return set.some((c) => chordsEquivalent(c, chord))
}

export function isValidChordToken(token: string): boolean {
  return chordSemitoneQuality(token) !== null
}

export function parseSection(raw: string): string[] {
  return raw
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function getDistinct(chords: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const c of chords) {
    const canon = chordSemitoneQuality(c)
    const key = canon ? `${canon.semitone}:${canon.quality}` : c
    if (!seen.has(key)) {
      seen.add(key)
      result.push(c)
    }
  }
  return result
}

function generateAllChordSets(root: string, mode: string): { native: string[]; parallel: string[] } {
  const modesFlat = generateModes(root, false)
  const modesSharp = generateModes(root, true)

  const candidateFlat = modesFlat.find((m) => m.name === mode)!
  const candidateSharp = modesSharp.find((m) => m.name === mode)!

  const parallelMode = mode === 'ionian' ? 'aeolian' : 'ionian'
  const paraFlat = modesFlat.find((m) => m.name === parallelMode)!
  const paraSharp = modesSharp.find((m) => m.name === parallelMode)!

  function unionSets(a: string[], b: string[]): string[] {
    const result = [...a]
    for (const chord of b) {
      if (!result.some((c) => chordsEquivalent(c, chord))) {
        result.push(chord)
      }
    }
    return result
  }

  return {
    native: unionSets(candidateFlat.chords, candidateSharp.chords),
    parallel: unionSets(paraFlat.chords, paraSharp.chords),
  }
}

export function detectKey(
  sections: string[],
  preferSharp: boolean = false
): DetectionResult[] {
  const parsedSections = sections
    .map((s) => parseSection(s))
    .filter((arr) => arr.length > 0)

  if (parsedSections.length === 0) return []

  const results: DetectionResult[] = []

  for (const root of KEYS) {
    for (const mode of ['ionian', 'aeolian'] as const) {
      const { native: nativeChords, parallel: parallelChords } = generateAllChordSets(root, mode)

      const tonicChord = generateModes(root, false).find((m) => m.name === mode)!.chords[0]

      const sectionAnalyses: SectionAnalysis[] = []
      let totalScore = 0

      for (let si = 0; si < parsedSections.length; si++) {
        const chords = parsedSections[si]
        const validChords: string[] = []
        const invalidChords: string[] = []

        for (const chord of chords) {
          if (isValidChordToken(chord)) {
            validChords.push(chord)
          } else {
            invalidChords.push(chord)
          }
        }

        const distinctChords = getDistinct(validChords)
        const matches: ChordMatch[] = []
        let sectionScore = 0

        for (const chord of distinctChords) {
          const isNative = chordInSet(chord, nativeChords)
          const isBorrowed = !isNative && chordInSet(chord, parallelChords)
          const isNonDiatonic = !isNative && !isBorrowed

          matches.push({
            chord,
            native: isNative,
            borrowed: isBorrowed,
            borrowedFrom: isBorrowed ? (mode === 'ionian' ? 'aeolian' : 'ionian') : undefined,
            nonDiatonic: isNonDiatonic,
          })

          if (isNative) sectionScore += 1
          else if (isBorrowed) sectionScore += 0.5
        }

        if (distinctChords.length > 0) {
          sectionScore /= distinctChords.length
        }

        const lastChord = chords[chords.length - 1]
        const cadentialMatch = chordsEquivalent(lastChord, tonicChord)
        if (cadentialMatch) {
          sectionScore += 1
        }

        totalScore += sectionScore

        sectionAnalyses.push({
          sectionIndex: si,
          chords,
          distinctChords,
          invalidChords,
          matches,
          score: sectionScore,
          cadentialMatch,
        })
      }

      const hasBorrowed = sectionAnalyses.some((s) =>
        s.matches.some((m) => m.borrowed)
      )
      const parallelMode = mode === 'ionian' ? 'minor' : 'major'
      const displayName =
        root +
        ' ' +
        (mode === 'ionian' ? 'major' : 'minor') +
        (hasBorrowed ? ` (borrows from ${root} ${parallelMode})` : '')

      results.push({
        root,
        mode,
        displayName,
        totalScore,
        hasBorrowed,
        sections: sectionAnalyses,
      })
    }
  }

  results.sort((a, b) => b.totalScore - a.totalScore)

  return results
}
