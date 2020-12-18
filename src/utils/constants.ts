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

export const CHORDS_QUALITY = {
  ionian: ['major', 'minor', 'minor', 'major', 'major', 'minor', 'diminished'],
  dorian: [
    'minor',
    'minor',
    'flat major',
    'major',
    'minor',
    'diminished',
    'flat major',
  ],
  phrygian: [
    'minor',
    'flat major',
    'flat major',
    'minor',
    'diminished',
    'flat major',
    'flat minor',
  ],
  lydian: [
    'major',
    'major',
    'minor',
    'sharp diminished',
    'major',
    'minor',
    'minor',
  ],
  mixolydian: [
    'major',
    'minor',
    'diminished',
    'major',
    'minor',
    'minor',
    'flat major',
  ],
  aeolian: [
    'minor',
    'diminished',
    'flat major',
    'minor',
    'minor',
    'flat major',
    'flat major',
  ],
  locrian: [
    'diminished',
    'flat major',
    'flat minor',
    'minor',
    'flat major',
    'flat major',
    'flat minor',
  ],
}

export const MODES_DEGREE = {
  ionian: 0,
  dorian: 1,
  phrygian: 2,
  lydian: 3,
  mixolydian: 4,
  aeolian: 5,
  locrian: 6,
}

export const TABLE_VIEW_OPTIONS = ['Chords', 'Numerals', 'Intervals']

export const COLOR_CLASSNAMES = [
  'ionian',
  'dorian',
  'phrygian',
  'lydian',
  'mixolydian',
  'aeolian',
  'locrian',
]
