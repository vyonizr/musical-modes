# Embeddable chord progression widget

**Date:** 2026-07-11
**Status:** Proposed

## Motivation

`PROGRESSIONS` (`src/utils/progressions.ts`) and the playback engine behind it (`App.tsx`'s `handlePlayProgression`, `ProgressionsPanel.tsx`) only exist inside the full app: a visitor has to load the whole piano-keyboard/mode-table UI to hear one four-chord loop. For demonstrating a specific progression on a blog post ("here's what a ♭VII borrowed chord sounds like"), that's the wrong shape — readers want to press play on the one thing being discussed, not navigate a tool.

This spec adds a minimal, iframe-embeddable player: one progression, one key, one BPM, play/pause, and a visual highlight of the current chord. BPM and progression choice are fixed at *embed-creation* time by the blog author (via a new "Copy embed" affordance in the main app), not exposed as reader-facing controls — matches the "demonstrate a progression" use case without turning the embed into a second full app.

## Scope

**In scope:**
- A distinct, lightweight render path (`embed=1` query param) that mounts a compact `EmbedWidget` instead of the full `App`, reusing the existing single Vite entry point (no router, no second HTML file).
- Reusing the existing chord-progression sequencing logic (currently inline in `handlePlayProgression`) via a shared hook so `App` and `EmbedWidget` don't duplicate timing/lazy-audio-init logic.
- Reusing `generateModes`, `PROGRESSIONS`, `triggerAttackChord`/`triggerReleaseChord` as-is.
- A "Copy embed code" action in `ProgressionsPanel.tsx` that serializes the *currently selected* key, accidental preference, and a progression's id/bpm into an `<iframe>` snippet, mirroring the YouTube/Spotify "get embed code" pattern.
- Portable embed: works in any blog/site that allows `<iframe>` embeds (no platform-specific JS snippet required), since no `X-Frame-Options`/`frame-ancestors` restriction currently exists in `netlify.toml`.
- Play/pause control and the actual mode table (one row per mode the progression touches), with cell-level highlight of the currently-sounding chord — reusing `TableContent` and the `activeProgressionStep` behavior already in `App.tsx`, not a simplified summary view.
- Audio stays gated behind a user gesture (tap the play button) exactly as today — required by mobile autoplay policy, and doubles as sane UX for a page that may host multiple embeds.

**Out of scope (v1):**
- Reader-facing BPM slider or any live tempo control inside the embed. BPM is baked into the iframe URL at generation time.
- Key/mode picker inside the embed. The embed always plays one progression in one key.
- A `<script>`-tag-style JS embed. iframe only — simpler, works without platform cooperation, no bundle-loader concerns.
- Multi-progression "playlist" embeds (cycling through several progressions in one widget).
- Auto-resizing iframe via `postMessage`/ResizeObserver — ship with a fixed width/height tuned to fit one to a handful of mode rows plus the play control (a real `<table>`, not a one-line chip strip, so this needs more headroom than an initial single-row card estimate — confirm exact dimensions once built rather than guessing in this doc) within a typical blog content column; revisit if fixed sizing proves awkward.
- Theme-matching to the host blog's background/colors — embed ships with the app's existing color scheme.
- Any embed-view analytics/tracking.

## Design

**Entry point.** `main.tsx` checks `new URLSearchParams(location.search).get("embed") === "1"` before mounting, rendering `<EmbedWidget />` instead of `<App />` when present. No new HTML file or Vite multi-entry config — same bundle, same deploy, smallest diff against the "no router" architecture already in place.

**`EmbedWidget` (`src/components/EmbedWidget.tsx`).** Reads from the query string:
- `progression` — a `PROGRESSIONS[].id` (falls back to the first progression if missing/invalid)
- `key` — same encoding as the main app (`?key=C`, `b` for ♭)
- `acc` — `flat`/`sharp`, same as main app
- `bpm` — optional override of the progression's own `bpm`

It resolves `modes = generateModes(selectedScale, preferSharp)` once, then renders the progression name/pattern, a play/pause button, and **the actual mode table** — not a stripped-down chip row. Concretely: `modeNames = Array.from(new Set(progression.steps.map(s => s.mode)))` (same derivation `handlePlayProgression` already does at `App.tsx:201`), then one `<TableContent>` row per name in `modeNames`, inside a `<table>`, exactly the way `App.tsx:503-523` renders the full table today. This is a direct reuse of `TableContent` — no new rendering logic needed — which also means each cell stays independently clickable (`TableContent`'s existing `onMouseDown`/`onMouseUp` wiring), not just a passive playback visualization.

This directly gives cell-level highlighting during playback: `TableContent` already accepts `activeProgressionStep` and adds a `progression-active` class to the matching `{mode, degreeIndex}` cell (`TableContent.tsx:38,53`) — the embed's playback hook drives the same state shape, so highlighting is inherited, not reimplemented.

**Modal mixture.** Supported without extra work: `ProgressionStep.mode` is already per-step (this is how `double-plagal`/`backdoor-vamp` mix a borrowed ♭VII from `aeolian` into an otherwise-`ionian` progression). Because the embed renders one table row per *distinct* mode used in `progression.steps`, a borrowed-chord progression shows multiple mode rows (e.g. Ionian + Aeolian), and the active-cell highlight jumps between rows as playback crosses the borrow — arguably a better teaching aid for modal mixture than a flat roman-numeral strip, since the viewer sees which mode row a borrowed chord actually lives in.

A small "Musical Modes ↗" backlink rounds out the card, linking to the main app with the same `key`/`acc`/`progression` params carried through (`/?key=...&acc=...&modes=<progression's modeNames>`) so a reader lands on the same key/progression they just heard rather than a blank default state — also the only discovery path back to the full tool.

**Shared playback hook.** Extract the sequencing loop currently inlined in `App.tsx`'s `handlePlayProgression` (lines ~181–234: cancellation-token generation counter, per-step `triggerAttackChord`/delay/`triggerReleaseChord`, bars→ms conversion off `bpm`) into `src/utils/usePlayProgression.ts`. Both `App.tsx` and `EmbedWidget.tsx` call it — avoids re-implementing the "stale playback must release its held chord immediately on re-trigger" behavior a second time, which is genuinely non-obvious (see the comment at `App.tsx:183-185`).

**"Copy embed code" (`ProgressionsPanel.tsx`).** A small icon button per progression row (next to the existing play button) builds:

```html
<iframe
  src="https://<host>/?embed=1&progression=<id>&key=<selectedScale>&acc=<flat|sharp>&bpm=<progression.bpm>"
  width="480" height="<h>" frameborder="0" loading="lazy"
  title="<progression.name> — Musical Modes"
></iframe>
```

(`<h>` sized for the actual number of mode rows the progression touches — a single-mode progression needs less height than a modal-mixture one with two rows; compute per-progression rather than hardcoding one height for all embeds.)

and copies it via `navigator.clipboard.writeText`. Uses the *currently selected* key/accidental in the main app at the moment the button is clicked, so the blog author previews the sound in-app before copying — same key-selection surface, no separate embed-config UI to build.

**Styling.** `EmbedWidget` gets its own minimal CSS scope (e.g. `.embed-widget` root) so it doesn't inherit the full page layout (piano keyboard, header, table grid). Reuses existing color variables from `modes.css` for visual consistency with the main app's brand, but none of its structural rules.

## Key Assumptions to Validate

- [ ] Target blog platform(s) allow `<iframe>` embeds in post content (true for self-hosted WordPress, Substack, most static-site blogs — worth a quick check on whichever platform is actually used).
- [ ] No `X-Frame-Options`/CSP `frame-ancestors` header gets added later that would block framing — none exists today in `netlify.toml`; this must stay true.
- [ ] A fixed-width table-based iframe (width ~480px, height varying with mode-row count) reads acceptably inside a typical blog content column, and stays legible at that width — the main app's table has 7 chord columns per row, which is more cramped in a narrow embed than in the full-width app; validate visually once built, adjust the default width, not the architecture, if not.

## Resolved Decisions

- No separate "tap to enable sound" affordance. The play button itself is the required user gesture — same click both starts playback and satisfies the mobile autoplay-policy gesture requirement, exactly as chord cells already work in the main app.
- The backlink carries the same query params through (`key`, `acc`, `progression`) rather than linking to a blank default state, so a reader who clicks through lands in the main app already showing the progression/key they just heard.
