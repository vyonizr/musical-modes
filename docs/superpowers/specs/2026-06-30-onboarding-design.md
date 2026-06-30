# Onboarding Tour — Design Spec

**Date:** 2026-06-30
**Status:** Approved

## Summary

Add a first-visit guided tour for complete beginners explaining how to use the app's UI mechanics (not music theory). Uses `react-joyride` for spotlight overlays and anchored tooltips, matching the "joyride-style" UX the user requested.

## Target Audience

Complete beginners — users who do not know what the UI does or how keyboard/click interaction works.

## Architecture & State

- Add `react-joyride` as a dependency.
- Tour state (`run: boolean`, `stepIndex: number`) lives in `index.tsx` — no new context or global store.
- On mount, check `localStorage` for `"musical-modes-tour-seen"`. If absent, auto-start the tour (`run: true`).
- On Joyride `finish` or `skip` callback, write `localStorage.setItem("musical-modes-tour-seen", "true")` and set `run: false`.

## Tour Steps

4 steps in order:

| # | Target selector | Tooltip content |
|---|----------------|----------------|
| 1 | `#modes` | "Pick a root key. All chords on the page will update to match." |
| 2 | `.legends-wrapper` | "Toggle which modes are shown. Each coloured button is a different musical mode." |
| 3 | `table` | "Tap any chord to play it. On desktop, you can hold it down to sustain." |
| 4 | `table` | "Your keyboard maps to the chords too — Q through U for the top row, A through J for the second, Z through M for the third." |

Steps 3 and 4 share the same target so the spotlight stays on the chord grid while the explanation shifts from mouse to keyboard.

## Persistence & Restart

- `localStorage` key: `"musical-modes-tour-seen"`
- Written only on tour `finish` or `skip` — not on individual step close.
- A `?` button is appended to the existing `<footer>`, inline with the copyright/GitHub links, separated by ` | `.
- Clicking `?` sets `run: true` and resets `stepIndex: 0`.
- No other UI changes.

## Out of Scope

- Music theory explanations (what modes are, what diatonic chords are).
- iOS-specific guidance (existing alert handles that).
- Any changes to the chord table, mode toggles, or key selector beyond adding anchor targets.
