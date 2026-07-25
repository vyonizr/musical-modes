import { describe, it, expect } from "vitest";
import orderActiveModes from "./orderActiveModes";
import { Mode } from "./types";

const makeMode = (name: string): Mode => ({
  name,
  intervals: [],
  romanNumerals: [],
  chords: [],
});

const ALL_MODES: Mode[] = [
  "ionian",
  "dorian",
  "phrygian",
  "lydian",
  "mixolydian",
  "aeolian",
  "locrian",
].map(makeMode);

describe("orderActiveModes", () => {
  it("returns modes in activeModes order, not diatonic order", () => {
    const result = orderActiveModes(ALL_MODES, ["ionian", "aeolian", "dorian"]);
    expect(result.map((m) => m.name)).toEqual(["ionian", "aeolian", "dorian"]);
  });

  it("puts a re-enabled mode at the end", () => {
    const result = orderActiveModes(ALL_MODES, ["dorian", "aeolian", "ionian"]);
    expect(result.map((m) => m.name)).toEqual(["dorian", "aeolian", "ionian"]);
  });

  it("drops names with no matching mode", () => {
    const result = orderActiveModes(ALL_MODES, ["ionian", "bogus", "dorian"]);
    expect(result.map((m) => m.name)).toEqual(["ionian", "dorian"]);
  });

  it("returns an empty array when nothing is active", () => {
    expect(orderActiveModes(ALL_MODES, [])).toEqual([]);
  });

  it("returns the same Mode objects, not copies", () => {
    const result = orderActiveModes(ALL_MODES, ["dorian"]);
    expect(result[0]).toBe(ALL_MODES[1]);
  });
});
