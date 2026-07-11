export function computeEmbedHeight(modeCount: number): number {
  // 12px padding top + ~40px header row + modeCount * 62px (20px header + 42px chord row) + ~20px backlink + 12px padding bottom
  return 12 + 40 + modeCount * 62 + 20 + 12;
}
