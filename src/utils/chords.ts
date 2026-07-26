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

// A hand cannot strike five keys in the same microsecond, or at the same
// force. Both offsets are drawn per note, per attack, so no note is
// systematically first and none is systematically loudest. That systematic
// part is what made the old fixed strum read as a guitar rather than a piano.
//
// 12 ms is under the threshold where a chord stops reading as a single event
// and starts reading as rolled. 0.06 is roughly 8 steps of 127 in MIDI terms:
// audible as touch, never as a wrong note. The resulting 0.64..0.76 cannot
// leave the legal 0..1 velocity range, so no clamp is needed. Add one if
// either constant is ever widened.
const HUMANIZE_MAX_DELAY_S = 0.012;
const HUMANIZE_VELOCITY_SPREAD = 0.06;

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
let piano: Tone.Sampler | null = null;
let pianoState: "idle" | "loading" | "ready" | "failed" = "idle";
let reverb: Tone.Reverb | null = null;
let limiter: Tone.Limiter | null = null;
let volumeNode: Tone.Volume | null = null;
let audioUnlocked = false;

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
// Sampled in minor thirds, C2 to D#4. chordToNotes spans C2-E4, so this covers
// the range with at most two semitones of repitch. Tone.Sampler fills the gaps.
const PIANO_SAMPLES: Record<string, string> = {
  C2: "C2.mp3",
  "D#2": "Ds2.mp3",
  "F#2": "Fs2.mp3",
  A2: "A2.mp3",
  C3: "C3.mp3",
  "D#3": "Ds3.mp3",
  "F#3": "Fs3.mp3",
  A3: "A3.mp3",
  C4: "C4.mp3",
  "D#4": "Ds4.mp3",
};

function ensureOutput(): Tone.Reverb {
  if (!reverb) {
    limiter = new Tone.Limiter(-2).toDestination();
    volumeNode = new Tone.Volume(volumeToDb(getStoredVolume())).connect(limiter);
    reverb = new Tone.Reverb({ decay: 1.5, wet: 0.3 }).connect(volumeNode);
    // A held chord outlives the element/key that started it (focus loss, tab
    // switch, bfcache). Without this the notes sustain until a page reload.
    installPanicHandlers();
  }
  return reverb;
}

function ensureSynth(): Tone.PolySynth {
  if (!synth) {
    synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.012, decay: 0.8, sustain: 0.4, release: RELEASE_S },
    });
    // ponytail: 64 voices — 6 notes/chord × ~10 overlapping releases at fast strum tempo
    synth.maxPolyphony = 64;
    synth.connect(ensureOutput());
  }
  return synth;
}

/**
 * Returns the piano only once its samples are loaded, and starts that load on
 * the first call. Null means "not ready" — callers fall back to the synth
 * rather than waiting, because a chord must always sound immediately.
 *
 * A failed load is terminal for the session: retrying on every keypress would
 * hammer a dead origin for no gain.
 */
function ensurePiano(): Tone.Sampler | null {
  if (pianoState === "failed") return null;
  if (!piano) {
    pianoState = "loading";
    piano = new Tone.Sampler({
      urls: PIANO_SAMPLES,
      baseUrl: "/audio/piano/",
      release: RELEASE_S,
      onload: () => {
        pianoState = "ready";
      },
      onerror: () => {
        pianoState = "failed";
      },
    });
    piano.connect(ensureOutput());
  }
  return pianoState === "ready" ? piano : null;
}

/**
 * Resumes the AudioContext on the first user gesture.
 *
 * Before preloading existed the context was always created inside a gesture,
 * so browsers started it `running` and nothing had to resume it. Preloading
 * builds the graph at page load instead, which browsers create `suspended`, so
 * without this every chord would be silent.
 *
 * Capture phase, so it runs ahead of the React handlers that attack chords.
 */
function unlockAudio(): void {
  if (audioUnlocked || typeof window === "undefined") return;
  audioUnlocked = true;
  const unlock = () => {
    void Tone.start();
    document.removeEventListener("pointerdown", unlock, true);
    document.removeEventListener("keydown", unlock, true);
  };
  document.addEventListener("pointerdown", unlock, true);
  document.addEventListener("keydown", unlock, true);
}

/**
 * Starts the sample download before any chord is played, so the first chord of
 * a session is already the piano instead of the synth fallback.
 *
 * Safe before any user gesture: decoding does not need a running AudioContext,
 * only a created one. Idempotent, because ensurePiano only ever builds one
 * Sampler.
 */
export function preloadPiano(): void {
  unlockAudio();
  ensurePiano();
}

/**
 * Receipt for one sounding chord. Release takes this instead of a chord name so
 * the notes released are always the notes attacked, even if the key, mode or
 * flavour the caller renders has changed in between.
 *
 * The engine is recorded for the same reason. A chord can be held while the
 * samples finish loading; resolving "the current engine" at release time would
 * tell the piano to release notes the synth is holding, and the synth would
 * ring until a page reload.
 */
export interface ChordHandle {
  readonly notes: readonly string[];
  readonly engine: Tone.PolySynth | Tone.Sampler;
  /**
   * Latest scheduled attack time in this chord. Humanized notes are scheduled
   * up to HUMANIZE_MAX_DELAY_S ahead of now, so a release issued at Tone.now()
   * inside that window would land before a note has sounded and leave it
   * ringing until a page reload. Every release clamps to at least this time.
   */
  readonly attackedThrough: number;
}

