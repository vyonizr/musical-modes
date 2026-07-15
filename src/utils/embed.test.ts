import { describe, it, expect } from "vitest";
import { computeEmbedHeight, buildEmbedSnippet } from "./embed";
import { Progression } from "./progressions";

describe("computeEmbedHeight", () => {
  it("grows linearly with mode count", () => {
    expect(computeEmbedHeight(1)).toBe(12 + 40 + 62 + 20 + 12);
    expect(computeEmbedHeight(3)).toBe(12 + 40 + 62 * 3 + 20 + 12);
  });
});

describe("buildEmbedSnippet", () => {
  const progression: Progression = {
    id: "melancholic-uplift",
    name: "Melancholic Uplift",
    bpm: 100,
    steps: [
      { mode: "aeolian", degreeIndex: 2 },
      { mode: "ionian", degreeIndex: 3 },
    ],
    songs: [],
  };

  it("builds an iframe snippet using the progression's own bpm", () => {
    const html = buildEmbedSnippet(progression, "C", false, "https://example.com");
    expect(html).toContain('src="https://example.com/?embed=1&progression=melancholic-uplift&key=C&acc=flat&bpm=100"');
    expect(html).toContain('width="375"');
    expect(html).toContain(`height="${computeEmbedHeight(2)}"`);
    expect(html).toContain('title="Melancholic Uplift — Musical Modes"');
  });

  it("falls back to BPM_DEFAULT when the progression has no bpm", () => {
    const html = buildEmbedSnippet({ ...progression, bpm: undefined }, "C", false, "https://example.com");
    expect(html).toContain("bpm=120");
  });

  it("encodes accidentals and sharp preference", () => {
    const html = buildEmbedSnippet(progression, "B♭", true, "https://example.com");
    expect(html).toContain("key=Bb");
    expect(html).toContain("acc=sharp");
  });
});
