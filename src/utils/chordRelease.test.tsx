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

vi.mock("tone", async () => (await import("./toneMock")).createToneMock());

import { state, resetToneMock, stuckNotes } from "./toneMock";

const attacks = state.attacks;
const releases = state.releases;

import { triggerAttackChord, triggerReleaseChord, releaseAllChords } from "./chords";
import { useChordKeyboardInput } from "./useChordKeyboardInput";
import { usePlayProgression } from "./usePlayProgression";
import TableContent from "src/components/TableContent";
import { Mode } from "src/utils/types";


const makeMode = (name: string, chords: string[]): Mode => ({
  name,
  intervals: [],
  romanNumerals: chords.map(() => ""),
  chords,
});

const ionian = makeMode("ionian", ["C", "Dm", "Em", "F", "G", "Am", "Bdim"]);

beforeEach(resetToneMock);
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


describe("a chord is humanized, not strummed", () => {
  // Mirrors ATTACK_VELOCITY, HUMANIZE_VELOCITY_SPREAD and
  // HUMANIZE_MAX_DELAY_S in chords.ts. The mock's Tone.now() is 0, so the
  // attack window starts at 0.
  const VELOCITY_MIN = 0.64;
  const VELOCITY_MAX = 0.76;
  const MAX_DELAY = 0.012;

  it("attacks each note on its own, one attack per note", () => {
    const handle = triggerAttackChord("C");

    expect(handle.notes).toHaveLength(5);
    expect(attacks).toHaveLength(5);
    expect(attacks.flatMap((attack) => attack.notes)).toEqual([...handle.notes]);
    triggerReleaseChord(handle);
  });

  it("keeps every velocity inside the humanized band", () => {
    const handle = triggerAttackChord("C");

    attacks.forEach((attack) => {
      expect(attack.velocity).toBeGreaterThanOrEqual(VELOCITY_MIN);
      expect(attack.velocity).toBeLessThanOrEqual(VELOCITY_MAX);
    });
    triggerReleaseChord(handle);
  });

  it("keeps every onset inside the humanized window", () => {
    const handle = triggerAttackChord("C");

    attacks.forEach((attack) => {
      expect(attack.time).toBeGreaterThanOrEqual(0);
      expect(attack.time).toBeLessThanOrEqual(MAX_DELAY);
    });
    expect(handle.attackedThrough).toBe(
      Math.max(...attacks.map((attack) => attack.time))
    );
    triggerReleaseChord(handle);
  });

  it("releases every note it attacked", () => {
    const handle = triggerAttackChord("C");

    triggerReleaseChord(handle);

    expect(stuckNotes()).toEqual([]);
  });

  it("never releases a note before its scheduled attack", () => {
    const handle = triggerAttackChord("C");

    triggerReleaseChord(handle);

    expect(releases).toHaveLength(1);
    expect(releases[0].time).toBeGreaterThanOrEqual(handle.attackedThrough);
    expect(stuckNotes()).toEqual([]);
  });

  it("panic stop never releases a note before its scheduled attack", () => {
    const handle = triggerAttackChord("C");

    releaseAllChords();

    expect(releases).toHaveLength(1);
    expect(releases[0].time).toBeGreaterThanOrEqual(handle.attackedThrough);
    expect(stuckNotes()).toEqual([]);
  });
});