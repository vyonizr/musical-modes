export function computeEmbedHeight(modeCount: number): number {
  // 12px padding top + ~40px header row + modeCount * 72px (24px header + 48px chord row) + ~20px backlink + 12px padding bottom
  return 12 + 40 + modeCount * 72 + 20 + 12;
}
