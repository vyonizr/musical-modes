// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { act, renderHook, cleanup } from "@testing-library/react";
import { findChordForKey, useChordKeyboardInput } from "./useChordKeyboardInput";
import { Mode } from "src/utils/types";

const makeMode = (name: string, chords: string[]): Mode =>
  ({ name, chords } as Mode);

const activeModes = [makeMode("ionian", ["C", "Dm", "Em", "F", "G", "Am", "Bdim"])];

vi.mock("src/utils/generateModes", () => ({
  default: vi.fn(() => activeModes),
}));

vi.mock("src/utils/chords", () => ({
  triggerAttackChord: vi.fn(),
  triggerReleaseChord: vi.fn(),
}));

import { triggerAttackChord, triggerReleaseChord } from "src/utils/chords";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("findChordForKey", () => {
  const testModes = [
    makeMode("ionian", ["C", "Dm", "Em", "F", "G", "Am", "Bdim"]),
    makeMode("dorian", ["Dm", "Em", "F", "G", "Am", "Bdim", "C"]),
  ];

  it("maps a top-row key to the first mode's chord", () => {
    expect(findChordForKey("Q", testModes)).toBe("C");
    expect(findChordForKey("W", testModes)).toBe("Dm");
  });

  it("maps a second-row key to the second mode's chord", () => {
    expect(findChordForKey("A", testModes)).toBe("Dm");
  });

  it("returns null for keys with no mapping", () => {
    expect(findChordForKey("1", testModes)).toBeNull();
  });

  it("returns null when the row has no active mode at that index", () => {
    expect(findChordForKey("Z", testModes)).toBeNull();
  });
});

describe("useChordKeyboardInput", () => {
  it("attacks a chord on keydown and releases it on keyup", () => {
    const { result } = renderHook(() =>
      useChordKeyboardInput("C", ["ionian"], false)
    );

    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "q" }));
    });
    expect(result.current.keyboardPressedChords).toEqual(["C"]);
    expect(triggerAttackChord).toHaveBeenCalledWith("C", undefined);

    act(() => {
      document.dispatchEvent(new KeyboardEvent("keyup", { key: "q" }));
    });
    expect(result.current.keyboardPressedChords).toEqual([]);
    expect(triggerReleaseChord).toHaveBeenCalledWith("C", undefined);
  });

  it("tracks a held modifier as activeFlavour and retriggers held chords", () => {
    const { result } = renderHook(() =>
      useChordKeyboardInput("C", ["ionian"], false)
    );

    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "q" }));
    });
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "," }));
    });

    expect(result.current.activeFlavour).toBe("flat7");
    expect(triggerReleaseChord).toHaveBeenCalledWith("C", undefined);
    expect(triggerAttackChord).toHaveBeenCalledWith("C", "flat7");

    act(() => {
      document.dispatchEvent(new KeyboardEvent("keyup", { key: "," }));
    });
    expect(result.current.activeFlavour).toBeUndefined();
  });

  it("ignores keydown events targeting a text input", () => {
    const input = document.createElement("input");
    document.body.appendChild(input);

    renderHook(() => useChordKeyboardInput("C", ["ionian"], false));

    act(() => {
      const event = new KeyboardEvent("keydown", { key: "q" });
      Object.defineProperty(event, "target", { value: input });
      document.dispatchEvent(event);
    });

    expect(triggerAttackChord).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });
});
