# Extract UI strings into a shared strings module

**Date:** 2026-07-10
**Status:** Proposed

## Motivation

All user-facing copy (labels, tour text, placeholders, disclaimers) is currently inlined as string/template literals across `App.tsx`, `TableContent.tsx`, and `ProgressionsPanel.tsx`. This is prep work for eventual i18n: consolidating copy into one module now means a future translation pass is a smaller, more contained diff instead of a repo-wide hunt for literals.

This pass is extraction only. No i18n library, no language switching, no locale files — just moving hardcoded strings into named constants in one place.

## Scope

**In scope:** every literal piece of UI copy in `App.tsx`, `TableContent.tsx`, `ProgressionsPanel.tsx` — headings, button/label text, placeholders, disclaimers, empty/error states, tour step text (plain-string steps only, see exception below), and the Joyride `locale` strings (`next`/`skip`/`last`).

Parameterized copy (e.g. `` `Section ${si + 1} chords (e.g. C G Am F)` ``, `` `Remove section ${si + 1}` ``, `` `Not a chord: ${invalidTokens.join(", ")}` ``, `` `(borrowed from ${m.borrowedFrom})` ``) becomes a small formatter function per string, not a raw constant.

**Out of scope:**
- Any JSX that mixes literal text with inline markup (`<code>`, `<span>`, etc.) rather than being a plain string. This is structural markup, not pure copy — extracting it would mean either stripping the formatting or having the strings module export JSX, which reintroduces the complexity this pass is deliberately avoiding. Concretely, this covers: the two `TOUR_STEPS` entries with JSX `content` (the accidental-toggle step and the keyboard-mapping step), and the `#modifier-hint` paragraph in `App.tsx` (`Hold , · . · k · l for 7th / sus chords`, which interleaves four `<code>` keys with text). These stay inline as authored, called out in code with `// ponytail: JSX left inline, not a pure string — see 2026-07-10-extract-ui-strings.md`.
- CSS class name strings.
- `localStorage` keys (`musical-modes-tour-seen`).
- URL query param names/values (`key`, `modes`, `acc`, `sharp`/`flat`).
- DOM/ARIA technical strings (event names, `aria-pressed`, etc.) and any `aria-label`/`title`/`placeholder` value that is fully derived from data (e.g. `aria-label={KEYS[keyIndex]}`) rather than literal copy.
- Music-theory data — chord names, roman numerals, mode names — these are computed, not hardcoded UI copy.

## Design

Add `src/utils/strings.ts` exporting a single `STRINGS` object, grouped by feature area (matching the app's visual sections, not by source file):

```ts
export const STRINGS = {
  header: {
    title: "Musical Modes",
    rootKeyLabel: "Root Key",
    volumeLabel: "Volume",
  },
  table: {
    playHint: "Tap or use keyboard to play the chords",
    nothingToPlay: "Nothing to play 😕",
    toggleModesHint: "Toggle modes",
  },
  keyDetector: {
    toggleLabel: "Don't know the key? Detect it from chords",
    experimentalHint: "Experimental — best-guess detection for ionian and aeolian modes only",
    sectionPlaceholder: (n: number) => `Section ${n} chords (e.g. C G Am F)`,
    removeSectionLabel: (n: number) => `Remove section ${n}`,
    notAChord: (tokens: string) => `Not a chord: ${tokens}`,
    addSection: "+ Add section",
    detect: "Detect Key",
    resultsDisclaimer: "Based on chord matching, not a definitive analysis",
    tiedResultsHeading: "Top results (tied):",
    bestGuessHeading: "Best guess:",
    resolvesToTonic: "resolves to tonic",
    borrowedFrom: (mode: string) => `(borrowed from ${mode})`,
    nonDiatonic: "(non-diatonic)",
    emptyState: "Enter at least one chord to detect a key.",
    sectionLabel: (n: number) => `Section ${n}`,
  },
  progressions: {
    toggleLabel: "Chord Progressions",
    disclaimer:
      "Not official music theory terms. Names are just what I like to call them / how the progression feels.",
    spotifyLinkTitle: "Open playlist on Spotify",
  },
  tour: {
    rootKeyStep: "Tap a note on the keyboard to set the root key. Every chord on the page updates to match.",
    toggleModesStep: "Toggle which modes are shown. Each coloured button is a different musical mode.",
    playChordStep: "Tap any chord to play it. On desktop, you can hold it down to sustain.",
    keyDetectorStep: "Not sure what key you're in? Type a few chords and the detector will guess the key for you.",
    progressionsStep: "Browse chord progressions from real songs, resolved to your current key. Tap one to hear it played back.",
    joyrideNext: "Next",
    joyrideSkip: "Skip",
    joyrideLast: "Done",
  },
  footer: {
    githubLabel: "Github",
    authorLabel: "vyonizr",
  },
} as const
```

Components import `STRINGS` from `src/utils/strings.ts` (consistent with the existing `baseUrl: "."` import convention — `src/utils/strings`) and replace literals in place, e.g.:

```tsx
<h1 className="title black">{STRINGS.header.title}</h1>
...
placeholder={STRINGS.keyDetector.sectionPlaceholder(si + 1)}
```

`TOUR_STEPS` in `App.tsx` keeps its existing shape (`Step[]`) but pulls plain-string `content` values from `STRINGS.tour.*`; the two JSX-content steps stay as authored, per the out-of-scope exception above.

## Non-goals

- No i18n library (react-i18next or similar) — nothing here should imply the app supports more than one language yet.
- No behavior or visual change. This is a pure refactor; rendered output must be byte-identical.
- No new abstractions beyond the one `STRINGS` object — no per-component string files, no lookup-by-key indirection, no pluralization/formatting helpers beyond the plain functions listed above.

## Verification

Mechanical refactor, no new logic to unit test. Verify via:
- `npm test` continues to pass unchanged.
- Manual visual diff: app renders identically before/after (tour, key detector, progressions panel, footer).
- Grep sweep after the change confirms no leftover literal copy remains in the three target files outside the documented out-of-scope exceptions.