const sounding = new Set<ChordHandle>();

// Chords whose key has been let go while the pedal was down. They are still
// ringing; only lifting the pedal, a colliding attack, or a panic stop damps
// them.
const sustained = new Set<ChordHandle>();

let pedalDown = false;

// The one place a chord actually stops. Clamping to attackedThrough is why:
// a release issued inside the humanize window would otherwise land before a
// note has sounded and leave it ringing until a page reload.
function dampHandle(handle: ChordHandle, now: number): void {
  handle.engine.triggerRelease(
    handle.notes as string[],
    Math.max(now, handle.attackedThrough)
  );
}

/**
 * Raises or lowers the pedal. Lowering damps every chord the pedal was
 * holding. Chords whose key is still physically down live in `sounding`, not
 * `sustained`, so lowering the pedal does not cut them.
 */
export function setSustain(down: boolean): void {
  pedalDown = down;
  if (down) return;
  const now = Tone.now();
  sustained.forEach((handle) => dampHandle(handle, now));
  sustained.clear();
}

/**
 * Stops a chord regardless of the pedal. For releases that are not the
 * musician letting go: voicing corrections, authored playback, teardown.
 *
 * Idempotent: damping an unknown or already-damped handle is a no-op.
 */
export function dampChord(handle: ChordHandle | null | undefined): void {
  if (!handle) return;
  const wasSounding = sounding.delete(handle);
  const wasSustained = sustained.delete(handle);
  if (!wasSounding && !wasSustained) return;
  dampHandle(handle, Tone.now());
}

export function triggerAttackChord(
  chordName: string,
  flavour?: ChordFlavor,
  // False only for a flavour retrigger of a chord the musician is still
  // holding (src/utils/useChordKeyboardInput.ts's retriggerHeldChords) —
  // that is a voicing correction, not the musician moving to a new chord.
  isChordChange = true
): ChordHandle {
  // Calling ensurePiano first is what kicks off the sample download; until it
  // resolves this returns null and the synth answers immediately.
  const engine = ensurePiano() ?? ensureSynth();
  const notes = chordToNotes(chordName, flavour);

  // A real chord change always replaces whatever was sustained, even a
  // chord sharing no pitch with the new one: the pedal sustains the last
  // thing you played, not a bag of unrelated ringing chords.
  //
  // A voicing correction (isChordChange = false) keeps the narrower
  // pitch-collision sweep instead: a note can only be held once, so
  // re-striking a pitch a sustained chord still owns would leave that
  // chord's handle unable to release it, and the note would ring until a
  // page reload. A real piano re-strikes the same string, so damping the
  // older copy is also what the instrument does. This is what bounds the
  // sustained set in that case: at most one handle per pitch, over the
  // ~17 pitches chordToNotes spans, so no separate voice cap is needed.
  if (sustained.size > 0) {
    const swept = Tone.now();
    sustained.forEach((held) => {
      const collides = held.notes.some((note) => notes.includes(note));
      if (!isChordChange && !collides) return;
      sustained.delete(held);
      dampHandle(held, swept);
    });
  }

  // One base instant for the whole chord, so the offsets stay relative to each
  // other. Every offset is positive, so the chord never starts later than an
  // unhumanized one would.
  const t0 = Tone.now();
  let attackedThrough = t0;
  for (const note of notes) {
    const at = t0 + Math.random() * HUMANIZE_MAX_DELAY_S;
    engine.triggerAttack(
      note,
      at,
      ATTACK_VELOCITY + (Math.random() * 2 - 1) * HUMANIZE_VELOCITY_SPREAD
    );
    if (at > attackedThrough) attackedThrough = at;
  }

  const handle: ChordHandle = { notes, engine, attackedThrough };
  sounding.add(handle);
  return handle;
}

/**
 * The musician letting go of a chord. With the pedal up this damps. With the
 * pedal down the chord keeps ringing and `setSustain(false)` damps it later.
 *
 * Idempotent: releasing an unknown or already-released handle is a no-op.
 */
export function triggerReleaseChord(handle: ChordHandle | null | undefined): void {
  if (!handle || !sounding.delete(handle)) return;
  if (pedalDown) {
    sustained.add(handle);
    return;
  }
  dampHandle(handle, Tone.now());
}

/** Bounded stop, not an instant one: the release envelope still applies, so
 *  audio ends within RELEASE_S rather than immediately. Chords attacked in the
 *  last few milliseconds are released at their own attack time instead of now,
 *  which is why this loops the handles rather than only calling releaseAll:
 *  releaseAll fires at now, and a note scheduled after that would survive it.
 *  The releaseAll calls stay as a backstop for anything not in the set.
 *
 *  The pedal flag is deliberately left alone. Sound stops; the latch stays
 *  where the musician put it, the way a physical pedal stays down. */
export function releaseAllChords(): void {
  const now = Tone.now();
  sounding.forEach((handle) => dampHandle(handle, now));
  sustained.forEach((handle) => dampHandle(handle, now));
  sounding.clear();
  sustained.clear();
  synth?.releaseAll();
  piano?.releaseAll();
}
