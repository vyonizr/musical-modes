import { describe, it, expect } from "vitest";
import { encodeSteps, decodeSteps } from "./steps";
import { ProgressionStep } from "./progressions";

describe("encodeSteps / decodeSteps round-trip", () => {
  it("encodes and decodes a basic step list", () => {
    const steps = [
      { mode: "ionian", degreeIndex: 0 },
      { mode: "ionian", degreeIndex: 3 },
      { mode: "aeolian", degreeIndex: 2 },
    ];
    const encoded = encodeSteps(steps);
    expect(encoded).toBe("ionian:0,ionian:3,aeolian:2");
    expect(decodeSteps(encoded)).toEqual(steps);
  });

  it("encodes and decodes steps with flavour", () => {
    const steps: ProgressionStep[] = [
      { mode: "ionian", degreeIndex: 0, flavour: "flat7" },
      { mode: "aeolian", degreeIndex: 6, flavour: "maj7" },
      { mode: "ionian", degreeIndex: 3 },
    ];
    const encoded = encodeSteps(steps);
    expect(encoded).toBe("ionian:0:flat7,aeolian:6:maj7,ionian:3");
    expect(decodeSteps(encoded)).toEqual(steps);
  });

  it("encodes and decodes steps with bars", () => {
    const steps = [
      { mode: "ionian", degreeIndex: 0, bars: 2 },
      { mode: "ionian", degreeIndex: 3 },
      { mode: "aeolian", degreeIndex: 2, bars: 4 },
    ];
    const encoded = encodeSteps(steps);
    expect(encoded).toBe("ionian:0:2,ionian:3,aeolian:2:4");
    expect(decodeSteps(encoded)).toEqual(steps);
  });

  it("encodes and decodes steps with flavour and bars", () => {
    const steps: ProgressionStep[] = [
      { mode: "ionian", degreeIndex: 0, flavour: "flat7", bars: 2 },
      { mode: "aeolian", degreeIndex: 2, flavour: "sus4", bars: 1 },
    ];
    const encoded = encodeSteps(steps);
    expect(encoded).toBe("ionian:0:flat7:2,aeolian:2:sus4");
    const decoded = decodeSteps(encoded);
    expect(decoded[0]).toEqual(steps[0]);
    expect(decoded[1].mode).toBe("aeolian");
    expect(decoded[1].degreeIndex).toBe(2);
    expect(decoded[1].flavour).toBe("sus4");
  });

  it("handles empty string", () => {
    expect(decodeSteps("")).toEqual([]);
  });

  it("handles single step", () => {
    const steps = [{ mode: "dorian", degreeIndex: 2 }];
    const encoded = encodeSteps(steps);
    expect(encoded).toBe("dorian:2");
    expect(decodeSteps(encoded)).toEqual(steps);
  });

  it("handles malformed input gracefully", () => {
    const steps = decodeSteps("garbage");
    expect(steps).toHaveLength(1);
    expect(Number.isFinite(steps[0].degreeIndex)).toBe(false);
  });

  it("handles empty fields", () => {
    const steps = decodeSteps(":0,ionian:");
    expect(steps).toHaveLength(2);
    expect(Number.isFinite(steps[0].degreeIndex)).toBe(false);
    expect(Number.isFinite(steps[1].degreeIndex)).toBe(false);
  });

  it("preserves order", () => {
    const steps = [
      { mode: "ionian", degreeIndex: 0 },
      { mode: "dorian", degreeIndex: 2 },
      { mode: "phrygian", degreeIndex: 4 },
      { mode: "lydian", degreeIndex: 5 },
      { mode: "mixolydian", degreeIndex: 6 },
      { mode: "aeolian", degreeIndex: 1 },
      { mode: "locrian", degreeIndex: 3 },
    ];
    expect(decodeSteps(encodeSteps(steps))).toEqual(steps);
  });
});
