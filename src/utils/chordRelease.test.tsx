// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
} from "@testing-library/react";

const sounding = new Map<string, number>();
const attacks: { engine: "synth" | "piano"; notes: string[]; velocity?: number }[] = [];

vi.mock("tone", () => {
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
  class PolySynth extends Node {
    maxPolyphony = 0;
    triggerAttack(notes: string | string[], _time?: number, velocity?: number) {
      const list = asList(notes);
      attacks.push({ engine: "synth", notes: list, velocity });
      list.forEach((note) => sounding.set(note, (sounding.get(note) ?? 0) + 1));
    }
    triggerRelease(notes: string | string[]) {
      asList(notes).forEach((note) => {
        const count = sounding.get(note) ?? 0;
        if (count > 0) sounding.set(note, count - 1);
      });
    }
    releaseAll() {
      sounding.clear();
    }
  }
  return {
    PolySynth,
    Synth: class {},
    Limiter: Node,
    Reverb: Node,
    Volume,
    now: () => 0,
  };
});

import { triggerAttackChord, triggerReleaseChord } from "./chords";
import { useChordKeyboardInput } from "./useChordKeyboardInput";
import { usePlayProgression } from "./usePlayProgression";
import TableContent from "src/components/TableContent";
import { Mode } from "src/utils/types";

const stuckNotes = () =>
  [...sounding.entries()].filter(([, count]) => count > 0).map(([note]) => note);

const makeMode = (name: string, chords: string[]): Mode => ({
  name,
  intervals: [],
  romanNumerals: chords.map(() => ""),
  chords,
});

const ionian = makeMode("ionian", ["C", "Dm", "Em", "F", "G", "Am", "Bdim"]);

beforeEach(() => {
  sounding.clear();
  attacks.length = 0;
});
afterEach(cleanup);

describe("no note survives the interaction that started it", () => {
  it("keyboard: chord key held while the selected key changes", () => {
    const { rerender } = renderHook(
      ({ scale }) => useChordKeyboardInput(scale, ["ionian"], false),
      { initialProps: { scale: "C" } }
    );

    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "q" }));
    });
    expect(stuckNotes().length).toBeGreaterThan(0);

    rerender({ scale: "D" });
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keyup", { key: "q" }));
    });

    expect(stuckNotes()).toEqual([]);
  });

  it("keyboard: chord key held while a flavour modifier is pressed", () => {
    renderHook(() => useChordKeyboardInput("C", ["ionian"], false));

    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "q" }));
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "," }));
      document.dispatchEvent(new KeyboardEvent("keyup", { key: "q" }));
      document.dispatchEvent(new KeyboardEvent("keyup", { key: "," }));
    });

    expect(stuckNotes()).toEqual([]);
  });

  it("keyboard: two keys mapping to the same chord released one at a time", () => {
    renderHook(() =>
      useChordKeyboardInput("C", ["ionian", "dorian"], false)
    );

    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "w" }));
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
      document.dispatchEvent(new KeyboardEvent("keyup", { key: "w" }));
      document.dispatchEvent(new KeyboardEvent("keyup", { key: "a" }));
    });

    expect(stuckNotes()).toEqual([]);
  });

  it("keyboard: window loses focus while a chord key is held", () => {
    renderHook(() => useChordKeyboardInput("C", ["ionian"], false));

    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "q" }));
    });
    act(() => {
      window.dispatchEvent(new Event("blur"));
    });

    expect(stuckNotes()).toEqual([]);
  });

  it("mouse: chord held while the active flavour changes", () => {
    const props = {
      index: 0,
      mode: ionian,
      activeRowIndex: 0,
      keyboardPressedChords: [],
    };
    const { rerender, getAllByText } = render(
      <table>
        <TableContent {...props} />
      </table>
    );

    fireEvent.mouseDown(getAllByText("C")[0].closest("td")!);
    expect(stuckNotes().length).toBeGreaterThan(0);

    rerender(
      <table>
        <TableContent {...props} activeFlavour="flat7" />
      </table>
    );
    fireEvent.mouseUp(getAllByText("C7")[0].closest("td")!);

    expect(stuckNotes()).toEqual([]);
  });

  it("mouse: chord held while the mode's chords change", () => {
    const props = {
      index: 0,
      mode: ionian,
      activeRowIndex: 0,
      keyboardPressedChords: [],
    };
    const { rerender, getAllByText } = render(
      <table>
        <TableContent {...props} />
      </table>
    );

    fireEvent.mouseDown(getAllByText("C")[0].closest("td")!);
    rerender(
      <table>
        <TableContent
          {...props}
          mode={makeMode("ionian", ["D", "Em", "F♯m", "G", "A", "Bm", "C♯dim"])}
        />
      </table>
    );
    fireEvent.mouseUp(getAllByText("D")[0].closest("td")!);

    expect(stuckNotes()).toEqual([]);
  });

  it("progression: playback stopped by unmount mid-chord", async () => {
    const { result, unmount } = renderHook(() => usePlayProgression());

    await act(async () => {
      result.current.handlePlayProgression(
        {
          id: "test",
          name: "test",
          bpm: 20,
          steps: [{ mode: "ionian", degreeIndex: 0 }],
          songs: [],
        },
        [ionian]
      );
      await Promise.resolve();
    });
    expect(stuckNotes().length).toBeGreaterThan(0);

    unmount();
    expect(stuckNotes()).toEqual([]);
  });
});


describe("a chord is struck like a keyboard, not strummed like a guitar", () => {
  it("attacks every note in one call at a single velocity", () => {
    const handle = triggerAttackChord("C");

    expect(attacks).toHaveLength(1);
    expect(attacks[0].notes).toEqual([...handle.notes]);
    expect(attacks[0].velocity).toBe(0.7);

    triggerReleaseChord(handle);
    expect(stuckNotes()).toEqual([]);
  });
});