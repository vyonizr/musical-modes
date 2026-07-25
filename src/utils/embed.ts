import { Progression, ProgressionStep, BPM_DEFAULT } from "src/utils/progressions";
import { encodeSteps } from "src/utils/steps";

// The Embed Widget is a fixed-width box (.embed-widget { width: 456px } in
// modes.css). The frame must match it exactly or the widget overflows.
// See docs/adr/0001-embed-widget-has-a-fixed-width.md.
export const EMBED_WIDTH = 456;

// Measured against the real widget in Chromium at EMBED_WIDTH, not derived by
// hand. 105 = 12px top padding + 50px header + 8px header margin-bottom
// + 6px backlink margin-top + 14px backlink + 12px bottom padding + 3px borders.
// 75 = one mode row: 24px .mode-name-header + 51px chord td.
// If .embed-widget, .embed-header, .embed-backlink, .mode-name-header or the
// embed td rules in modes.css change, re-measure and update these two numbers.
export function computeEmbedHeight(modeCount: number): number {
  return 105 + modeCount * 75;
}

function iframeTag(src: string, steps: ProgressionStep[], title: string): string {
  const distinctModeCount = new Set(steps.map((s) => s.mode)).size;
  const height = computeEmbedHeight(distinctModeCount);
  return `<iframe src="${src}" width="${EMBED_WIDTH}" height="${height}" frameborder="0" loading="lazy" title="${title}"></iframe>`;
}

export function buildEmbedSnippet(
  progression: Progression,
  selectedScale: string,
  preferSharp: boolean,
  origin: string
): string {
  const src = `${origin}/?embed=1&progression=${progression.id}&key=${selectedScale.replace("♭", "b")}&acc=${preferSharp ? "sharp" : "flat"}&bpm=${progression.bpm ?? BPM_DEFAULT}`;
  return iframeTag(src, progression.steps, `${progression.name} — Musical Modes`);
}

export function buildStepsEmbedSnippet(
  steps: ProgressionStep[],
  bpm: number,
  selectedScale: string,
  preferSharp: boolean,
  origin: string
): string {
  const src = `${origin}/?embed=1&key=${selectedScale.replace("♭", "b")}&acc=${preferSharp ? "sharp" : "flat"}&bpm=${bpm}&steps=${encodeSteps(steps)}`;
  return iframeTag(src, steps, "Custom progression — Musical Modes");
}
