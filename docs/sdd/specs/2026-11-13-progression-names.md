# Progression names

**Status:** accepted

Evidence: `docs/sdd/research/2026-11-13-progression-names.md`.

## Problem

Predefined progressions were named with the author's own mood labels. One of
them, "Backdoor Vamp", borrowed a jazz term for a different progression: a jazz
backdoor is a dominant ♭VII7 resolving to I, not the triads ♭VII–IV–I.

## Decision

A **Progression Name** follows this order (see `CONTEXT.md`): established theory
term, then a community name that a textbook acknowledges, then a plain
description of the harmonic mechanism. Ids do not change, because embeds carry
the id in their URL.

| id | Numerals | Old name | New name | Basis |
|---|---|---|---|---|
| melancholic-uplift | ♭III–IV–I | Melancholic Uplift | Borrowed ♭III–IV | No established term; ♭III is borrowed from the parallel minor |
| melancholic-return | ♭III–IV–i (Dorian) | Melancholic Return | Dorian ♭III–IV | No established term; minor tonic with major IV marks Dorian |
| mario-cadence | ♭VI–♭VII–I | Mario Cadence | Mario Cadence (unchanged) | Acknowledged by Open Music Theory as the aeolian cadence |
| double-plagal | ♭VII–IV–I | Double Plagal | Double Plagal (unchanged) | Walter Everett's term |
| backdoor-vamp | I–♭VII–IV–I | Backdoor Vamp | Double Plagal Vamp | Tonic-opening double plagal; "backdoor" was wrong |
| haunting-progression | ♭VI–iv–I | Haunting Progression | Borrowed ♭VI–iv | No established term; both chords borrowed from the parallel minor |

The "Informal names, not official theory terms" tooltip on the Chord
Progressions toggle is deleted, with its string.

## Out of scope

- Chords, example songs, Spotify playlists, order, and ids.
- Embed snippets already pasted keep their old iframe `title`; the widget reads
  the new name from the id.

## Known gaps

- Only the Mario example song is verified. "Lift Off" reads ♭III–IV–i in one
  chord source, which fits Melancholic Return (now Dorian ♭III–IV) rather than
  Borrowed ♭III–IV. Left unchanged.
