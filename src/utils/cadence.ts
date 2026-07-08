export type RootMotion =
  | 'authentic' | 'plagal' | 'step-up' | 'step-down' | 'mediant' | 'repeat' | 'tritone' | 'other'

export interface CadenceAnalysis {
  motions: RootMotion[]
  cadence: string
  confidence: 'high' | 'low'
}

const MAJOR_SCALE_SEMITONES = [0, 2, 4, 5, 7, 9, 11]

const ROMAN_TO_DEGREE: Record<string, number> = {
  i: 0, ii: 1, iii: 2, iv: 3, v: 4, vi: 5, vii: 6,
}

const QUALITY_SUFFIXES = ['°', 'maj7', 'sus4', 'sus2', '7', 'dim', 'm']

interface ParsedNumeral {
  degree: number
  accidental: '♭' | '♯' | null
}

interface CadencePattern {
  length: number
  name: string
  pattern: ReadonlyArray<{ degree: number; accidental: '♭' | '♯' | null }>
}

const CADENCE_PATTERNS: CadencePattern[] = [
  {
    length: 3,
    name: 'Double plagal cadence',
    pattern: [
      { degree: 6, accidental: '♭' },
      { degree: 3, accidental: null },
      { degree: 0, accidental: null },
    ],
  },
  {
    length: 3,
    name: 'Aeolian cadence',
    pattern: [
      { degree: 5, accidental: '♭' },
      { degree: 6, accidental: '♭' },
      { degree: 0, accidental: null },
    ],
  },
  {
    length: 2,
    name: 'Plagal cadence',
    pattern: [
      { degree: 3, accidental: null },
      { degree: 0, accidental: null },
    ],
  },
  {
    length: 2,
    name: 'Authentic cadence',
    pattern: [
      { degree: 4, accidental: null },
      { degree: 0, accidental: null },
    ],
  },
  {
    length: 1,
    name: 'Half cadence',
    pattern: [
      { degree: 4, accidental: null },
    ],
  },
]

function parseRomanNumeral(s: string): ParsedNumeral | null {
  let clean = s.trim()
  if (clean.length === 0) return null

  for (const suffix of QUALITY_SUFFIXES) {
    if (clean.endsWith(suffix)) {
      clean = clean.slice(0, -suffix.length)
      break
    }
  }

  if (clean.length === 0) return null

  let accidental: '♭' | '♯' | null = null
  const first = clean[0]
  if (first === '♭' || first === 'b') {
    accidental = '♭'
    clean = clean.slice(1)
  } else if (first === '♯' || first === '#') {
    accidental = '♯'
    clean = clean.slice(1)
  }

  const degree = ROMAN_TO_DEGREE[clean.toLowerCase()]
  if (degree === undefined) return null

  return { degree, accidental }
}

function degreeToSemitone(d: number, accidental: '♭' | '♯' | null): number {
  let semitone = MAJOR_SCALE_SEMITONES[d]
  if (accidental === '♭') semitone -= 1
  else if (accidental === '♯') semitone += 1
  return ((semitone % 12) + 12) % 12
}

function classifyMotion(diff: number): RootMotion {
  const d = ((diff % 12) + 12) % 12
  switch (d) {
    case 5: return 'authentic'
    case 7: return 'plagal'
    case 2: return 'step-up'
    case 10: return 'step-down'
    case 3: case 4: case 8: case 9: return 'mediant'
    case 0: return 'repeat'
    case 6: return 'tritone'
    default: return 'other'
  }
}

function numeralsMatch(
  a: ParsedNumeral,
  b: { degree: number; accidental: '♭' | '♯' | null }
): boolean {
  return a.degree === b.degree && a.accidental === b.accidental
}

function detectCadence(parsed: (ParsedNumeral | null)[]): string {
  if (parsed.length === 0) return 'Other / no clear cadence'

  for (const cp of CADENCE_PATTERNS) {
    for (let i = parsed.length - cp.length; i >= 0; i--) {
      let match = true
      for (let j = 0; j < cp.length; j++) {
        const p = parsed[i + j]
        if (!p || !numeralsMatch(p, cp.pattern[j])) {
          match = false
          break
        }
      }
      if (match) return cp.name
    }
  }

  return 'Other / no clear cadence'
}

export function classifyCadence(romanNumerals: string[]): CadenceAnalysis {
  const parsed = romanNumerals.map(parseRomanNumeral)

  const anyNull = parsed.some(p => p === null)
  const confidence: 'high' | 'low' = anyNull ? 'low' : 'high'

  const motions: RootMotion[] = []
  for (let i = 0; i < parsed.length - 1; i++) {
    const prev = parsed[i]
    const next = parsed[i + 1]
    if (!prev || !next) {
      motions.push('other')
      continue
    }
    const prevSemitone = degreeToSemitone(prev.degree, prev.accidental)
    const nextSemitone = degreeToSemitone(next.degree, next.accidental)
    const diff = ((nextSemitone - prevSemitone) % 12 + 12) % 12
    motions.push(classifyMotion(diff))
  }

  const cadence = anyNull ? 'Other / no clear cadence' : detectCadence(parsed)

  return { motions, cadence, confidence }
}
