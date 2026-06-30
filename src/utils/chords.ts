import * as Tone from "tone";

const ROOT_TO_SEMITONE: Record<string, number> = {
  C: 0,
  "C♯": 1,
  "D♭": 1,
  D: 2,
  "D♯": 3,
  "E♭": 3,
  E: 4,
  F: 5,
  "F♯": 6,
  "G♭": 6,
  G: 7,
  "G♯": 8,
  "A♭": 8,
  A: 9,
  "A♯": 10,
  "B♭": 10,
  B: 11,
};

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

export type SeventhFlavor = "flat7" | "maj7";

type QualityVoicing = Record<"maj" | "min" | "dim", number[]>;

// Roots E2–B2 (MIDI 40–47): open-position span, 2 octaves
const GUITAR_VOICING: QualityVoicing = {
  maj: [0, 7, 12, 16, 19, 24], // R 5 R 3 5 R
  min: [0, 7, 12, 15, 19, 24], // R 5 R m3 5 R
  dim: [0, 3, 6, 12, 15, 18], // R m3 b5 R m3 b5
};

const GUITAR_VOICING_7TH: Record<SeventhFlavor, QualityVoicing> = {
  flat7: {
    maj: [0, 7, 10, 16, 19, 24],
    min: [0, 7, 10, 15, 19, 24],
    dim: [0, 6, 10, 15, 18, 24],
  },
  maj7: {
    maj: [0, 7, 11, 16, 19, 24],
    min: [0, 7, 11, 15, 19, 24],
    dim: [0, 6, 11, 15, 18, 24],
  },
};

// Roots C3–D#3 (MIDI 48–51): below guitar low-E in octave 2, so bumped up; narrower span to stay balanced
const GUITAR_VOICING_COMPACT: QualityVoicing = {
  maj: [0, 4, 7, 12, 16, 19], // R 3 5 R 3 5
  min: [0, 3, 7, 12, 15, 19], // R m3 5 R m3 5
  dim: [0, 3, 6, 12, 15, 18], // same as standard dim
};

const GUITAR_VOICING_7TH_COMPACT: Record<SeventhFlavor, QualityVoicing> = {
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

export function chordToNotes(
  chordName: string,
  seventh?: SeventhFlavor
): string[] {
  const { root, quality } = parseChord(chordName);
  let rootMidi = ROOT_TO_SEMITONE[root] + 36;
  const compact = rootMidi < 40; // C, C#, D, D# fall below guitar low-E string
  if (compact) rootMidi += 12;

  if (seventh) {
    const table = compact
      ? GUITAR_VOICING_7TH_COMPACT
      : GUITAR_VOICING_7TH;
    return table[seventh][quality].map((offset) =>
      midiToNote(rootMidi + offset)
    );
  }

  return (compact ? GUITAR_VOICING_COMPACT : GUITAR_VOICING)[quality].map(
    (offset) => midiToNote(rootMidi + offset)
  );
}

export function display7thChordName(chordName: string, seventh: SeventhFlavor): string {
  const { root, quality } = parseChord(chordName);
  if (quality === "dim") {
    return seventh === "flat7" ? `${root}m7b5` : `${root}dimM7`;
  }
  if (quality === "min") {
    return seventh === "flat7" ? `${chordName}7` : `${chordName}Maj7`;
  }
  return seventh === "flat7" ? `${root}7` : `${root}maj7`;
}

let synth: Tone.PolySynth | null = null;
let reverb: Tone.Reverb | null = null;
const activeChords = new Set<string>();

function ensureSynth(): Tone.PolySynth {
  if (!synth) {
    reverb = new Tone.Reverb({ decay: 1.5, wet: 0.3 }).toDestination();
    synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.002, decay: 0.8, sustain: 0.4, release: 1.2 },
    });
    synth.maxPolyphony = 18;
    synth.connect(reverb);
  }
  return synth;
}

function activeChordKey(chordName: string, seventh?: SeventhFlavor): string {
  return chordName + ":" + (seventh ?? "tri");
}

export function triggerAttackChord(
  chordName: string,
  seventh?: SeventhFlavor
): void {
  const notes = chordToNotes(chordName, seventh);
  const s = ensureSynth();
  const key = activeChordKey(chordName, seventh);

  if (activeChords.has(key)) {
    s.triggerRelease(notes);
  }

  activeChords.add(key);
  const now = Tone.now();
  notes.forEach((note, i) => {
    s.triggerAttack(note, now + i * STRUM_DELAY_S, STRUM_VELOCITIES[i]);
  });
}

export function triggerReleaseChord(
  chordName: string,
  seventh?: SeventhFlavor
): void {
  const notes = chordToNotes(chordName, seventh);
  const key = activeChordKey(chordName, seventh);
  activeChords.delete(key);
  ensureSynth().triggerRelease(notes);
}
