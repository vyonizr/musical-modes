import { Progression, BPM_DEFAULT } from "src/utils/progressions";

// Measured against the real widget in Chromium at EMBED_WIDTH, not derived by
// hand. 105 = 12px top padding + 50px header + 8px header margin-bottom
// + 6px backlink margin-top + 14px backlink + 12px bottom padding + 3px borders.
// 75 = one mode row: 24px .mode-name-header + 51px chord td.
// If .embed-widget, .embed-header, .embed-backlink, .mode-name-header or the
// embed td rules in modes.css change, re-measure and update these two numbers.
export function computeEmbedHeight(modeCount: number): number {
  return 105 + modeCount * 75;
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
