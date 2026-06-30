# Discoverability Improvements — Design Spec

**Date:** 2026-06-30  
**Status:** Awaiting implementation plan

---

## Summary

Two UX improvements to make the chord table self-explanatory without requiring the onboarding tour: mode name labels in the table, and keyboard shortcut hints on chord cells.

---

## Scope

**In scope (this spec):**
- Mode name header rows in the chord table
- Keyboard key hints on chord cells

**Deferred (separate discussions):**
- URL state shareability
- Synth sound quality improvements

---

## 1. Mode Name Header Rows

**Goal:** Each mode section in the table identifies itself visually — users don't need to cross-reference the legend toggles to know which row is which mode.

**Markup:** Inside `TableContent`, add a `<tr>` with a single `<th colSpan={7}>` *above* the existing chord `<tr>`, within the same `<tbody>`. The content is `mode.name` capitalized (e.g., `"ionian"` → `"Ionian"`).

**Styling:** The `<th>` inherits the mode's color class from the parent `<tbody>`. It should read as a label, not a chord — smaller font size or reduced opacity relative to the chord text is appropriate.

**Mobile:** Full-width by nature (spans all 7 columns). No overflow or squeeze risk on any screen width.

---

## 2. Keyboard Key Hints on Chord Cells

**Goal:** Users can see which keyboard key triggers each chord without reading the tour or help text.

**Mapping logic:** `KEY_ROWS[activeRowIndex][chordIndex]`

`KEY_ROWS` is:
```
Row 0: Q W E R T Y U
Row 1: A S D F G H J
Row 2: Z X C V B N M
```

`activeRowIndex` is the position of this mode among *currently active* modes — not its index in the full 7-mode list. This distinction is critical: if only Ionian and Aeolian are active, Aeolian is keyboard row 1 (A–J), not row 5.

**Prop change required:** `TableContent` needs an `activeRowIndex` prop. `index.tsx` must compute this by counting how many active modes precede the current one in render order.

**Rendering:** A small, muted label on each chord cell (e.g., top-right corner or below the chord name), visually subordinate to the chord name and existing roman numeral label.

**Ceiling:** Only show hints when `activeRowIndex < KEY_ROWS.length` (i.e., `< 3`). Modes beyond the third active row have no keyboard mapping, so no hint is shown for them.

---

## Deferred Topics

### Shareability
URL query params (e.g., `?key=C&modes=ionian,dorian`) to encode the current key and active modes. Lets users share a specific configuration via link. Low effort — `URLSearchParams` on mount to read, update on state change. Discuss and design separately.

### Sound Quality
The existing `PolySynth` (triangle wave, dry signal) sounds thin. `Tone.Reverb` is already available via the installed `tone` package — connecting it to the synth destination would take ~3 lines and meaningfully improve perceived quality. Discuss and design separately.
