# Less text-heavy UI

**Status:** accepted (variant B, "Iconic")

## Problem

Explanatory prose crowded the page: a play hint, a toggle-modes hint, a
progression disclaimer, a detector warning and disclaimer, a preview heading, a
three-paragraph shortcut block and a seven-step onboarding. Most of it restated
what the controls already show.

## Decision

Let affordances carry the meaning. Detail that is still worth having moves into
tooltips; the rest is deleted.

- Delete the play hint, the toggle-modes hint, the detector results disclaimer
  and the embed preview heading.
- Experimental detection becomes a **Beta** badge; the caveat is its tooltip.
- The progression disclaimer was first moved into a tooltip, then deleted by
  `2026-11-13-progression-names.md` once the names no longer needed it.
- The embed-snapshot warning becomes the tooltip of the Copy embed code button.
- The keyboard-shortcut block becomes the Shortcut Hint; the full explanation is
  its tooltip. Keycap Hints on Chord Cells are always visible.
- The Sustain toggle keeps its label and gains a pedal icon.
- Onboarding keeps only the three-step core tour. The detector, progressions and
  builder tours are removed.
- Single-sentence copy has no trailing full stop.

## Consequences

- Tooltips do not exist on touch devices, so the embed-snapshot warning is
  invisible there.
- Users who already finished a panel tour keep a stored flag that is now
  ignored; no migration is needed.

## Alternatives not taken

- **A, Trim:** same structure, copy cut. Still prose-heavy.
- **C, Progressive:** hints appear after first use. Hides keyboard shortcuts from
  users who never press a key.
