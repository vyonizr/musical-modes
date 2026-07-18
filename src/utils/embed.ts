import { Progression, BPM_DEFAULT } from "src/utils/progressions";

export function computeEmbedHeight(modeCount: number): number {
  // 12px padding top + ~40px header row + modeCount * 62px (20px header + 42px chord row) + ~20px backlink + 12px padding bottom
  return 12 + 40 + modeCount * 62 + 20 + 12;
}

export function buildEmbedSnippet(
  progression: Progression,
  selectedScale: string,
  preferSharp: boolean,
  origin: string
): string {
  const modeCount = new Set(progression.steps.map((s) => s.mode)).size;
  const height = computeEmbedHeight(modeCount);
  const src = `${origin}/?embed=1&progression=${progression.id}&key=${selectedScale.replace(
    "♭",
    "b"
  )}&acc=${preferSharp ? "sharp" : "flat"}&bpm=${progression.bpm ?? BPM_DEFAULT}`;
  return `<iframe src="${src}" width="375" height="${height}" frameborder="0" loading="lazy" title="${progression.name} — Musical Modes"></iframe>`;
}
