import isStringInArray from './isStringInArray'
import modulo from './modulo'
import { Mode } from './types'

import { KEYS, CHORDS_QUALITY, MODES_DEGREE } from './constants'

const generateModes = (scale: string = 'C') => {
  const ionianShifter = (mode = 'ionian') => {
    const intervals = ['W', 'W', 'H', 'W', 'W', 'W', 'H']

    if (mode === 'Ionian') {
      return intervals
    }

    for (let i = 0; i < MODES_DEGREE[mode]; i++) {
      intervals.push(intervals[0])
      intervals.shift()
    }

    return intervals
  }

  const sharpOrFlat = (property: string[] = []) => {
    let result = ''
    if (isStringInArray(property, 'flat')) {
      result += '♭'
    } else if (isStringInArray(property, 'sharp')) {
      result += '♯'
    }
    return result
  }

  const parserNumeral = (property: string[] = [], index = 0) => {
    const romanKeys = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii']
    let numeral = ''

    numeral += sharpOrFlat(property)

    if (isStringInArray(property, 'major')) {
      numeral += romanKeys[index].toUpperCase()
    } else {
      numeral += romanKeys[index]
    }

    if (isStringInArray(property, 'diminished')) {
      numeral += '°'
    }

    return numeral
  }

  const generateRomanNumerals = (currentMode = 'Ionian'): string[] => {
    const usedMode = CHORDS_QUALITY[currentMode]
    const romanNumerals = []

    for (let i = 0; i < usedMode.length; i++) {
      const splitChordProperty = usedMode[i].split(' ')
      romanNumerals.push(parserNumeral(splitChordProperty, i))
    }

    return romanNumerals
  }

  const parserKey = (property: string[] = [], currentKey = 'C'): string => {
    let finalKey = currentKey

    if (isStringInArray(property, 'sharp')) {
      let keyIndex = KEYS.findIndex((key) => key === currentKey)
      let alteredIndex = modulo(keyIndex - 1, KEYS.length)

      if (KEYS[alteredIndex].search('♭') !== -1) {
        finalKey = KEYS[alteredIndex].replace('♭', '')
      } else {
        switch (KEYS[alteredIndex]) {
          case 'B':
            finalKey = 'C'
            break
          case 'E':
            finalKey = 'F'
            break
          default:
            finalKey = KEYS[alteredIndex] + '♯'
        }
      }
    }

    if (isStringInArray(property, 'minor')) {
      finalKey += 'm'
    }

    if (isStringInArray(property, 'diminished')) {
      finalKey += 'dim'
    }

    return finalKey
  }

  const generateChords = (usedScale = 'C', mode = 'Ionian'): string[] => {
    const length = {
      H: 1,
      W: 2,
    }
    const intervals = ionianShifter(mode)
    const keyIndex = KEYS.findIndex((scale) => scale === usedScale)
    let currentIndex = keyIndex

    const chords = []

    for (let i = 0; i < intervals.length; i++) {
      const interval = intervals[i]
      const currentKey = KEYS[modulo(currentIndex, KEYS.length)]
      const usedMode = CHORDS_QUALITY[mode]
      const chord = parserKey(
        usedMode[modulo(i, usedMode.length)].split(' '),
        currentKey
      )
      chords.push(chord)

      currentIndex += length[interval]
    }

    return chords
  }

  const generateModeObj = (scale = 'C', mode = 'ionian'): Mode => {
    return {
      name: mode,
      intervals: ionianShifter(mode),
      romanNumerals: generateRomanNumerals(mode),
      chords: generateChords(scale, mode),
    }
  }

  const modeNames = Object.keys(CHORDS_QUALITY)
  const modes = []

  for (let i = 0; i < modeNames.length; i++) {
    const mode = modeNames[i]
    modes.push(generateModeObj(scale, mode))
  }

  return modes
}

export default generateModes
