// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";

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
import { useChordKeyboardInput } from "./useChordKeyboardInput";
import { usePlayProgression } from "./usePlayProgression";
import { useSustainPedal } from "./useSustainPedal";
import { Mode } from "src/utils/types";

const makeMode = (name: string, chords: string[]): Mode => ({
  name,
  intervals: [],
  romanNumerals: chords.map(() => ""),
  chords,
});

const ionian = makeMode("ionian", ["C", "Dm", "Em", "F", "G", "Am", "Bdim"]);

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

  it("does not damp a chord whose key is still down", () => {
    setSustain(true);
    triggerAttackChord("C");
    releases.length = 0;

    triggerAttackChord("C");

    expect(releases).toHaveLength(0);
  });
});

describe("changing to a different chord clears whatever was sustained", () => {
  it("a genuinely different chord damps a sustained chord even with no shared note", () => {
    setSustain(true);
    // C is C/E/G, D is D/F#/A. No shared pitch class, so no shared note —
    // this used to leave C ringing (decision 3's original scope). A real
    // chord change now always replaces whatever was sustained.
    triggerReleaseChord(triggerAttackChord("C"));
    releases.length = 0;

    triggerAttackChord("D");

    expect(releases).toHaveLength(1);
  });
});

describe("a voicing correction is not a musician letting go", () => {
  it("a flavour modifier under the pedal damps the old voicing", () => {
    renderHook(() => useChordKeyboardInput("C", ["ionian"], false));
    setSustain(true);
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "q" }));
    });
    releases.length = 0;

    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "," }));
    });

    expect(releases).toHaveLength(1);
  });

  it("a flavour modifier on one held chord leaves an unrelated sustained chord ringing", () => {
    setSustain(true);
    const cHandle = triggerAttackChord("C");
    triggerReleaseChord(cHandle); // C is now sustained, unrelated to Dm below.

    renderHook(() => useChordKeyboardInput("C", ["ionian"], false));
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "w" })); // hold Dm
    });
    releases.length = 0;

    act(() => {
      // Revoice Dm -> Dm(maj7), which adds C#, not C — no accidental
      // collision with the sustained C major's own root. A voicing
      // correction, not a chord change, so it must not touch the
      // unrelated sustained C either way.
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "." }));
    });

    expect(releases).toHaveLength(1);
    expect(releases[0].notes).not.toEqual(
      expect.arrayContaining(cHandle.notes as string[])
    );
  });

  it("unmounting under the pedal leaves nothing ringing", () => {
    const { unmount } = renderHook(() =>
      useChordKeyboardInput("C", ["ionian"], false)
    );
    setSustain(true);
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "q" }));
    });

    act(() => { unmount(); });

    expect(stuckNotes()).toEqual([]);
  });

  it("a chord key going up under the pedal still sustains", () => {
    renderHook(() => useChordKeyboardInput("C", ["ionian"], false));
    setSustain(true);

    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "q" }));
      document.dispatchEvent(new KeyboardEvent("keyup", { key: "q" }));
    });

    expect(stuckNotes().length).toBeGreaterThan(0);
  });
});

describe("authored playback ignores the pedal", () => {
  it("each step is damped at its own step boundary", async () => {
    const { result } = renderHook(() => usePlayProgression());
    setSustain(true);

    // 6000 bpm makes a one-bar step 40 ms, and the loop's 80 ms pre-roll
    // subtraction makes the delay resolve on the next tick.
    await act(async () => {
      await result.current.handlePlayProgression(
        {
          id: "test",
          name: "test",
          bpm: 6000,
          steps: [
            { mode: "ionian", degreeIndex: 0 },
            { mode: "ionian", degreeIndex: 3 },
          ],
          songs: [],
        },
        [ionian]
      );
    });

    expect(stuckNotes()).toEqual([]);
  });
});
describe("Space is the pedal, except where Space already means something", () => {
  const pressSpace = (target?: HTMLElement) =>
    act(() => {
      (target ?? document.body).dispatchEvent(
        new KeyboardEvent("keydown", {
          code: "Space",
          bubbles: true,
          cancelable: true,
        })
      );
    });

  it("Space toggles the pedal", () => {
    const { result } = renderHook(() => useSustainPedal());

    pressSpace();
    expect(result.current.sustainOn).toBe(true);

    pressSpace();
    expect(result.current.sustainOn).toBe(false);
  });

  it("a raised pedal actually sustains", () => {
    renderHook(() => useSustainPedal());

    pressSpace();
    triggerReleaseChord(triggerAttackChord("C"));

    expect(stuckNotes().length).toBeGreaterThan(0);
  });

  it("ignores Space while a text input is focused", () => {
    const { result } = renderHook(() => useSustainPedal());
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    pressSpace(input);

    expect(result.current.sustainOn).toBe(false);
    document.body.removeChild(input);
  });

  it("ignores Space while a button is focused, so the button still works", () => {
    const { result } = renderHook(() => useSustainPedal());
    const button = document.createElement("button");
    document.body.appendChild(button);
    button.focus();

    pressSpace(button);

    expect(result.current.sustainOn).toBe(false);
    document.body.removeChild(button);
  });

  it("ignores auto-repeat, so holding Space does not chatter the pedal", () => {
    const { result } = renderHook(() => useSustainPedal());

    pressSpace();
    act(() => {
      document.body.dispatchEvent(
        new KeyboardEvent("keydown", {
          code: "Space",
          repeat: true,
          bubbles: true,
          cancelable: true,
        })
      );
    });

    expect(result.current.sustainOn).toBe(true);
  });

  it("lowers the pedal on unmount", () => {
    const { unmount } = renderHook(() => useSustainPedal());
    pressSpace();
    triggerReleaseChord(triggerAttackChord("C"));

    unmount();

    expect(stuckNotes()).toEqual([]);
  });
});
