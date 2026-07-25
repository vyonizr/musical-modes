// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "src/i18n";
import EmbedWidget from "./EmbedWidget";

// chords.ts builds Tone.js audio nodes. The widget only needs the chord-name
// helpers to render its table, so stub the module the same way
// ProgressionBuilder.test.tsx does. The two display helpers must be included
// or TableContent throws on import.
vi.mock("src/utils/chords", () => ({
  triggerAttackChord: vi.fn(),
  triggerReleaseChord: vi.fn(),
  display7thChordName: (chordName: string) => chordName,
  displaySusChordName: (chordName: string) => chordName,
}));

afterEach(() => {
  cleanup();
});

// EmbedWidget reads location.search directly, so each test drives it by
// rewriting the jsdom URL before rendering.
function renderAt(search: string) {
  window.history.replaceState({}, "", search);
  render(<EmbedWidget />);
}

describe("EmbedWidget header name", () => {
  it("credits the tool instead of calling a user-built progression 'custom'", () => {
    renderAt("/?embed=1&key=C&steps=ionian:0,aeolian:2");
    expect(screen.getByText("Made with Musical Modes")).toBeDefined();
    expect(screen.queryByText(/Custom progression/)).toBeNull();
  });

  it("keeps a preset's own name", () => {
    renderAt("/?embed=1&key=C&progression=mario-cadence");
    expect(screen.getByText("Mario Cadence")).toBeDefined();
    expect(screen.queryByText("Made with Musical Modes")).toBeNull();
  });
});
