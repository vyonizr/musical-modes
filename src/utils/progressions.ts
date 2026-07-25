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
  spotifyUrl?: string
}

export const BPM_DEFAULT = 120

export const PROGRESSIONS: Progression[] = [
  {
    id: "melancholic-uplift",
    name: "Melancholic Uplift",
    bpm: BPM_DEFAULT,
    steps: [
      { mode: "aeolian", degreeIndex:2 },
      { mode: "ionian", degreeIndex: 3 },
      { mode: "ionian", degreeIndex: 0 },
      { mode: "ionian", degreeIndex: 0 },
    ],
    songs: [
      "Mike Shinoda - Lift Off",
    ],
    spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M",
  },
  {
    id: "melancholic-return",
    name: "Melancholic Return",
    bpm: BPM_DEFAULT,
    steps: [
      { mode: "dorian", degreeIndex:2 },
      { mode: "dorian", degreeIndex: 3 },
      { mode: "dorian", degreeIndex: 0 },
      { mode: "dorian", degreeIndex: 0 },
    ],
    songs: [
      "Arty - Glorious",
    ],
    spotifyUrl: "https://open.spotify.com/playlist/6uEwoBfzAAphJc4upBVhUE",
  },
  {
    id: "mario-cadence",
    name: "Mario Cadence",
    bpm: BPM_DEFAULT,
    steps: [
      { mode: "aeolian", degreeIndex:5 },
      { mode: "aeolian", degreeIndex: 6 },
      { mode: "ionian", degreeIndex: 0 },
      { mode: "ionian", degreeIndex: 0 },
    ],
    songs: [
      "Super Mario Bros. - Overworld Theme",
    ],
    spotifyUrl: "https://open.spotify.com/playlist/2kglwPEVm4ExlIB2TgnaXB",
  },
  {
    id: "double-plagal",
    name: "Double Plagal",
    bpm: BPM_DEFAULT,
    steps: [
      { mode: "aeolian", degreeIndex: 6 },
      { mode: "ionian", degreeIndex: 3 },
      { mode: "ionian", degreeIndex: 0 },
      { mode: "ionian", degreeIndex: 0 },
    ],
    songs: [
      "The Killers - Some Kind of Love",
    ],
    spotifyUrl: "https://open.spotify.com/playlist/5zTpfyKeZksrbiUO3Po7mx",
  },
  {
    id: "backdoor-vamp",
    name: "Backdoor Vamp",
    bpm: BPM_DEFAULT/2,
    steps: [
      { mode: "ionian", degreeIndex: 0 },
      { mode: "aeolian", degreeIndex: 6 },
      { mode: "ionian", degreeIndex: 3 },
      { mode: "ionian", degreeIndex: 0 },
    ],
    songs: [
      "Christoffer Franzen - Walk",
    ],
    spotifyUrl: "https://open.spotify.com/playlist/3CdMb1qrmDZaclBYOvxkS9",
  },
  {
    id: "haunting-progression",
    name: "Haunting Progression",
    bpm: BPM_DEFAULT,
    steps: [
      { mode: "aeolian", degreeIndex: 5 },
      { mode: "aeolian", degreeIndex: 3 },
      { mode: "ionian", degreeIndex: 0 },
      { mode: "ionian", degreeIndex: 0 },
    ],
    songs: [
      "Bad Omens - The Worst in Me",
    ],
    spotifyUrl: "https://open.spotify.com/playlist/58oemdpuDrajJANlkkmyfQ",
  },
]
