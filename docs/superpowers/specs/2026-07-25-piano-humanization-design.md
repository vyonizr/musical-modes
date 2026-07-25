# Piano humanization

**Date:** 2026-07-25
**Status:** Approved for implementation plan
**Amends:** `2026-07-25-piano-chord-playback-design.md`, decision 7

## Problem

Every chord attack is identical. All 5 notes start at the same instant at
velocity `0.7` (`src/utils/chords.ts:276`). Two presses of the same chord
produce byte-identical audio. The phase alignment of 5 simultaneous onsets is
something a human hand cannot produce, and it is the main thing that still marks
the piano as software.

The fix is small randomization of onset time and velocity, per note, per attack.

## Relationship to the previous spec

Decision 7 of `2026-07-25-piano-chord-playback-design.md` removed a `0.005 s`
strum cascade and a `[0.55, 0.7, 0.65, 0.6, 0.6]` velocity curve, and replaced
them with one simultaneous attack at a single velocity.

That decision is **partly reversed here, and its reasoning is preserved.** What
was wrong with the old behaviour was that it was *fixed and directional*: the
same note was always first, and the second note was always the loudest, which
reads as a guitar strum rather than a keyboard. Randomization has no direction
and no systematically loudest note, so it does not reintroduce that defect.

The test at `src/utils/chordRelease.test.tsx:175`, currently named
`"a chord is struck like a keyboard, not strummed like a guitar"`, encodes the
old decision and is rewritten by section 6 below.

## Decisions

### 1. Non-directional jitter, not a roll

Each note gets an independent random offset. No note is systematically first.

Rejected alternatives:

| Option | Why not |
| --- | --- |
| Directional roll (bass to top) with random gap size | Bass always leads. Reintroduces the fixed ordering decision 7 deleted. |
| Random direction chosen per chord | Still a roll within any single chord, and the direction flip is itself audible as an inconsistency. |

### 2. Ranges

Two new constants in `src/utils/chords.ts`. `ATTACK_VELOCITY` stays at `0.7` and
becomes the center value rather than the only value.

| Constant | Value | Effect |
| --- | --- | --- |
| `HUMANIZE_MAX_DELAY_S` | `0.012` | Note starts at `t0 + random(0, 12 ms)` |
| `HUMANIZE_VELOCITY_SPREAD` | `0.06` | Note plays at `0.7 ± 0.06`, so `0.64` to `0.76` |

`t0` is `Tone.now()`, captured **once per chord**, so all 5 offsets share one
base. Every offset is zero or positive, so a chord never starts later than it
does today. The whole chord lands inside a 12 ms window.

Why these numbers: below roughly 30 ms a chord still reads as a single event,
and above roughly 50 ms it reads as rolled or sloppy. 12 ms sits well inside
"single event" while breaking the phase alignment. `0.06` is about 8 steps of
127 in MIDI terms, audible as touch variation but never as a wrong note.

Shape of the change in `triggerAttackChord`:

```ts
const t0 = Tone.now();
let attackedThrough = t0;
for (const note of notes) {
  const at = t0 + Math.random() * HUMANIZE_MAX_DELAY_S;
  const velocity =
    ATTACK_VELOCITY + (Math.random() * 2 - 1) * HUMANIZE_VELOCITY_SPREAD;
  engine.triggerAttack(note, at, velocity);
  if (at > attackedThrough) attackedThrough = at;
}
```

The velocity range `0.64` to `0.76` cannot leave `[0, 1]`, so no clamp is
needed. If either constant is ever widened, add one.

### 3. Velocity varies per note, not per chord

Rejected: a random overall loudness per chord. Pressing the same chord twice and
hearing it clearly louder the second time reads as a volume bug, not as
expression. Real dynamics need a musical model (phrase position, beat strength)
that this app does not have.

Per-note jitter also keeps the old defect dead. With independent draws, no note
is systematically the loudest. Across 5 draws the chord's average loudness
barely moves, so chord-to-chord loudness stays stable while the internal blend
stops being identical on every press.

### 4. Release stays simultaneous

