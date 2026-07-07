import generateModes from './generateModes'
import { KEYS, NOTE_TO_SEMITONE } from './constants'
import { Mode } from './types'

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
  borrowedModes: string[]
  sections: SectionAnalysis[]
}

const WEIGHTS = [3, 1, 1, 2.5, 2, 1.5, 0.5]
const BORROWED_WEIGHT = 0.5

const MODE_CANDIDATES = ['ionian', 'aeolian', 'dorian', 'mixolydian'] as const
type ModeCandidate = (typeof MODE_CANDIDATES)[number]

const BORROW_SOURCES: Record<ModeCandidate, string[]> = {
  ionian: ['aeolian', 'lydian'],
  aeolian: ['ionian'],
  dorian: ['aeolian'],
  mixolydian: ['ionian'],
}

const MODE_LABELS: Record<string, string> = {
  ionian: 'major',
  aeolian: 'minor',
  dorian: 'dorian',
  mixolydian: 'mixolydian',
  lydian: 'lydian',
}

const MODE_WEIGHT_OVERRIDES: Partial<Record<ModeCandidate, Record<number, number>>> = {
  mixolydian: { 6: 1.5 },
}

const MINOR_QUALITY_MODES = new Set<ModeCandidate>(['aeolian', 'dorian'])

interface ChordWeight {
  weight: number
  borrowed: boolean
  borrowedFrom?: string
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

function canonicalKey(chord: string): string | null {
  const parsed = chordSemitoneQuality(chord)
  return parsed ? `${parsed.semitone}:${parsed.quality}` : null
}

function chordsEquivalent(a: string, b: string): boolean {
  const ca = chordSemitoneQuality(a)
  const cb = chordSemitoneQuality(b)
  if (!ca || !cb) return false
  return ca.semitone === cb.semitone && ca.quality === cb.quality
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
    const key = canonicalKey(c) ?? c
    if (!seen.has(key)) {
      seen.add(key)
      result.push(c)
    }
  }
  return result
}

function buildWeightMap(
  mode: ModeCandidate,
  allModesFlat: Mode[]
): Map<string, ChordWeight> {
  const weightMap = new Map<string, ChordWeight>()
  const overrides = MODE_WEIGHT_OVERRIDES[mode]

  const candidate = allModesFlat.find((m) => m.name === mode)!
  for (let i = 0; i < candidate.chords.length; i++) {
    const key = canonicalKey(candidate.chords[i])
    if (key) {
      weightMap.set(key, { weight: overrides?.[i] ?? WEIGHTS[i], borrowed: false })
    }
  }

  for (const borrowSource of BORROW_SOURCES[mode]) {
    const parallel = allModesFlat.find((m) => m.name === borrowSource)!
    for (let i = 0; i < parallel.chords.length; i++) {
      const key = canonicalKey(parallel.chords[i])
      if (key && !weightMap.has(key)) {
        weightMap.set(key, { weight: BORROWED_WEIGHT, borrowed: true, borrowedFrom: borrowSource })
      }
    }
  }

  if (MINOR_QUALITY_MODES.has(mode)) {
    const ionian = allModesFlat.find((m) => m.name === 'ionian')!
    for (const i of [4, 6]) {
      const key = canonicalKey(ionian.chords[i])
      if (key) weightMap.set(key, { weight: WEIGHTS[i], borrowed: false })
    }
  }

  return weightMap
}

interface ScoredSection {
  score: number
  matches: ChordMatch[]
  distinctChords: string[]
  invalidChords: string[]
  cadentialMatch: boolean
}

