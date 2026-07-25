// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

vi.mock("tone", async () => (await import("./toneMock")).createToneMock());

import { state, resetToneMock, stuckNotes } from "./toneMock";

const releases = state.releases;

import {
  triggerAttackChord,
  triggerReleaseChord,
  releaseAllChords,
  setSustain,
  dampChord,
} from "./chords";

beforeEach(() => {
  resetToneMock();
  // The pedal is module state in chords.ts and outlives a single case.
  setSustain(false);
});
afterEach(cleanup);

describe("the pedal decides when a chord stops, not the key", () => {
  it("a chord let go with the pedal down keeps ringing", () => {
    setSustain(true);

    triggerReleaseChord(triggerAttackChord("C"));

    expect(stuckNotes().length).toBeGreaterThan(0);
  });

  it("lifting the pedal damps everything it was holding", () => {
    setSustain(true);
    triggerReleaseChord(triggerAttackChord("C"));
    triggerReleaseChord(triggerAttackChord("F"));

    setSustain(false);

    expect(stuckNotes()).toEqual([]);
  });

  it("lifting the pedal leaves a chord whose key is still down ringing", () => {
    setSustain(true);
    const stillHeld = triggerAttackChord("C");

    setSustain(false);

    expect(stuckNotes().length).toBeGreaterThan(0);
    triggerReleaseChord(stillHeld);
    expect(stuckNotes()).toEqual([]);
  });

  it("dampChord ignores the pedal", () => {
    setSustain(true);

    dampChord(triggerAttackChord("C"));

    expect(stuckNotes()).toEqual([]);
  });

  it("dampChord on an already sustained chord is not a second release", () => {
    setSustain(true);
    const handle = triggerAttackChord("C");
    triggerReleaseChord(handle);
    releases.length = 0;

    dampChord(handle);
    dampChord(handle);

    expect(releases).toHaveLength(1);
  });

  it("panic stop clears the chords the pedal is holding", () => {
    setSustain(true);
    triggerReleaseChord(triggerAttackChord("C"));

    releaseAllChords();

    expect(stuckNotes()).toEqual([]);
  });
});

describe("a pitch is only ever held once", () => {
  it("re-striking a sustained chord damps the copy already ringing", () => {
    setSustain(true);
    triggerReleaseChord(triggerAttackChord("C"));
    releases.length = 0;

    triggerAttackChord("C");

    expect(releases).toHaveLength(1);
  });

  it("leaves a sustained chord alone when the new chord shares no note", () => {
    setSustain(true);
    // C is C/E/G, D is D/F#/A. No shared pitch class, so no shared note.
    triggerReleaseChord(triggerAttackChord("C"));
    releases.length = 0;

    triggerAttackChord("D");

    expect(releases).toHaveLength(0);
  });

  it("does not damp a chord whose key is still down", () => {
    setSustain(true);
    triggerAttackChord("C");
    releases.length = 0;

    triggerAttackChord("C");

    expect(releases).toHaveLength(0);
  });
});
