// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import TableContent from "./TableContent";
import { triggerAttackChord, triggerReleaseChord } from "src/utils/chords";
import { Mode } from "src/utils/types";

vi.mock("src/utils/chords", () => ({
  triggerAttackChord: vi.fn(() => ({})),
  triggerReleaseChord: vi.fn(),
  display7thChordName: vi.fn(),
  displaySusChordName: vi.fn(),
}));

const mode: Mode = {
  name: "ionian",
  intervals: [],
  romanNumerals: ["I", "ii", "iii", "IV", "V", "vi", "vii°"],
  chords: ["C", "Dm", "Em", "F", "G", "Am", "Bdim"],
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Chord Cell Gesture", () => {
  it("attacks and releases once when a touch is followed by compatibility mouse events", () => {
    render(
      <table>
        <TableContent
          mode={mode}
          index={0}
          activeRowIndex={0}
          keyboardPressedChords={[]}
        />
      </table>
    );
    const cell = screen.getByText("C").closest("td") as HTMLTableCellElement;

    fireEvent.pointerDown(cell, { pointerType: "touch", pointerId: 1 });
    fireEvent.touchStart(cell);
    fireEvent.pointerUp(cell, { pointerType: "touch", pointerId: 1 });
    fireEvent.touchEnd(cell);
    fireEvent.mouseDown(cell);
    fireEvent.mouseUp(cell);

    expect(triggerAttackChord).toHaveBeenCalledTimes(1);
    expect(triggerReleaseChord).toHaveBeenCalledTimes(1);
  });

  it("releases the chord when a touch gesture is cancelled", () => {
    render(
      <table>
        <TableContent
          mode={mode}
          index={0}
          activeRowIndex={0}
          keyboardPressedChords={[]}
        />
      </table>
    );
    const cell = screen.getByText("C").closest("td") as HTMLTableCellElement;

    fireEvent.pointerDown(cell, { pointerType: "touch", pointerId: 1 });
    fireEvent.pointerCancel(cell, { pointerType: "touch", pointerId: 1 });

    expect(triggerReleaseChord).toHaveBeenCalledTimes(1);
  });

  it("releases a mouse-held chord when the pointer leaves its cell", () => {
    render(
      <table>
        <TableContent
          mode={mode}
          index={0}
          activeRowIndex={0}
          keyboardPressedChords={[]}
        />
      </table>
    );
    const cell = screen.getByText("C").closest("td") as HTMLTableCellElement;

    fireEvent.pointerDown(cell, { pointerType: "mouse", pointerId: 1 });
    fireEvent.pointerLeave(cell, { pointerType: "mouse", pointerId: 1 });

    expect(triggerReleaseChord).toHaveBeenCalledTimes(1);
  });
});
