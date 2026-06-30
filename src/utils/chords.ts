import * as Tone from 'tone'

const ROOT_TO_SEMITONE: Record<string, number> = {
  'C': 0, 'C♯': 1, 'D♭': 1,
  'D': 2, 'D♯': 3, 'E♭': 3,
  'E': 4,
  'F': 5, 'F♯': 6, 'G♭': 6,
  'G': 7, 'G♯': 8, 'A♭': 8,
  'A': 9, 'A♯': 10, 'B♭': 10,
  'B': 11,
}

const SEMITONE_TO_NOTE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

function parseChord(chordName: string): { root: string; quality: 'maj' | 'min' | 'dim' } {
  const match = chordName.match(/^([A-G])([♭♯])?(dim|m)?$/)
  if (!match) {
    throw new Error(`Invalid chord name: ${chordName}`)
  }
  const root = match[1] + (match[2] || '')
  const suffix = match[3]
  const quality = suffix === 'dim' ? 'dim' : suffix === 'm' ? 'min' : 'maj'
  return { root, quality }
}

function midiToNote(midi: number): string {
  const octave = Math.floor(midi / 12) - 1
  const noteIndex = ((midi % 12) + 12) % 12
  return SEMITONE_TO_NOTE[noteIndex] + octave
}

export function chordToNotes(chordName: string): string[] {
  const { root, quality } = parseChord(chordName)
  const rootSemitone = ROOT_TO_SEMITONE[root]

  const intervals =
    quality === 'maj' ? [0, 4, 7] : quality === 'min' ? [0, 3, 7] : [0, 3, 6]

  const rootMidi = rootSemitone + 60
  const n0 = rootMidi + intervals[0]
  const n1 = rootMidi + intervals[1]
  const n2 = rootMidi + intervals[2]

  let midiNotes: number[]
  if (rootSemitone >= 0 && rootSemitone <= 4) {
    midiNotes = [n0, n1, n2]
  } else if (rootSemitone >= 5 && rootSemitone <= 7) {
    midiNotes = [n2 - 12, n0, n1]
  } else {
    midiNotes = [n1 - 12, n2 - 12, n0]
  }

  return midiNotes.map(midiToNote)
}

let synth: Tone.PolySynth | null = null

function ensureSynth(): Tone.PolySynth {
  if (!synth) {
    synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.005, decay: 0.3, sustain: 0.2, release: 0.5 },
    })
    synth.maxPolyphony = 18
    synth.toDestination()
  }
  return synth
}

export function triggerAttackChord(chordName: string): void {
  const notes = chordToNotes(chordName)
  ensureSynth().triggerAttack(notes)
}

export function triggerReleaseChord(chordName: string): void {
  const notes = chordToNotes(chordName)
  ensureSynth().triggerRelease(notes)
}
