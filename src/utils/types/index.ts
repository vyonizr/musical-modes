export interface Mode {
  name: string,
  intervals: string[],
  romanNumerals: string[],
  chords: string[]
}

export const MODE_NAMES = [
  'ionian',
  'dorian',
  'phrygian',
  'lydian',
  'mixolydian',
  'aeolian',
  'locrian',
] as const
export type ModeName = (typeof MODE_NAMES)[number]

export type Accidental = 'flat' | 'sharp'
export type ChordQuality = 'major' | 'minor' | 'diminished'