Dampers lift together when a hand comes off the keys. `triggerReleaseChord`
keeps its single `triggerRelease(notes, time)` call. The 0.3 s `RELEASE_S` fade
is unchanged.

### 5. `ChordHandle` records the last scheduled attack time

Attacks are now scheduled up to 12 ms ahead. If a release lands inside that
window, a note attacks *after* its own release and sustains until page reload.
That is the stuck-note class the handle receipt exists to prevent. Two paths
reach it: a very short tap, and the `blur` / `pagehide` / `visibilitychange`
panic handler firing right after an attack.

```ts
export interface ChordHandle {
  readonly notes: readonly string[];
  readonly engine: Tone.PolySynth | Tone.Sampler;
  readonly attackedThrough: number;
}
```

- `triggerReleaseChord` releases at `Math.max(Tone.now(), handle.attackedThrough)`.
- `releaseAllChords` iterates the `sounding` set and does the same per handle,
  then clears the set and still calls `releaseAll()` on both engines to catch
  anything untracked.

Consequence: the panic path now ends audio within 312 ms instead of 300 ms.
Decision 9 of the previous spec already accepts a bounded stop rather than an
instant one, so this stays inside that decision.

### 6. Public API is otherwise unchanged

`triggerAttackChord`, `triggerReleaseChord`, `releaseAllChords` and
`chordToNotes` keep their signatures. `ChordHandle` gains a field but stays
opaque to callers. No changes to `TableContent`, `useChordKeyboardInput`,
`usePlayProgression` or `EmbedWidget`.

Both engines get identical treatment. `Tone.PolySynth` and `Tone.Sampler` share
the `triggerAttack(note, time, velocity)` signature, so the loop does not branch
on engine.

### 7. Changing flavour on a held chord re-rolls the randomization

`useChordKeyboardInput` releases and re-attacks a held chord when `,` `.` `k`
`l` toggle (`src/utils/useChordKeyboardInput.ts:92`). That already re-strikes the
chord, so fresh randomization matches what the user hears. No special handling.
Recorded so it is not mistaken for a defect later.

## Testing

`src/utils/toneMock.ts` currently drops the `time` argument in `triggerAttack`
(`src/utils/toneMock.ts:56`). It must record it alongside `velocity`.

Rewrite the block at `src/utils/chordRelease.test.tsx:175`. Assert invariants,
not exact values, so no test depends on a particular random draw:

1. Attacking a chord produces exactly 5 attacks, one per note, no note attacked
   twice. `chordToNotes` always returns 5 notes: one bass plus `UPPER_VOICES`
   (`src/utils/chords.ts:123`).
2. Every velocity falls in `[0.64, 0.76]`.
3. Every attack time falls in `[t0, t0 + 0.012]`.
4. Release frees every note. Nothing left sounding.
5. Release issued inside the 12 ms window still frees every note. Regression
   test for decision 5.
6. `releaseAllChords()` called immediately after an attack leaves nothing
   sounding. Regression test for decision 5.

No RNG seeding or injection. Bounds assertions hold for every possible draw, so
there is nothing to make deterministic. Do not add a test asserting that two
attacks differ from each other, which is the one assertion here that could flake.

Every assertion against the `attacks` array in this file lives inside the block
being rewritten (`chordRelease.test.tsx:179-181`). The other tests (synth
fallback, engine recorded on the handle, load failure) assert through
`stuckNotes()` and need no changes.

## Non-goals

No per-chord dynamics. No velocity layers in the sample set. No user-facing
humanization toggle or intensity setting. No change to `chordToNotes`, the
voicing, `RELEASE_S`, the effect chain, or the Size Contract. No humanization of
progression step *timing*, which stays exactly on the BPM grid.

## Files touched

| File | Change |
| --- | --- |
| `src/utils/chords.ts` | Two constants, per-note attack loop, `attackedThrough` on the handle, release clamping in both release paths |
| `src/utils/toneMock.ts` | Record the attack `time` argument |
| `src/utils/chordRelease.test.tsx` | Rewrite the strum block, six tests |
| `docs/superpowers/specs/2026-07-25-piano-chord-playback-design.md` | Note that decision 7 is partly superseded by this spec |
