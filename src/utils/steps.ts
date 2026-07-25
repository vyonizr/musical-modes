import { ProgressionStep } from "src/utils/progressions";
import { ChordFlavor } from "src/utils/chords";

const FLAVOURS: readonly string[] = ["flat7", "maj7", "sus4", "sus2"];

export function encodeSteps(steps: ProgressionStep[]): string {
  return steps
    .map((s) => {
      const parts = [s.mode, String(s.degreeIndex)];
      if (s.flavour) parts.push(s.flavour);
      if (s.bars && s.bars !== 1) parts.push(String(s.bars));
      return parts.join(":");
    })
    .join(",");
}

export function decodeSteps(encoded: string): ProgressionStep[] {
  if (!encoded) return [];
  return encoded
    .split(",")
    .map((part) => {
      const fields = part.split(":");
      const degreeIndex = parseInt(fields[1], 10);
      if (fields.length < 2 || !Number.isFinite(degreeIndex) || fields[0] === "") {
        return { mode: "", degreeIndex: NaN };
      }
      const step: ProgressionStep = {
        mode: fields[0],
        degreeIndex,
      };
      if (fields[2]) {
        if (FLAVOURS.includes(fields[2])) {
          step.flavour = fields[2] as ChordFlavor;
          if (fields[3]) step.bars = parseInt(fields[3], 10);
        } else {
          step.bars = parseInt(fields[2], 10);
        }
      }
      return step;
    });
}
