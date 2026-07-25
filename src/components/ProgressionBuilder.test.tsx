// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "src/i18n";
import ProgressionBuilder from "./ProgressionBuilder";
import { Mode } from "src/utils/types";

vi.mock("src/utils/chords", () => ({
  triggerAttackChord: vi.fn(),
  triggerReleaseChord: vi.fn(),
}));

const modes: Mode[] = [
  {
    name: "ionian",
    romanNumerals: ["I", "ii", "iii", "IV", "V", "vi", "vii°"],
  } as Mode,
  {
    name: "dorian",
    romanNumerals: ["i", "ii", "♭III", "IV", "v", "vi°", "♭VII"],
  } as Mode,
];

let written: string[] = [];

beforeEach(() => {
  written = [];
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: (s: string) => { written.push(s); return Promise.resolve(); } },
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function openBuilder() {
  render(
    <ProgressionBuilder
      modes={modes}
      selectedScale="C"
      preferSharp={false}
      onPlay={vi.fn()}
      activeProgressionId={null}
    />
  );
  fireEvent.click(screen.getByText(/Build Your Own Progression/));
}

describe("ProgressionBuilder embed preview", () => {
  it("previews the exact snippet the copy button writes to the clipboard", () => {
    openBuilder();

    fireEvent.click(screen.getByText("Preview embed"));
    const frame = screen.getByTitle("Embed preview") as HTMLIFrameElement;
    const previewed = frame.srcdoc;

    fireEvent.click(screen.getByText("Copy embed code"));
    expect(written).toHaveLength(1);

    expect(previewed).toContain(written[0]);
  });

  it("does not follow later edits until the preview is refreshed", () => {
    openBuilder();

    fireEvent.click(screen.getByText("Preview embed"));
    const before = (screen.getByTitle("Embed preview") as HTMLIFrameElement).srcdoc;

    fireEvent.change(screen.getByDisplayValue("120"), { target: { value: "90" } });
    const stillBefore = (screen.getByTitle("Embed preview") as HTMLIFrameElement).srcdoc;
    expect(stillBefore).toBe(before);

    fireEvent.click(screen.getByText("Refresh preview"));
    const after = (screen.getByTitle("Embed preview") as HTMLIFrameElement).srcdoc;
    expect(after).not.toBe(before);
    expect(after).toContain("bpm=90");
  });
});

describe("ProgressionBuilder degree numerals", () => {
  it("shows the selected step's own mode numerals, not the first mode's", () => {
    openBuilder();

    const degreeSelect = document.querySelector(
      ".builder-degree-select"
    ) as HTMLSelectElement;
    const modeSelect = document.querySelector(
      ".builder-mode-select"
    ) as HTMLSelectElement;

    const ionianLabels = Array.from(degreeSelect.options).map((o) => o.textContent);
    expect(ionianLabels).toEqual(["I", "ii", "iii", "IV", "V", "vi", "vii°"]);

    fireEvent.change(modeSelect, { target: { value: "dorian" } });

    const dorianLabels = Array.from(degreeSelect.options).map((o) => o.textContent);
    expect(dorianLabels).toEqual(["i", "ii", "♭III", "IV", "v", "vi°", "♭VII"]);
  });
});
