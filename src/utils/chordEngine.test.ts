// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("tone", async () => (await import("./toneMock")).createToneMock());

import { state, resetToneMock, stuckNotes } from "./toneMock";

let chords: typeof import("./chords");

const engines = () => state.attacks.map((attack) => attack.engine);
const samplesLoad = () => state.hooks.onload?.();
const samplesFail = () => state.hooks.onerror?.(new Error("404"));

beforeEach(async () => {
  // chords.ts caches its engines in module scope, so each case needs a fresh
  // copy to start from "no samples loaded".
  vi.resetModules();
  resetToneMock();
  chords = await import("./chords");
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
