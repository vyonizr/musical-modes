import { ChordFlavor } from "src/utils/chords"

export interface ProgressionStep {
  mode: string
  degreeIndex: number
  flavour?: ChordFlavor
  bars?: number
}

export interface Progression {
  id: string
  name: string
  bpm?: number
  steps: ProgressionStep[]
  songs: string[]
}

export const PROGRESSIONS: Progression[] = [
  {
    id: "50s",
    name: "50s Progression",
    bpm: 120,
    steps: [
      { mode: "ionian", degreeIndex: 0 },
      { mode: "ionian", degreeIndex: 5 },
      { mode: "ionian", degreeIndex: 3 },
      { mode: "ionian", degreeIndex: 4 },
    ],
    songs: ["Earth Angel", "Blue Moon", "All I Have to Do Is Dream"],
  },
  {
    id: "pop-punk",
    name: "Pop-Punk",
    bpm: 160,
    steps: [
      { mode: "ionian", degreeIndex: 0 },
      { mode: "ionian", degreeIndex: 4 },
      { mode: "ionian", degreeIndex: 5 },
      { mode: "ionian", degreeIndex: 3 },
    ],
    songs: ["When I Come Around", "You're Gonna Go Far, Kid"],
  },
  {
    id: "andalusian",
    name: "Andalusian Cadence",
    bpm: 100,
    steps: [
      { mode: "aeolian", degreeIndex: 0 },
      { mode: "aeolian", degreeIndex: 6 },
      { mode: "aeolian", degreeIndex: 5 },
      { mode: "aeolian", degreeIndex: 4 },
    ],
    songs: ["Hit the Road Jack", "Smooth Criminal", "Bamboleo"],
  },
  {
    id: "12-bar-blues",
    name: "12-Bar Blues",
    bpm: 120,
    steps: [
      { mode: "ionian", degreeIndex: 0, flavour: "flat7", bars: 4 },
      { mode: "ionian", degreeIndex: 3, flavour: "flat7", bars: 4 },
      { mode: "ionian", degreeIndex: 0, flavour: "flat7", bars: 2 },
      { mode: "ionian", degreeIndex: 4, flavour: "flat7", bars: 2 },
      { mode: "ionian", degreeIndex: 3, flavour: "flat7", bars: 2 },
      { mode: "ionian", degreeIndex: 0, flavour: "flat7", bars: 2 },
    ],
    songs: ["Johnny B. Goode", "Pride and Joy", "Sweet Home Chicago"],
  },
  {
    id: "minor-descent",
    name: "Minor Descent",
    bpm: 100,
    steps: [
      { mode: "aeolian", degreeIndex: 0 },
      { mode: "aeolian", degreeIndex: 5 },
      { mode: "aeolian", degreeIndex: 2 },
      { mode: "aeolian", degreeIndex: 6 },
    ],
    songs: ["Losing My Religion", "Zombie", "Stairway to Heaven"],
  },
  {
    id: "modal-mixture",
    name: "Modal Mixture",
    bpm: 120,
    steps: [
      { mode: "ionian", degreeIndex: 0 },
      { mode: "ionian", degreeIndex: 4 },
      { mode: "mixolydian", degreeIndex: 6 },
      { mode: "ionian", degreeIndex: 3 },
    ],
    songs: ["Creep", "Man in the Box"],
  },
  {
    id: "doo-wop",
    name: "Doo-Wop",
    bpm: 120,
    steps: [
      { mode: "ionian", degreeIndex: 0 },
      { mode: "ionian", degreeIndex: 5 },
      { mode: "ionian", degreeIndex: 1 },
      { mode: "ionian", degreeIndex: 4 },
    ],
    songs: ["Stand by Me", "Duke of Earl", "The Great Pretender"],
  },
  {
    id: "dorian-vamp",
    name: "Dorian Vamp",
    bpm: 100,
    steps: [
      { mode: "dorian", degreeIndex: 0 },
      { mode: "dorian", degreeIndex: 3 },
    ],
    songs: ["Oye Como Va", "Moondance", "So What"],
  },
  {
    id: "phrygian-borrow",
    name: "Phrygian Borrow",
    bpm: 100,
    steps: [
      { mode: "aeolian", degreeIndex: 0 },
      { mode: "phrygian", degreeIndex: 1 },
      { mode: "aeolian", degreeIndex: 6 },
      { mode: "aeolian", degreeIndex: 0 },
    ],
    songs: ["Enter Sandman", "Wherever I May Roam"],
  },
]
