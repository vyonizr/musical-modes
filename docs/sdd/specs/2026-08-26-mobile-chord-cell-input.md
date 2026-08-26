# Mobile chord-cell input

**Status:** proposed

## Problem

On the POCO M3, tapping a Chord Cell in the mobile table can produce a touch
sequence followed by a synthesized mouse sequence. One touch therefore attacks
the same chord twice. The duplicate attack and release produce audible Audio
Artifacts.

## Goal

A Chord Cell Gesture creates exactly one attack and one corresponding release on
touch devices, without changing desktop mouse behaviour or the shared piano
engine.

## Scope

- Use one pointer-event interaction path for Chord Cells.
- Start a chord once at contact start.
- Release that exact chord when contact ends, is cancelled, or becomes a page
  scroll.
- Do not attack another cell when a contact moves across the table.
- Preserve mouse behaviour: press starts; release or leaving the cell stops.

## Out of scope

- Changing piano samples, reverb, limiter, volume mapping, voicing, or chord
  scheduling.
- Broad audio-performance work.
- Changing keyboard input or authored progression playback.

## Acceptance criteria

1. On a touch device, one tap on a Chord Cell produces one audible chord attack
   and one release, with no synthesized duplicate attack.
2. Cancelling a gesture, including a page scroll, releases the chord and leaves
   no chord sounding.
3. Moving a finger between Chord Cells does not attack a second chord.
4. On desktop, mouse press starts playback and mouse release or leaving the cell
   stops it.
5. The POCO M3 no longer produces the reported attack/release Audio Artifacts
   when Chord Cells are tapped.
6. Existing chord-handle release ownership remains intact: each release is sent
   to the exact engine and notes attacked by that gesture.

## Verification

- Add focused component coverage for one pointer gesture, cancellation, and
  desktop mouse leave.
- Run `npm test` and `npm run build`.
- Manually exercise Chord Cells on the POCO M3 after samples load: repeated
  taps, a drag across cells, and a scroll started on a cell.

## Decision

No ADR is needed. This is a local, reversible event-handling correction. The
canonical terms are in `CONTEXT.md`: Audio Artifact, Duplicate Touch Attack,
and Chord Cell Gesture.
