import * as Tone from "tone";
import { NOTE_TO_SEMITONE } from "./constants";

const SEMITONE_TO_NOTE = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

export type ChordFlavor = "flat7" | "maj7" | "sus4" | "sus2";

type QualityVoicing = Record<"maj" | "min" | "dim", number[]>;

const GUITAR_VOICING: QualityVoicing = {
  maj: [0, 4, 7, 12, 16, 19],
  min: [0, 3, 7, 12, 15, 19],
  dim: [0, 3, 6, 12, 15, 18],
};

const GUITAR_VOICING_7TH: Record<Exclude<ChordFlavor, "sus4" | "sus2">, QualityVoicing> = {
  flat7: {
    maj: [0, 4, 7, 10, 16, 19],
    min: [0, 3, 7, 10, 15, 19],
    dim: [0, 3, 6, 10, 15, 18],
  },
  maj7: {
    maj: [0, 4, 7, 11, 16, 19],
    min: [0, 3, 7, 11, 15, 19],
    dim: [0, 3, 6, 11, 15, 18],
  },
};

const GUITAR_VOICING_SUS: Record<"sus4" | "sus2", QualityVoicing> = {
  sus4: {
    maj: [0, 5, 7, 12, 17, 19],
    min: [0, 5, 7, 12, 17, 19],
    dim: [0, 5, 6, 12, 17, 18],
  },
  sus2: {
    maj: [0, 2, 7, 12, 14, 19],
    min: [0, 2, 7, 12, 14, 19],
    dim: [0, 2, 6, 12, 14, 18],
  },
};

// Velocity per string: bass string louder, upper strings softer
const STRUM_VELOCITIES = [0.55, 0.7, 0.65, 0.6, 0.6, 0.55];

const STRUM_DELAY_S = 0.005; // 5ms between strings

function parseChord(chordName: string): {
  root: string;
  quality: "maj" | "min" | "dim";
} {
  const match = chordName.match(/^([A-G])([♭♯])?(dim|m)?$/);
  if (!match) {
    throw new Error(`Invalid chord name: ${chordName}`);
  }
  const root = match[1] + (match[2] || "");
  const suffix = match[3];
  const quality = suffix === "dim" ? "dim" : suffix === "m" ? "min" : "maj";
  return { root, quality };
}

function midiToNote(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const noteIndex = ((midi % 12) + 12) % 12;
  return SEMITONE_TO_NOTE[noteIndex] + octave;
}

const ANCHOR_MIDI = 43;

export function chordToNotes(
  chordName: string,
  flavour?: ChordFlavor
): string[] {
  const { root, quality } = parseChord(chordName);
  let rootMidi = NOTE_TO_SEMITONE[root] + 36;
  while (rootMidi < ANCHOR_MIDI - 6) rootMidi += 12;
  while (rootMidi >= ANCHOR_MIDI + 6) rootMidi -= 12;

  if (flavour === "sus4" || flavour === "sus2") {
    return GUITAR_VOICING_SUS[flavour][quality].map((offset) =>
      midiToNote(rootMidi + offset)
    );
  }
  if (flavour) {
    return GUITAR_VOICING_7TH[flavour][quality].map((offset) =>
      midiToNote(rootMidi + offset)
    );
  }

  return GUITAR_VOICING[quality].map((offset) => midiToNote(rootMidi + offset));
}

export function display7thChordName(chordName: string, seventh: Exclude<ChordFlavor, "sus4" | "sus2">): string {
  const { root, quality } = parseChord(chordName);
  if (quality === "dim") {
    return seventh === "flat7" ? `${root}m7b5` : `${root}dimM7`;
  }
  if (quality === "min") {
    return seventh === "flat7" ? `${chordName}7` : `${chordName}Maj7`;
  }
  return seventh === "flat7" ? `${root}7` : `${root}maj7`;
}

export function displaySusChordName(chordName: string, sus: "sus4" | "sus2"): string {
  const { root } = parseChord(chordName);
  return `${root}${sus}`;
}

let synth: Tone.PolySynth | null = null;
let reverb: Tone.Reverb | null = null;
let limiter: Tone.Limiter | null = null;
let volumeNode: Tone.Volume | null = null;

const VOLUME_STORAGE_KEY = "musical-modes-volume";

// 0 (silent) - 1 (full) mapped to -40dB..0dB, matching how humans perceive loudness
export function volumeToDb(volume: number): number {
  if (volume <= 0) return -Infinity;
  return -40 + volume * 40;
}

export function setVolume(volume: number): void {
  if (volumeNode) volumeNode.volume.value = volumeToDb(volume);
  if (typeof window !== "undefined") {
    localStorage.setItem(VOLUME_STORAGE_KEY, String(volume));
  }
}

export function getStoredVolume(): number {
  if (typeof window === "undefined") return 0.8;
  const stored = localStorage.getItem(VOLUME_STORAGE_KEY);
  const parsed = stored ? parseFloat(stored) : NaN;
  return Number.isFinite(parsed) ? parsed : 0.8;
}

function ensureSynth(): Tone.PolySynth {
  if (!synth) {
    limiter = new Tone.Limiter(-2).toDestination();
    volumeNode = new Tone.Volume(volumeToDb(getStoredVolume())).connect(limiter);
    reverb = new Tone.Reverb({ decay: 1.5, wet: 0.3 }).connect(volumeNode);
    synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.012, decay: 0.8, sustain: 0.4, release: 1.2 },
    });
    // ponytail: 64 voices — 6 notes/chord × ~10 overlapping releases at fast strum tempo
    synth.maxPolyphony = 64;
    synth.connect(reverb);
  }
  return synth;
}

export function triggerAttackChord(
  chordName: string,
  flavour?: ChordFlavor
): void {
  const s = ensureSynth();
  const notes = chordToNotes(chordName, flavour);
  const now = Tone.now();
  notes.forEach((note, i) => {
    s.triggerAttack(note, now + i * STRUM_DELAY_S, STRUM_VELOCITIES[i]);
  });
}

export function triggerReleaseChord(
  chordName: string,
  flavour?: ChordFlavor
): void {
  const s = ensureSynth();
  const notes = chordToNotes(chordName, flavour);
  const now = Tone.now();
  notes.forEach((note, i) => {
    s.triggerRelease(note, now + i * STRUM_DELAY_S);
  });
}
