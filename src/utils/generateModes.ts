import isStringInArray from './isStringInArray'
import modulo from './modulo'
import { Mode } from './types'

import { KEYS, KEYS_SHARP, MODES_LIST, NOTE_TO_SEMITONE } from './constants'

const generateModes = (scale: string = 'C', preferSharp = false) => {
  const ionianShifter = (mode = 'ionian'): string[] => {
    const intervals = ['W', 'W', 'H', 'W', 'W', 'W', 'H']

    if (mode === 'ionian') {
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
    if (isStringInArray(property, 'flat')) {
      result += '♭'
    } else if (isStringInArray(property, 'sharp')) {
      result += '♯'
    }
    return result
  }

  const parserNumeral = (property: string[] = [], index = 0): string => {
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

  const generateRomanNumerals = (currentMode = 'ionian'): string[] => {
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

    if (isStringInArray(property, 'sharp')) {
      const semitone = modulo(NOTE_TO_SEMITONE[currentKey] - 1, 12)
      finalKey = preferSharp ? KEYS_SHARP[semitone] : KEYS[semitone]
    }

    if (isStringInArray(property, 'minor')) {
      finalKey += 'm'
    }

    if (isStringInArray(property, 'diminished')) {
      finalKey += 'dim'
    }

    return finalKey
  }

  const generateChords = (usedScale = 'C', mode = 'ionian'): string[] => {
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

  const generateModeObj = (scale = 'C', mode = 'ionian'): Mode => {
    return {
      name: mode,
      intervals: ionianShifter(mode),
      romanNumerals: generateRomanNumerals(mode),
      chords: generateChords(scale, mode),
    }
  }

  const modeNames = Object.keys(MODES_LIST)
  const modes = []

  for (let i = 0; i < modeNames.length; i++) {
    const mode = modeNames[i]
    modes.push(generateModeObj(scale, mode))
  }

  return modes
}

export default generateModes
