export const KEYS = [
  'C',
  'D♭',
  'D',
  'E♭',
  'E',
  'F',
  'G♭',
  'G',
  'A♭',
  'A',
  'B♭',
  'B',
]

export const KEYS_SHARP = [
  'C',
  'C♯',
  'D',
  'D♯',
  'E',
  'F',
  'F♯',
  'G',
  'G♯',
  'A',
  'A♯',
  'B',
]

export const NOTE_TO_SEMITONE: Record<string, number> = {
  C: 0, 'C♯': 1, 'D♭': 1, D: 2, 'D♯': 3, 'E♭': 3,
  E: 4, F: 5, 'F♯': 6, 'G♭': 6, G: 7,
  'G♯': 8, 'A♭': 8, A: 9, 'A♯': 10, 'B♭': 10, B: 11,
}

export const MODES_LIST = {
  ionian: {
    degree: 0,
    chords_quality: [
      'major',
      'minor',
      'minor',
      'major',
      'major',
      'minor',
      'diminished',
    ],
  },
  dorian: {
    degree: 1,
    chords_quality: [
      'minor',
      'minor',
      'flat major',
      'major',
      'minor',
      'diminished',
      'flat major',
    ],
  },
  phrygian: {
    degree: 2,
    chords_quality: [
      'minor',
      'flat major',
      'flat major',
      'minor',
      'diminished',
      'flat major',
      'flat minor',
    ],
  },
  lydian: {
    degree: 3,
    chords_quality: [
      'major',
      'major',
      'minor',
      'sharp diminished',
      'major',
      'minor',
      'minor',
    ],
  },
  mixolydian: {
    degree: 4,
    chords_quality: [
      'major',
      'minor',
      'diminished',
      'major',
      'minor',
      'minor',
      'flat major',
    ],
  },
  aeolian: {
    degree: 5,
    chords_quality: [
      'minor',
      'diminished',
      'flat major',
      'minor',
      'minor',
      'flat major',
      'flat major',
    ],
  },
  locrian: {
    degree: 6,
    chords_quality: [
      'diminished',
      'flat major',
      'flat minor',
      'minor',
      'flat major',
      'flat major',
      'flat minor',
    ],
  },
}

export const COLOR_CLASSNAMES = Object.keys(MODES_LIST)

export const KEY_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
]
