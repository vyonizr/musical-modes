import {
  parseRomanNumeral,
  degreeToSemitone,
  classifyMotion,
  type RootMotion,
} from './cadence'

export type LoopCharacter =
  | 'drone'
  | 'oscillation'
  | 'circular'
  | 'modal-vamp'
  | 'other-loop'

export interface LoopAnalysis {
  isLoop: boolean
  closureMotion: RootMotion
  palette: string[]
  character: LoopCharacter | null
}

function isPlainTonic(
  degree: number,
  accidental: '♭' | '♯' | null,
): boolean {
  return degree === 0 && accidental === null
}

export function analyzeLoop(romanNumerals: string[]): LoopAnalysis {
  if (romanNumerals.length === 0) {
    return { isLoop: false, closureMotion: 'other', palette: [], character: null }
  }

  const parsed = romanNumerals.map(parseRomanNumeral)

  if (parsed.some(p => p === null)) {
    return { isLoop: false, closureMotion: 'other', palette: [], character: null }
  }

  const first = parsed[0]!
  const last = parsed[parsed.length - 1]!

  const firstSemitone = degreeToSemitone(first.degree, first.accidental)
  const lastSemitone = degreeToSemitone(last.degree, last.accidental)
  const closureDiff = ((firstSemitone - lastSemitone) % 12 + 12) % 12
  const closureMotion = classifyMotion(closureDiff)

  const palette = [...new Set(romanNumerals)]

  const endsOnPlainTonic = isPlainTonic(last.degree, last.accidental)
  const isLoop = !endsOnPlainTonic && (
    closureMotion === 'authentic' ||
    closureMotion === 'plagal' ||
    closureMotion === 'repeat'
  )

  if (!isLoop) {
    return { isLoop: false, closureMotion, palette, character: null }
  }

  let character: LoopCharacter

  if (palette.length === 1) {
    character = 'drone'
  } else if (palette.length === 2) {
    character = 'oscillation'
  } else {
    const adjacentMotions: RootMotion[] = []
    for (let i = 0; i < parsed.length - 1; i++) {
      const prevSemitone = degreeToSemitone(parsed[i]!.degree, parsed[i]!.accidental)
      const nextSemitone = degreeToSemitone(parsed[i + 1]!.degree, parsed[i + 1]!.accidental)
      const diff = ((nextSemitone - prevSemitone) % 12 + 12) % 12
      adjacentMotions.push(classifyMotion(diff))
    }

    const allMotions = [...adjacentMotions, closureMotion]
    const allSame = allMotions.length > 0 && allMotions.every(m => m === allMotions[0])
    const hasAccidental = romanNumerals.some(rn => rn.includes('♭') || rn.includes('♯'))

    if (allSame) {
      character = 'circular'
    } else if (hasAccidental) {
      character = 'modal-vamp'
    } else {
      character = 'other-loop'
    }
  }

  return { isLoop: true, closureMotion, palette, character }
}
