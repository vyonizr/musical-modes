// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("tone", async () => (await import("./toneMock")).createToneMock());

import { state, resetToneMock, stuckNotes } from "./toneMock";

let chords: typeof import("./chords");

const engines = () => [...new Set(state.attacks.map((attack) => attack.engine))];
const samplesLoad = () => state.hooks.onload?.();
const samplesFail = () => state.hooks.onerror?.(new Error("404"));

beforeEach(async () => {
  // chords.ts caches its engines in module scope, so each case needs a fresh
  // copy to start from "no samples loaded".
  vi.resetModules();
  resetToneMock();
  chords = await import("./chords");
});

afterEach(() => {
  // unlockAudio's listeners live on the shared jsdom `document` and remove
  // themselves after firing once. A test that calls preloadPiano() but never
  // dispatches a gesture leaves its pair attached, where a later test's own
  // dispatch would fire it too and inflate state.startCalls. Firing both
  // gesture types here guarantees any such pair is gone before the next test.
  document.dispatchEvent(new Event("pointerdown"));
  document.dispatchEvent(new Event("keydown"));
});

describe("the piano is an upgrade that arrives, never a dependency that blocks", () => {
  it("plays on the synth before samples finish loading", () => {
    chords.triggerAttackChord("C");

    expect(engines()).toEqual(["synth"]);
    expect(stuckNotes().length).toBeGreaterThan(0);
  });

  it("plays on the piano once samples are loaded", () => {
    chords.triggerAttackChord("C");
    samplesLoad();
    state.attacks.length = 0;

    chords.triggerAttackChord("F");

    expect(engines()).toEqual(["piano"]);
  });

  it("stays on the synth for the rest of the session when samples fail", () => {
    chords.triggerAttackChord("C");
    samplesFail();
    state.attacks.length = 0;

    chords.triggerAttackChord("F");

    expect(engines()).toEqual(["synth"]);
    expect(stuckNotes().length).toBeGreaterThan(0);
  });
});

describe("no note survives the interaction that started it", () => {
  it("releases on the synth even when samples arrive mid-hold", () => {
    const handle = chords.triggerAttackChord("C");

    samplesLoad();
    chords.triggerReleaseChord(handle);

    expect(stuckNotes()).toEqual([]);
  });

  it("releaseAllChords silences both engines", () => {
    chords.triggerAttackChord("C");
    samplesLoad();
    chords.triggerAttackChord("F");

    chords.releaseAllChords();

    expect(stuckNotes()).toEqual([]);
  });
});

describe("the piano starts loading before the first chord", () => {
  it("starts the sample load without attacking anything", () => {
    chords.preloadPiano();

    expect(state.samplerCount).toBe(1);
    expect(state.attacks).toEqual([]);
  });

  it("plays the very first chord on the piano once the preload finished", () => {
    chords.preloadPiano();
    samplesLoad();

    chords.triggerAttackChord("C");

    expect(engines()).toEqual(["piano"]);
  });

  it("builds one sampler however often it is called", () => {
    chords.preloadPiano();
    chords.preloadPiano();
    chords.triggerAttackChord("C");

    expect(state.samplerCount).toBe(1);
  });

  it("still answers on the synth if the first chord beats the preload", () => {
    chords.preloadPiano();

    chords.triggerAttackChord("C");

    expect(engines()).toEqual(["synth"]);
  });
});

describe("the audio context is resumed by the first gesture", () => {
  it("resumes on the first pointerdown", () => {
    chords.preloadPiano();

    document.dispatchEvent(new Event("pointerdown"));

    expect(state.startCalls).toBe(1);
  });

  it("resumes on the first keydown when that comes first", () => {
    chords.preloadPiano();

    document.dispatchEvent(new Event("keydown"));

    expect(state.startCalls).toBe(1);
  });

  it("resumes once and then stops listening", () => {
    chords.preloadPiano();

    document.dispatchEvent(new Event("pointerdown"));
    document.dispatchEvent(new Event("pointerdown"));
    document.dispatchEvent(new Event("keydown"));

    expect(state.startCalls).toBe(1);
  });

  it("does not resume before any gesture", () => {
    chords.preloadPiano();

    expect(state.startCalls).toBe(0);
  });
});
