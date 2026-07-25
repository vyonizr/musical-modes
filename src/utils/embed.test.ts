import { describe, it, expect } from "vitest";
import { computeEmbedHeight, buildEmbedSnippet, buildStepsEmbedSnippet, EMBED_WIDTH } from "./embed";
import { Progression } from "./progressions";

describe("computeEmbedHeight", () => {
  // Measured in Chromium against the real widget at a 456px frame width.
  // See docs/superpowers/plans/2026-07-25-embed-size-contract-fix.md.
  it("matches the widget's measured rendered height", () => {
    expect(computeEmbedHeight(1)).toBe(180);
    expect(computeEmbedHeight(2)).toBe(255);
    expect(computeEmbedHeight(3)).toBe(330);
    expect(computeEmbedHeight(4)).toBe(405);
    expect(computeEmbedHeight(7)).toBe(630);
  });

  it("grows by exactly one mode row per mode", () => {
    expect(computeEmbedHeight(3) - computeEmbedHeight(2)).toBe(75);
  });
})

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
    expect(html).toContain(`width="${EMBED_WIDTH}"`);
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

describe("EMBED_WIDTH", () => {
  it("matches the widget's fixed CSS width", () => {
    // .embed-widget { width: 456px } in src/styles/modes.css.
    // These two numbers are one contract — see docs/adr/0001-embed-widget-has-a-fixed-width.md.
    expect(EMBED_WIDTH).toBe(456);
  });
});

describe("buildStepsEmbedSnippet", () => {
  const steps = [
    { mode: "ionian", degreeIndex: 0, flavour: "maj7" as const },
    { mode: "aeolian", degreeIndex: 2 },
  ];

  it("encodes the steps, key, accidentals and bpm into the src", () => {
    const html = buildStepsEmbedSnippet(steps, 90, "C", false, "https://example.com");
    expect(html).toContain(
      'src="https://example.com/?embed=1&key=C&acc=flat&bpm=90&steps=ionian:0:maj7,aeolian:2"'
    );
  });

  it("sizes the frame from the number of distinct modes, not the number of steps", () => {
    const threeStepsTwoModes = [
      { mode: "ionian", degreeIndex: 0 },
      { mode: "ionian", degreeIndex: 3 },
      { mode: "aeolian", degreeIndex: 2 },
    ];
    const html = buildStepsEmbedSnippet(threeStepsTwoModes, 120, "C", false, "https://example.com");
    expect(html).toContain(`height="${computeEmbedHeight(2)}"`);
    expect(html).toContain(`width="${EMBED_WIDTH}"`);
  });

  it("encodes flats in the key as b", () => {
    const html = buildStepsEmbedSnippet(steps, 120, "B♭", true, "https://example.com");
    expect(html).toContain("key=Bb");
    expect(html).toContain("acc=sharp");
  });

  it("titles the frame with the key so screen readers get a real description", () => {
    const html = buildStepsEmbedSnippet(steps, 120, "C", false, "https://example.com");
    expect(html).toContain('title="Chord progression in C — Musical Modes"');
  });

  it("keeps the flat glyph in the human-readable title while the url stays ascii", () => {
    const html = buildStepsEmbedSnippet(steps, 120, "B♭", true, "https://example.com");
    expect(html).toContain('title="Chord progression in B♭ — Musical Modes"');
    expect(html).toContain("key=Bb");
  });
});
