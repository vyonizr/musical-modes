import { describe, it, expect } from 'vitest'
import { chordToNotes } from './chords'
import { KEYS_SHARP } from './constants'

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

function noteToMidi(note: string): number {
  const match = note.match(/^([A-G]#?)(-?\d+)$/)
  if (!match) throw new Error(`Invalid note: ${note}`)
  const octave = parseInt(match[2], 10)
  return (octave + 1) * 12 + NOTE_NAMES.indexOf(match[1])
}

describe('chordToNotes register anchoring', () => {
  it('keeps every root within the same 12-semitone window', () => {
    const rootMidis = KEYS_SHARP.map((root) => noteToMidi(chordToNotes(root)[0]))
    expect(Math.min(...rootMidis)).toBeGreaterThanOrEqual(37)
    expect(Math.max(...rootMidis)).toBeLessThanOrEqual(48)
  })

  it('has no octave cliff between chromatically adjacent roots (D# -> E)', () => {
    const dSharpRoot = noteToMidi(chordToNotes('D♯')[0])
    const eRoot = noteToMidi(chordToNotes('E')[0])
    expect(eRoot - dSharpRoot).toBe(1)
  })

  it('wraps B -> C by one semitone, not back down an octave', () => {
    const bRoot = noteToMidi(chordToNotes('B')[0])
    const cRoot = noteToMidi(chordToNotes('C')[0])
    expect(cRoot - bRoot).toBe(1)
  })
})
