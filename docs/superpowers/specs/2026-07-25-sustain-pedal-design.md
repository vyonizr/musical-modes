# Sustain pedal

**Date:** 2026-07-25
**Status:** Awaiting user review
**Builds on:** `2026-07-25-piano-chord-playback-design.md`

## Problem

A chord stops sounding the moment its key is released. `triggerReleaseChord`
(`src/utils/chords.ts:318`) fires the moment a chord key goes up
(`src/utils/useChordKeyboardInput.ts:145`) or a pointer leaves a chord cell
(`src/components/TableContent.tsx:35`), and the damper fade is 300 ms.

To hold a chord across bars the musician must physically hold the keys down for
those bars. Anything that needs both hands, or a chord change, cuts the sound.
A real piano solves this with a damper pedal: releasing a key does not stop the
note, lifting the pedal does.

## Scope

The pedal affects **manual playing only** — the computer keyboard and the chord
cells. Progression playback is deliberately exempt.

Rejected alternatives:

| Option | Why not |
| --- | --- |
| Pedal also applies to progression playback | Leaving the pedal latched and pressing play would smear the whole progression into one cluster. Playback would need an exemption anyway, so nothing is shared. |
| Fix playback instead: skip the release between two identical consecutive steps | A real improvement, but a different problem. It needs no pedal and belongs in its own ticket. |

## Decisions

### 1. The pedal is a latch, not a held key

Pressing Space toggles the pedal. It does not need to be held.

This is what keeps the interaction affordable. The chord surface already has two
simultaneous hold classes: a chord key, and a flavour modifier
(`,` `.` `k` `l` → `flat7` `maj7` `sus2` `sus4`). A momentary pedal would make
three. A latch adds none: the hand still holds at most a chord plus a modifier,
exactly as today.

Rejected alternatives:

| Option | Why not |
| --- | --- |
| Momentary, hold Space | Truer to a real pedal, but stacks a third simultaneous hold on top of chord + flavour modifier. |
| Always on, fixed tail after every release | No control. Every phrase blurs, including ones the musician wants short. |

### 2. The pedal lives in the audio engine, not in each input surface

`src/utils/chords.ts` gains module state and two functions:

```ts
let pedalDown = false;
const sustained = new Set<ChordHandle>();

export function setSustain(down: boolean): void;
export function dampChord(handle: ChordHandle | null | undefined): void;
```

- `dampChord` is the current unconditional body of `triggerReleaseChord`:
  release the handle's notes at `max(Tone.now(), handle.attackedThrough)`.
- `triggerReleaseChord` becomes pedal-aware. With the pedal up it calls
  `dampChord`. With the pedal down it moves the handle from `sounding` to
  `sustained` and returns without releasing anything.
- `setSustain(false)` damps every handle in `sustained` and clears the set.
  Chords whose key is still physically held live in `sounding`, not
  `sustained`, so lifting the pedal does not cut them. They damp when their
  key comes up, as usual.
- `setSustain(true)` only sets the flag.

Both surfaces already funnel every release through `triggerReleaseChord`, so
they need no change to gain the behaviour. The one caller that must opt out
(playback) opts out explicitly.

Rejected alternative: implement deferred release inside
`useChordKeyboardInput` and `TableContent` separately. Two copies of the same
stuck-note hazard, and the mouse and keyboard surfaces could disagree about
which chords are ringing.

### 3. Re-attacking a ringing note damps it first

`triggerAttackChord` damps any handle in `sustained` that shares a note with
the chord about to sound, before attacking.

Without this, playing C, releasing, and playing C again with the pedal down
gives two handles that both own `C3`. Releasing one releases the note, and the
other handle's notes ring until a page reload — the exact stuck-note class the
`ChordHandle` receipt exists to prevent.

This also matches a real piano, where re-striking a key re-strikes the same
string rather than adding a second one. As a side effect it bounds the
sustained set: at most one sustained handle per pitch, and `chordToNotes` spans
about 17 pitches, so voice count stays bounded without a separate cap.

### 4. A flavour retrigger bypasses the pedal

