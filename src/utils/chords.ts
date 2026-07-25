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

type QualityIntervals = Record<"maj" | "min" | "dim", number[]>;

// Chord tones as intervals above the root. The voicing picks which octave each
// one sounds in, so these are pitch classes, not a fixed stack.
const TRIAD: QualityIntervals = {
  maj: [0, 4, 7],
  min: [0, 3, 7],
  dim: [0, 3, 6],
};

const TRIAD_7TH: Record<Exclude<ChordFlavor, "sus4" | "sus2">, QualityIntervals> = {
  flat7: {
    maj: [0, 4, 7, 10],
    min: [0, 3, 7, 10],
    dim: [0, 3, 6, 10],
  },
  maj7: {
    maj: [0, 4, 7, 11],
    min: [0, 3, 7, 11],
    dim: [0, 3, 6, 11],
  },
};

const TRIAD_SUS: Record<"sus4" | "sus2", QualityIntervals> = {
  sus4: {
    maj: [0, 5, 7],
    min: [0, 5, 7],
    dim: [0, 5, 6],
  },
  sus2: {
    maj: [0, 2, 7],
    min: [0, 2, 7],
    dim: [0, 2, 6],
  },
};

// A piano hammers every held key at once, so all notes of a chord share one
// attack time and one velocity. The old per-string velocity curve made the
// second note the loudest in the chord, which reads as wrong on a keyboard.
const ATTACK_VELOCITY = 0.7;

// Damper fade. Long enough that release is not a cliff, short enough that
// consecutive progression steps do not overlap audibly at fast BPM. Shared by
// both engines so the fallback does not ring longer than the piano.
const RELEASE_S = 0.3;

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

const mod12 = (n: number) => ((n % 12) + 12) % 12;

// A chord is a bass note plus four upper voices held in a fixed register.
//
// The bass follows the root, so progressions keep their bassline. The upper
// voices are the chord tones that happen to fall inside UPPER_FLOOR..+16, which
// means neighbouring chords share most of their register and move by a few
// semitones instead of teleporting. The old voicing transposed one rigid
// six-note stack, so a chord whose root wrapped to the other end of the octave
// jumped with it — C sounded a tenth above D in the key of C, and the bVI-bVII-I
// cadence in E landed its tonic ten semitones below the chord before it.
//
// BASS_FLOOR + 11 < UPPER_FLOOR, so the bass can never collide with a voice.
const BASS_FLOOR = 36; // C2
const UPPER_FLOOR = 48; // C3
const UPPER_VOICES = 4;

function chordIntervals(
  quality: "maj" | "min" | "dim",
  flavour?: ChordFlavor
): number[] {
  if (flavour === "sus4" || flavour === "sus2") return TRIAD_SUS[flavour][quality];
  if (flavour) return TRIAD_7TH[flavour][quality];
  return TRIAD[quality];
}

export function chordToNotes(
  chordName: string,
  flavour?: ChordFlavor
): string[] {
  const { root, quality } = parseChord(chordName);
  const rootSemitone = NOTE_TO_SEMITONE[root];
  const tones = new Set(
    chordIntervals(quality, flavour).map((i) => mod12(rootSemitone + i))
  );

  const midis = [BASS_FLOOR + rootSemitone];
  for (let midi = UPPER_FLOOR; midis.length <= UPPER_VOICES; midi++) {
    if (tones.has(mod12(midi))) midis.push(midi);
  }
  return midis.map(midiToNote);
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

function installPanicHandlers(): void {
  if (typeof window === "undefined") return;
  window.addEventListener("blur", releaseAllChords);
  window.addEventListener("pagehide", releaseAllChords);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) releaseAllChords();
  });
}

function ensureSynth(): Tone.PolySynth {
  if (!synth) {
    limiter = new Tone.Limiter(-2).toDestination();
    volumeNode = new Tone.Volume(volumeToDb(getStoredVolume())).connect(limiter);
    reverb = new Tone.Reverb({ decay: 1.5, wet: 0.3 }).connect(volumeNode);
    synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.012, decay: 0.8, sustain: 0.4, release: RELEASE_S },
    });
    // ponytail: 64 voices — 6 notes/chord × ~10 overlapping releases at fast strum tempo
    synth.maxPolyphony = 64;
    synth.connect(reverb);
    // A held chord outlives the element/key that started it (focus loss, tab
    // switch, bfcache). Without this the notes sustain until a page reload.
    installPanicHandlers();
  }
  return synth;
}

/**
 * Receipt for one sounding chord. Release takes this instead of a chord name so
 * the notes released are always the notes attacked, even if the key, mode or
 * flavour the caller renders has changed in between.
 */
export interface ChordHandle {
  readonly notes: readonly string[];
}

const sounding = new Set<ChordHandle>();

export function triggerAttackChord(
  chordName: string,
  flavour?: ChordFlavor
): ChordHandle {
  const s = ensureSynth();
  const notes = chordToNotes(chordName, flavour);
  s.triggerAttack(notes, Tone.now(), ATTACK_VELOCITY);
  const handle: ChordHandle = { notes };
  sounding.add(handle);
  return handle;
}

/** Idempotent: releasing an unknown or already-released handle is a no-op. */
export function triggerReleaseChord(handle: ChordHandle | null | undefined): void {
  if (!handle || !sounding.delete(handle)) return;
  const s = ensureSynth();
  s.triggerRelease(handle.notes as string[], Tone.now());
}

export function releaseAllChords(): void {
  sounding.clear();
  synth?.releaseAll();
}
