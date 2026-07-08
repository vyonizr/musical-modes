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
    id: "melancholic-uplift",
    name: "Melancholic Uplift",
    bpm: 100,
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
    id: "melancholic-return",
    name: "Melancholic Return",
    bpm: 100,
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
    id: "double-plagal",
    name: "Double Plagal",
    bpm: 120,
    steps: [
      { mode: "aeolian", degreeIndex: 6 },
      { mode: "ionian", degreeIndex: 3 },
      { mode: "ionian", degreeIndex: 0 },
      { mode: "ionian", degreeIndex: 0 },
    ],
    songs: [
      "The Killers - Some Kind of Love",
    ],
  },
  {
    id: "backdoor-vamp",
    name: "Backdoor Vamp",
    bpm: 90,
    steps: [
      { mode: "ionian", degreeIndex: 0 },
      { mode: "aeolian", degreeIndex: 6 },
      { mode: "ionian", degreeIndex: 3 },
      { mode: "ionian", degreeIndex: 0 },
    ],
    songs: [
      "Christoffer Franzen - Walk",
    ],
  },
  {
    id: "haunting-progression",
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
