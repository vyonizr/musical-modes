import { describe, it, expect } from 'vitest'
import { chordToNotes, ChordFlavor } from './chords'
import generateModes from './generateModes'
import { PROGRESSIONS } from './progressions'
import { KEYS } from './constants'

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

function noteToMidi(note: string): number {
  const match = note.match(/^([A-G]#?)(-?\d+)$/)
  if (!match) throw new Error(`Invalid note: ${note}`)
  const octave = parseInt(match[2], 10)
  return (octave + 1) * 12 + NOTE_NAMES.indexOf(match[1])
}

const midis = (chord: string, flavour?: ChordFlavor) =>
  chordToNotes(chord, flavour).map(noteToMidi)

const bass = (chord: string) => midis(chord)[0]
const upper = (chord: string, flavour?: ChordFlavor) => midis(chord, flavour).slice(1)

const FLAVOURS: (ChordFlavor | undefined)[] = [
  undefined,
  'flat7',
  'maj7',
  'sus4',
  'sus2',
]

const ionianChords = (key: string) =>
  generateModes(key, false).find((m) => m.name === 'ionian')!.chords

const allChords = KEYS.flatMap((key) =>
  generateModes(key, false).flatMap((mode) => mode.chords)
)

describe('chord voicing', () => {
  it('sounds the root as the bass, one per pitch class', () => {
    expect(bass('C')).toBe(36)
    expect(bass('B')).toBe(47)
    for (const chord of allChords) {
      expect(bass(chord), chord).toBeGreaterThanOrEqual(36)
      expect(bass(chord), chord).toBeLessThanOrEqual(47)
    }
  })

  it('holds the upper voices in one fixed register whatever the root', () => {
    for (const chord of allChords) {
      for (const flavour of FLAVOURS) {
        for (const midi of upper(chord, flavour)) {
          expect(midi, `${chord} ${flavour}`).toBeGreaterThanOrEqual(48)
          expect(midi, `${chord} ${flavour}`).toBeLessThanOrEqual(66)
        }
      }
    }
  })

  it('voices only chord tones, and every chord tone at least once', () => {
    const expected: Record<string, number[]> = {
      C: [0, 4, 7],
      Am: [9, 0, 4],
      Bdim: [11, 2, 5],
    }
    for (const [chord, tones] of Object.entries(expected)) {
      const sounded = new Set(midis(chord).map((m) => m % 12))
      expect([...sounded].sort(), chord).toEqual([...tones].sort())
    }
    expect(new Set(midis('C', 'flat7').map((m) => m % 12))).toEqual(
      new Set([0, 4, 7, 10])
    )
    expect(new Set(midis('C', 'sus4').map((m) => m % 12))).toEqual(
      new Set([0, 5, 7])
    )
  })

  it('never doubles a note in unison, which would strand a voice on release', () => {
    for (const chord of allChords) {
      for (const flavour of FLAVOURS) {
        const sounded = midis(chord, flavour)
        expect(new Set(sounded).size, `${chord} ${flavour}`).toBe(sounded.length)
      }
    }
  })

  it('rises through the strum, bass string first', () => {
    for (const chord of allChords) {
      const sounded = midis(chord)
      expect([...sounded].sort((a, b) => a - b), chord).toEqual(sounded)
    }
  })
})

// The bug this file exists for: a chord whose root wrapped to the far end of
// the octave used to drag its whole voicing with it, so it sounded a tenth away
// from its neighbour. Measured on the upper voices, which is what carries the
// perceived register — the bass is free to leap, that is what basslines do.
function upperLeap(from: string, to: string): number {
  const a = upper(from)
  const b = upper(to)
  return Math.max(...a.map((midi, i) => Math.abs(b[i] - midi)))
}

describe('register continuity between chords', () => {
  it('keeps C next to D in the key of C (reported: C sounded higher than D)', () => {
    expect(upperLeap('C', 'D')).toBeLessThanOrEqual(4)
    expect(bass('D') - bass('C')).toBe(2)
  })

  it('keeps bVI-bVII-I connected in the key of E (reported: tonic dropped away)', () => {
    expect(upperLeap('C', 'D')).toBeLessThanOrEqual(4)
    expect(upperLeap('D', 'E')).toBeLessThanOrEqual(4)
    expect(bass('D') - bass('C')).toBe(2)
    expect(bass('E') - bass('D')).toBe(2)
  })

  it('moves every voice by at most a fourth between any two chords', () => {
    for (const from of allChords) {
      for (const to of allChords) {
        expect(upperLeap(from, to), `${from} -> ${to}`).toBeLessThanOrEqual(5)
      }
    }
  })

  it('holds every step of every built-in progression in the same register, in every key', () => {
    for (const key of KEYS) {
      const modes = generateModes(key, false)
      for (const progression of PROGRESSIONS) {
        const chords = progression.steps.map(
          (step) => modes.find((m) => m.name === step.mode)!.chords[step.degreeIndex]
        )
        // step through, and round the loop back to the first chord
        for (let i = 0; i < chords.length; i++) {
          const from = chords[i]
          const to = chords[(i + 1) % chords.length]
          expect(
            upperLeap(from, to),
            `${key} ${progression.id}: ${from} -> ${to}`
          ).toBeLessThanOrEqual(5)
        }
      }
    }
  })

  it('keeps the diatonic chords of every key within one register', () => {
    for (const key of KEYS) {
      const tops = ionianChords(key).map((chord) => Math.max(...upper(chord)))
      expect(Math.max(...tops) - Math.min(...tops), `key ${key}`).toBeLessThanOrEqual(5)
    }
  })
})

// 5 semitones is the ceiling the voicing can hit: a voice sits at the first
// chord tone above UPPER_FLOOR, and the widest gap between chord tones is a
// fourth. Measured over every chord pair the app can produce, 1244 of 1296
// pairs move less than that.
