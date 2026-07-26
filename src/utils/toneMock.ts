/**
 * Shared Tone.js stub for audio tests.
 *
 * Recorded state lives on globalThis because the engine tests call
 * vi.resetModules() to get a fresh chords.ts between cases. Without that,
 * the re-imported module would record into a second copy of this module's
 * state and the assertions would read an empty log.
 */
export interface Attack {
  engine: "synth" | "piano";
  notes: string[];
  velocity?: number;
  time?: number;
}

export interface Release {
  notes: string[];
  time?: number;
}

export interface ToneMockState {
  sounding: Map<string, number>;
  attacks: Attack[];
  releases: Release[];
  hooks: { onload?: () => void; onerror?: (error: Error) => void };
  samplerCount: number;
  startCalls: number;
}

const container = globalThis as unknown as { __toneMock?: ToneMockState };

export const state: ToneMockState = (container.__toneMock ??= {
  sounding: new Map<string, number>(),
  attacks: [],
  releases: [],
  hooks: {},
  samplerCount: 0,
  startCalls: 0,
});

export function resetToneMock(): void {
  state.sounding.clear();
  state.attacks.length = 0;
  state.releases.length = 0;
  state.hooks = {};
  state.samplerCount = 0;
  state.startCalls = 0;
}

export function stuckNotes(): string[] {
  return [...state.sounding.entries()]
    .filter(([, count]) => count > 0)
    .map(([note]) => note);
}

export function createToneMock() {
  class Node {
    connect() {
      return this;
    }
    toDestination() {
      return this;
    }
  }
  class Volume extends Node {
    volume = { value: 0 };
  }
  const asList = (notes: string | string[]) => (Array.isArray(notes) ? notes : [notes]);
  class Instrument extends Node {
    engine: "synth" | "piano" = "synth";
    triggerAttack(notes: string | string[], time?: number, velocity?: number) {
      const list = asList(notes);
      state.attacks.push({ engine: this.engine, notes: list, velocity, time });
      list.forEach((note) => state.sounding.set(note, (state.sounding.get(note) ?? 0) + 1));
    }
    triggerRelease(notes: string | string[], time?: number) {
      const list = asList(notes);
      state.releases.push({ notes: list, time });
      list.forEach((note) => {
        const count = state.sounding.get(note) ?? 0;
        if (count > 0) state.sounding.set(note, count - 1);
      });
    }
    releaseAll() {
      state.sounding.clear();
    }
  }
  class PolySynth extends Instrument {
    maxPolyphony = 0;
  }
  class Sampler extends Instrument {
    constructor(options: { onload?: () => void; onerror?: (error: Error) => void }) {
      super();
      this.engine = "piano";
      state.samplerCount += 1;
      state.hooks.onload = options.onload;
      state.hooks.onerror = options.onerror;
    }
  }
  return {
    PolySynth,
    Sampler,
    Synth: class {},
    Limiter: Node,
    Reverb: Node,
    Volume,
    now: () => 0,
    start: () => {
      state.startCalls += 1;
      return Promise.resolve();
    },
  };
}
