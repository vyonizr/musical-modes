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

export const TABLE_VIEW_OPTIONS = ['Chords', 'Numerals']

export const COLOR_CLASSNAMES = [
  'ionian',
  'dorian',
  'phrygian',
  'lydian',
  'mixolydian',
  'aeolian',
  'locrian',
]