`retriggerHeldChords` (`src/utils/useChordKeyboardInput.ts:88`) releases and
re-attacks every held chord when a flavour modifier goes down or up. That
release is a voicing correction, not a musical release: the musician did not
let go of anything.

It must call `dampChord`, not `triggerReleaseChord`. Otherwise pressing `,`
while holding C with the pedal down leaves C ringing underneath C7.

Decision 3 would in fact catch most of this, because the two voicings overlap.
Relying on that would be accidental: `sus2` and the underlying triad do not
share every note, so the stale voicing could survive in part. The bypass is
explicit.

### 5. Progression playback bypasses the pedal

The release in the playback loop (`src/utils/usePlayProgression.ts:73`), the
pre-roll release at line 38, and the unmount cleanup at line 30 all call
`dampChord`.

Playback timing is authored, not performed. The step durations already encode
how long each chord should ring.

### 6. Panic paths clear both sets

`releaseAllChords` currently iterates `sounding`. It must iterate `sustained`
as well and clear both. It is bound to `blur`, `pagehide` and
`visibilitychange` (`src/utils/chords.ts:190`) and is called by the keyboard
hook's own blur handler.

The pedal **flag** is not reset by these paths. Sound stops; the latch stays
where the musician left it, the way a physical pedal stays down when you leave
the room.

### 7. Space is guarded, and the pedal has a visible control

A `useSustainPedal` hook in `src/utils/` owns the flag, the Space listener, and
the call into `setSustain`. It returns `{ sustainOn, toggleSustain }`.

Space is a hostile key. The keydown handler must:

- return early when `isTextInput(e.target)` — currently module-private in
  `useChordKeyboardInput.ts`, to be exported from there rather than duplicated
- return early when `document.activeElement` is a `button` or an `input`, so
  Space still activates a focused control instead of toggling the pedal
- call `e.preventDefault()` otherwise, so the page does not scroll

The visible control is a toggle button rendered beside the existing
`.volume-control` block (`src/App.tsx:220`), inside the same container. It
carries `aria-pressed={sustainOn}` and a label from a new `header.sustainLabel`
key in `src/locales/en.json`. Touch devices have no Space key, so the button is
the only control there.

The pedal state is **not** persisted. Volume persists because it is a
preference; a pedal found already down on page load would be a surprise.

## Files touched

| File | Change |
| --- | --- |
| `src/utils/chords.ts` | Pedal flag, `sustained` set, `setSustain`, `dampChord`; `triggerReleaseChord`, `triggerAttackChord` and `releaseAllChords` become pedal-aware |
| `src/utils/useSustainPedal.ts` | New. Flag state, guarded Space listener, `toggleSustain` |
| `src/utils/useChordKeyboardInput.ts` | Export `isTextInput`; `retriggerHeldChords` uses `dampChord` |
| `src/utils/usePlayProgression.ts` | All three releases use `dampChord` |
| `src/App.tsx` | Mount `useSustainPedal`, render the toggle beside the volume control |
| `src/locales/en.json` | `header.sustainLabel` |
| `src/styles/` | Toggle button styling matching the existing control bar |

## Testing

New `src/utils/sustain.test.tsx`, using the existing `toneMock` and its
`stuckNotes()` helper. Every case below is a stuck-note or a smear that the
current code cannot produce and the new code can.

1. Pedal down: a chord keyup issues no release, and the notes are still
   sounding.
2. Pedal up after sustaining several chords: `stuckNotes()` is empty.
3. Pedal down, same chord played twice, then pedal up: `stuckNotes()` is empty.
4. Pedal down, flavour modifier pressed while a chord is held: the pre-modifier
   voicing is released immediately, not sustained.
5. Pedal down during progression playback: each step is released at its own
   step boundary.
6. Pedal down, then window blur: `stuckNotes()` is empty, and the pedal flag is
   unchanged.
7. Space pressed while a text input is focused, and while a button is focused:
   the pedal does not toggle.

## Out of scope

- Sustain in the Embed Widget. It only plays authored progressions, which
  decision 5 exempts.
- Removing the re-strike gap between two identical consecutive progression
  steps. Named in Scope above as a separate ticket.
- Half-pedalling, sostenuto, or a release-time control.
