# Embed widget: custom progressions, mobile width, no keyboard hints

**Date:** 2026-07-11
**Status:** Proposed
**Supersedes (partially):** `2026-07-11-embeddable-progression-widget.md` — that spec's embed always resolves a `PROGRESSIONS[].id`; this spec replaces that resolution path for the embed entirely. `PROGRESSIONS.ts` and `ProgressionsPanel`'s canned examples are unaffected and remain the in-app quick-pick list.

## Problem Statement

How might we let a blog author build and embed a *custom* chord progression — any key, any mode mix, any degrees — that reads cleanly on a phone-width iframe (down to ~375px), without depending on the hand-authored `PROGRESSIONS` list or showing keyboard-shortcut hints that mean nothing outside the main app?

## Motivation

The current embed (`EmbedWidget.tsx`, shipped in the prior spec) only plays one of the dozen progressions hard-coded in `src/utils/progressions.ts`, selected by `?progression=<id>`. That's fine for "here's a stock example," but it can't demonstrate a progression the author actually wants to talk about unless someone first adds it to `PROGRESSIONS.ts` and ships a deploy. It also assumes a ~480px-wide iframe (`docs/sdd/specs/2026-07-11-embeddable-progression-widget.md`'s "Key Assumptions") and unconditionally renders `TableContent`'s `key-hint` span (the `Q`/`A`/`Z`-style keyboard mapping), which is dead weight in an iframe — a reader on someone else's blog isn't using the main app's keyboard shortcuts.

## Recommended Direction

Three changes ship together as one feature:

1. **A new in-app progression builder** lets an author assemble a custom step list (key/mode/degree/flavour/bars per step), preview/play it with the existing chord engine, then generate embed code from *that* custom sequence — not from a `PROGRESSIONS` id.
2. **`EmbedWidget` reads the step list from the URL directly** (`?steps=...`) instead of resolving `PROGRESSIONS.find(p => p.id === ...)`. This is a full replacement of the id-based resolution for the embed path, per the "fully replace" decision below — the embed no longer references `PROGRESSIONS` at all.
3. **Responsive, hint-free embed cells.** `TableContent` gets a prop to suppress the keyboard `key-hint` span; the embed always passes it. Cell text/padding get a narrow-width tier so a 7-column chord row stays legible at 375px, and `computeEmbedHeight`/default iframe width are recalculated to match.

This is one feature, not three, because the builder only makes sense once the embed can consume arbitrary steps, and neither is worth shipping without the layout fix — a builder that produces an embed unreadable on the phone width most blog traffic actually uses isn't a win.

## Key Assumptions to Validate

- [ ] A compact, URL-safe step-list encoding (e.g. `mode:degreeIndex:flavour:bars` per step, joined by `,` — `ionian:0,ionian:3,aeolian:2:_:2`) stays short enough for a multi-step progression to fit comfortably in a URL, and is legible enough that a hand-edited link (not just builder-generated) is plausible to debug. Validate by encoding the longest existing `PROGRESSIONS` entry and checking the resulting URL length.
- [ ] 375px is the real floor to design for, not narrower. No specific blog platform is targeted yet (per the prior spec's still-open "target blog platform" assumption) — confirm 375px against whichever platform(s) actually get used, once known.
- [ ] Suppressing `key-hint` in the embed doesn't remove information a reader needs — it currently only maps main-app keyboard shortcuts, which don't apply to an iframe on a third-party page, so removal should be a pure simplification, not a loss.

## MVP Scope

**In scope:**
- New `ProgressionBuilder` UI (name/location TBD at implementation time — likely a new panel alongside `ProgressionsPanel`, not inside it, since it's a distinct authoring flow rather than a list of presets) where an author picks a key, then adds steps (mode, scale degree, optional flavour, optional bar count), reusing the existing mode/chord data (`generateModes`, `ChordFlavor`) so the builder never invents new chord logic.
- Live preview/playback of the in-progress custom sequence via the existing `usePlayProgression` hook — an author should hear what they're embedding before copying the code, same as today's `ProgressionsPanel` play button.
- A "Copy embed code" action on the builder that serializes the custom steps (not a `PROGRESSIONS` id) plus key/acc/bpm into the iframe `src`, e.g. `?embed=1&key=C&acc=flat&bpm=120&steps=ionian:0,ionian:3,ionian:4,ionian:0`.
- `EmbedWidget.tsx` parses `steps` from the URL into `ProgressionStep[]` and builds an ad-hoc `Progression` object (no `id` lookup) to hand to `usePlayProgression` and `TableContent` — same downstream data shape, different construction path.
- `TableContent` gains a `showKeyHint?: boolean` (default `true`, so the main app is unaffected) or equivalent prop; `EmbedWidget` passes `false`.
- A narrow-width CSS tier for `.embed-table-container` / chord cells (shrink font/padding, not horizontal scroll — per the "shrink text" decision below) so 7 columns stay usable at 375px; `computeEmbedHeight` and the builder's generated default iframe `width`/`height` updated to match the new minimum.
- Fallback behavior for a missing/malformed `steps` param: fall back to the first `PROGRESSIONS` entry, mirroring the existing invalid-`progression`-id fallback — keeps the embed from rendering blank rather than adding new validation UX.

**Out of scope (this iteration):**
- Removing or restructuring `PROGRESSIONS.ts` / `ProgressionsPanel` — they stay exactly as-is for in-app quick-picks; only the embed's *consumption* path changes.
- A `<script>`-tag JS embed, reader-facing BPM/key controls inside the embed, auto-resizing iframes via `postMessage` — all still out of scope per the prior spec, unchanged here.
- Persisting/naming/saving custom progressions server-side or in `localStorage` — the builder's only output is a one-off embed URL; there's no "my saved progressions" list in this iteration.
- Validating step-list URLs beyond the existing graceful fallback (e.g. no inline error messages for malformed `steps`).
- Below-375px support — 375px is the floor being designed for, not an arbitrarily small width.

## Not Doing (and Why)

- **Exporting the builder's output back into `PROGRESSIONS.ts`** — the user's stretch goal ("even cooler if exportable to option 1") is real but is a second, separable feature (turning an ephemeral builder session into a permanent curated entry likely needs a PR/review step, not a client-side action) — tracked as an open question below, not committed to this scope.
- **A horizontal-scroll fallback for narrow cells** — rejected in favor of shrinking text/padding, per the "Drop key-hints, keep 7 columns, shrink text" decision; scrolling inside an iframe already embedded inside a scrolling blog page is worse UX (nested scroll regions), and 7 columns of short chord names shrink acceptably.
- **A theme/config UI for embed appearance** — still out of scope per the original embed spec; not revisited here.

## Open Questions

- Should the builder eventually offer "export this custom progression as a `PROGRESSIONS.ts` entry" (e.g. copy a TS object snippet an author pastes into a PR), as a lighter-weight version of the user's stretch goal, without building a save/persist system? Worth a follow-up spec once the builder itself ships and real usage shows whether authors actually want that path.
- Where does the builder live in the UI — its own collapsible panel next to `ProgressionsPanel`, or a mode within it (e.g. a "Custom" tab)? Left to implementation-time judgment per existing panel conventions in `App.tsx`.
- Exact step-encoding grammar (`mode:degree:flavour:bars`, delimiter choice, omitted-field convention) — a implementation detail to nail down with a couple of round-trip test cases (encode → decode → same `ProgressionStep[]`) before writing the builder UI against it.
