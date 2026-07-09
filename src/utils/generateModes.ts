import { MODE_NAMES, ModeName, Mode } from './types'

import { DIMINISHED, FLAT, IONIAN, KEYS, KEYS_SHARP, MAJOR, MINOR, MODES_LIST, NOTE_TO_SEMITONE, SHARP } from './constants'

const modulo = (dividend: number, divisor: number) => ((dividend % divisor) + divisor) % divisor

const generateModes = (scale: string = 'C', preferSharp = false) => {
  const ionianShifter = (mode: ModeName = IONIAN): string[] => {
    const intervals = ['W', 'W', 'H', 'W', 'W', 'W', 'H']

    if (mode === IONIAN) {
      return intervals
    }

    for (let i = 0; i < MODES_LIST[mode].degree; i++) {
      intervals.push(intervals[0])
      intervals.shift()
    }

    return intervals
  }

  const sharpOrFlat = (property: string[] = []): string => {
    let result = ''
    if (property.includes(FLAT)) {
      result += '♭'
    } else if (property.includes(SHARP)) {
      result += '♯'
    }
    return result
  }

  const parserNumeral = (property: string[] = [], index = 0): string => {
    const romanKeys = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii']
    let numeral = ''

    numeral += sharpOrFlat(property)

    if (property.includes(MAJOR)) {
      numeral += romanKeys[index].toUpperCase()
    } else {
      numeral += romanKeys[index]
    }

    if (property.includes(DIMINISHED)) {
      numeral += '°'
    }

    return numeral
  }

  const generateRomanNumerals = (currentMode: ModeName = IONIAN): string[] => {
    const usedMode = MODES_LIST[currentMode].chords_quality
    const romanNumerals = []

    for (let i = 0; i < usedMode.length; i++) {
      const splitChordProperty = usedMode[i].split(' ')
      romanNumerals.push(parserNumeral(splitChordProperty, i))
    }

    return romanNumerals
  }

  const parserKey = (property: string[] = [], currentKey = 'C'): string => {
    let finalKey = currentKey

    if (property.includes(SHARP)) {
      const semitone = modulo(NOTE_TO_SEMITONE[currentKey] - 1, 12)
      finalKey = preferSharp ? KEYS_SHARP[semitone] : KEYS[semitone]
    }

    if (property.includes(MINOR)) {
      finalKey += 'm'
    }

    if (property.includes(DIMINISHED)) {
      finalKey += 'dim'
    }

    return finalKey
  }

  const generateChords = (usedScale = 'C', mode: ModeName = IONIAN): string[] => {
    const length = {
      H: 1,
      W: 2,
    }
    const intervals = ionianShifter(mode)
    const activeKeys = preferSharp ? KEYS_SHARP : KEYS
    const keyIndex = KEYS.findIndex((scale) => scale === usedScale)
    let currentIndex = keyIndex

    const chords = []

    for (let i = 0; i < intervals.length; i++) {
      const interval = intervals[i]
      const currentKey = activeKeys[modulo(currentIndex, activeKeys.length)]
      const usedMode = MODES_LIST[mode].chords_quality
      const chord = parserKey(
        usedMode[modulo(i, usedMode.length)].split(' '),
        currentKey
      )
      chords.push(chord)

      currentIndex += length[interval]
    }

    return chords
  }

  const generateModeObj = (scale = 'C', mode: ModeName = IONIAN): Mode => {
    return {
      name: mode,
      intervals: ionianShifter(mode),
      romanNumerals: generateRomanNumerals(mode),
      chords: generateChords(scale, mode),
    }
  }

  const modes = []

  for (let i = 0; i < MODE_NAMES.length; i++) {
    const mode = MODE_NAMES[i]
    modes.push(generateModeObj(scale, mode))
  }

  return modes
}

export default generateModes
