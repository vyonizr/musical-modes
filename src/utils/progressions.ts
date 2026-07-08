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
    id: "olson",
    name: "Olson Progression",
    bpm: 80,
    steps: [
      { mode: "aeolian", degreeIndex:2 },
      { mode: "ionian", degreeIndex: 3 },
      { mode: "ionian", degreeIndex: 0 },
      { mode: "ionian", degreeIndex: 0 },
    ],
    songs: [
      "Mike Shinoda - Lift Off",
    ],
  },
  {
    id: "dorian",
    name: "Dorian Progression",
    bpm: 120,
    steps: [
      { mode: "dorian", degreeIndex:2 },
      { mode: "dorian", degreeIndex: 3 },
      { mode: "dorian", degreeIndex: 0 },
      { mode: "dorian", degreeIndex: 0 },
    ],
    songs: [
      "Arty - Glorious",
    ],
  },
  {
    id: "mario-cadence",
    name: "Mario Cadence",
    bpm: 120,
    steps: [
      { mode: "aeolian", degreeIndex:5 },
      { mode: "aeolian", degreeIndex: 6 },
      { mode: "ionian", degreeIndex: 0 },
      { mode: "ionian", degreeIndex: 0 },
    ],
    songs: [
      "Super Mario Bros. - Overworld Theme",
    ],
  },
  {
    id: "mixolydian",
    name: "Mixolydian Progression",
    bpm: 120,
    steps: [
      { mode: "mixolydian", degreeIndex: 6 },
      { mode: "mixolydian", degreeIndex: 3 },
      { mode: "mixolydian", degreeIndex: 0 },
      { mode: "mixolydian", degreeIndex: 0 },
    ],
    songs: [
      "The Killers - Some Kind of Love",
    ],
  },
  {
    id: "mixolydian-vamp",
    name: "Mixolydian Vamp",
    bpm: 80,
    steps: [
      { mode: "mixolydian", degreeIndex: 0 },
      { mode: "mixolydian", degreeIndex: 6 },
      { mode: "mixolydian", degreeIndex: 3 },
      { mode: "mixolydian", degreeIndex: 0 },
    ],
    songs: [
      "Christoffer Franzen - Walk",
    ],
  },
  {
    id: "bad-omens",
    name: "Haunting Progression",
    bpm: 120,
    steps: [
      { mode: "aeolian", degreeIndex: 5 },
      { mode: "aeolian", degreeIndex: 3 },
      { mode: "ionian", degreeIndex: 0 },
      { mode: "ionian", degreeIndex: 0 },
    ],
    songs: [
      "Bad Omens - The Worst in Me",
    ],
  },
]