function scoreSection(
  chords: string[],
  weightMap: Map<string, ChordWeight>,
  tonicChord: string,
  dominantChord: string,
  ivChord: string
): ScoredSection {
  const validChords: string[] = []
  const invalidChords: string[] = []
  for (const chord of chords) {
    if (isValidChordToken(chord)) validChords.push(chord)
    else invalidChords.push(chord)
  }

  const distinctChords = getDistinct(validChords)

  const counts = new Map<string, number>()
  for (const chord of validChords) {
    const key = canonicalKey(chord)
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  const matches: ChordMatch[] = []
  let weightedSum = 0
  let prominenceSum = 0

  for (const chord of distinctChords) {
    const key = canonicalKey(chord)!
    const entry = weightMap.get(key)
    const weight = entry?.weight ?? 0
    const isBorrowed = entry?.borrowed ?? false
    const isNative = weight > 0 && !isBorrowed

    matches.push({
      chord,
      native: isNative,
      borrowed: isBorrowed,
      borrowedFrom: isBorrowed ? entry?.borrowedFrom : undefined,
      nonDiatonic: !entry,
    })

    const prominence = Math.sqrt(counts.get(key) ?? 1)
    weightedSum += weight * prominence
    prominenceSum += prominence
  }

  let score = prominenceSum > 0 ? weightedSum / prominenceSum : 0

  if (validChords.length > 0) {
    if (chordsEquivalent(validChords[0], tonicChord)) score += 0.5
    if (chordsEquivalent(validChords[validChords.length - 1], tonicChord)) score += 1
  }

  let hasResolution = false
  for (let j = 0; j < validChords.length - 1; j++) {
    const resolvesToTonic = chordsEquivalent(validChords[j + 1], tonicChord)
    const fromDominant = chordsEquivalent(validChords[j], dominantChord)
    const fromIv = chordsEquivalent(validChords[j], ivChord)
    if (resolvesToTonic && (fromDominant || fromIv)) hasResolution = true
  }
  if (hasResolution) score += 1

  const cadentialMatch =
    validChords.length > 0 &&
    chordsEquivalent(validChords[validChords.length - 1], tonicChord)

  return { score, matches, distinctChords, invalidChords, cadentialMatch }
}

export function detectKey(
  sections: string[],
  preferSharp: boolean = false
): DetectionResult[] {
  const parsedSections = sections
    .map((s) => parseSection(s))
    .filter((arr) => arr.length > 0)

  if (parsedSections.length === 0) return []

  const lastSection = parsedSections[parsedSections.length - 1]
  const finalChord = lastSection[lastSection.length - 1]

  const results: DetectionResult[] = []

  for (const root of KEYS) {
    const allModesFlat = generateModes(root, false)

    for (const mode of MODE_CANDIDATES) {
      const weightMap = buildWeightMap(mode, allModesFlat)
      const candidate = allModesFlat.find((m) => m.name === mode)!
      const tonicChord = candidate.chords[0]
      const ivChord = candidate.chords[3]
      const dominantChord = MINOR_QUALITY_MODES.has(mode)
        ? allModesFlat.find((m) => m.name === 'ionian')!.chords[4]
        : candidate.chords[4]

      const sectionAnalyses: SectionAnalysis[] = []
      let totalScore = 0

      for (let si = 0; si < parsedSections.length; si++) {
        const { score, matches, distinctChords, invalidChords, cadentialMatch } =
          scoreSection(
            parsedSections[si],
            weightMap,
            tonicChord,
            dominantChord,
            ivChord
          )

        totalScore += score
        if (si === parsedSections.length - 1 && isValidChordToken(finalChord)) {
          if (chordsEquivalent(finalChord, tonicChord)) totalScore += 2.5
        }
        sectionAnalyses.push({
          sectionIndex: si,
          chords: parsedSections[si],
          distinctChords,
          invalidChords,
          matches,
          score,
          cadentialMatch,
        })
      }

      const hasBorrowed = sectionAnalyses.some((s) =>
        s.matches.some((m) => m.borrowed)
      )
      const borrowedFromModes = new Set<string>()
      for (const s of sectionAnalyses) {
        for (const m of s.matches) {
          if (m.borrowed && m.borrowedFrom) borrowedFromModes.add(m.borrowedFrom)
        }
      }
      const borrowedModes = BORROW_SOURCES[mode].filter((source) =>
        borrowedFromModes.has(source)
      )
      const modeLabel = MODE_LABELS[mode]
      const borrowedLabels = borrowedModes.map((source) => `${root} ${MODE_LABELS[source]}`)
      const displayName =
        `${root} ${modeLabel}` +
        (borrowedLabels.length > 0 ? ` (borrows from ${borrowedLabels.join(', ')})` : '')

      results.push({
        root,
        mode,
        displayName,
        totalScore,
        hasBorrowed,
        borrowedModes,
        sections: sectionAnalyses,
      })
    }
  }

  results.sort((a, b) => b.totalScore - a.totalScore)

  return results
}
