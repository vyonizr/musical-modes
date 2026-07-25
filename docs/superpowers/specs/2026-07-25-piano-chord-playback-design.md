# Piano chord playback

**Date:** 2026-07-25
**Status:** Awaiting review, not yet approved for implementation plan

## Problem

Chords play through a `Tone.PolySynth` with a triangle oscillator
(`src/utils/chords.ts:182`). It is recognisably a synth. A musician landing on
the app hears something that does not match the instrument they think in, so the
sound gets in the way of the thing the app is actually teaching.

A piano is the familiar reference. The obstacle is that a convincing piano needs
recorded samples, and this app has two constraints that make "just download
samples" the wrong answer on its own:

- It is an offline-capable PWA. A user can open it with no network.
- The same audio code serves the **Embed Widget**, which runs on a **Host Page**
  the author does not control.

The app is an instrument. Press a chord, hear it now. Any design where the first
press waits on the network, or produces silence, is worse than the synth it
replaced.

## Decisions

### 1. Sampled piano, with the existing synth as an instant fallback

Two engines. `Tone.Sampler` is the piano. The existing `PolySynth` stays exactly
as written and plays whenever the samples are not yet available.

The piano is an **upgrade that arrives**, never a dependency that blocks. There
is no state in which pressing a chord produces silence or a delay.

Rejected alternatives:

| Option | Why not |
| --- | --- |
| Sampler alone | First press before load is silence. Offline is permanent silence. Worse than today. |
| Retuned synth, no samples | Reads as "electric keyboard", not piano. Does not meet the actual request. |

### 2. Public API of `chords.ts` does not change

`triggerAttackChord`, `triggerReleaseChord`, `releaseAllChords`, `chordToNotes`,
`setVolume`, `getStoredVolume` and `volumeToDb` keep their present signatures.
No caller changes: not `TableContent`, not `usePlayProgression`, not
`EmbedWidget`.

Both engines connect to the existing effect chain, built once as today:

```
PolySynth ─┐
           ├─→ Reverb ─→ Volume ─→ Limiter ─→ Destination
Sampler ───┘
```

The volume slider and the `-2 dB` limiter keep working untouched.

### 3. `ChordHandle` carries the engine that attacked it

```ts
interface ChordHandle {
  readonly notes: readonly string[];
  readonly engine: Tone.PolySynth | Tone.Sampler;
}
```

This extends the reasoning already documented at `src/utils/chords.ts:196` for
notes. A chord can be held while samples finish loading. If release resolved
"the current engine" instead of the recorded one, it would tell the Sampler to
release notes the PolySynth is holding, and the PolySynth would sustain until
page reload. That is precisely the stuck-note bug the receipt design exists to
prevent.

**Consequence, accepted deliberately:** a chord held across the load boundary
keeps its original timbre until released. Timbre never changes under a held
finger.

### 4. Samples load on first sound, in both the app and the widget

One rule, both surfaces: **the first sound-producing interaction starts the
download.** A chord-cell press or a progression play, whichever comes first.
Nothing downloads before that.

This satisfies the Host Page constraint without a second policy: an Embed Widget
that nobody interacts with costs its host page zero audio bytes.

- Loading is kicked off on every attack, idempotently.
- Load failure (`Sampler`'s `onerror`) is **terminal for the session**: mark
  failed, never retry, stay on the synth, surface nothing. Sound keeps working.
- No loading indicator, no instrument picker, no error toast.

### 5. Samples are self-hosted

Files live in `public/audio/piano/`, served from the app's own origin.

Not a CDN. A Host Page with a strict `Content-Security-Policy` would block a
third-party origin, and the widget would be silently synth-only on that page
with nothing to indicate why.

Source: **Salamander Grand Piano V3** (Yamaha C5) by Alexander Holm, MP3
conversion. This is the standard piano source in the Tone.js ecosystem.

Sample set: the canonical Tone.js Salamander distribution is sampled in **minor
thirds** (C, D♯, F♯, A per octave). `chordToNotes` spans C2–E4 (`BASS_FLOOR` 36
through `UPPER_FLOOR + 16`), so ten files — C2, D♯2, F♯2, A2, C3, D♯3, F♯3, A3,
C4, D♯4 — cover the range with at most two semitones of repitch.
`Tone.Sampler` repitches automatically between provided notes.

**Measured total: 866,600 bytes (846 KB)**, from `Content-Length` on
`tonejs.github.io/audio/salamander/`. Under the 1 MB budget with no trimming
required. Re-measure after any change to the file list; do not ship over 1 MB.

### 6. Runtime caching, not precaching

Add an audio rule to `src/sw.ts`, mirroring the existing fonts rule at
`src/sw.ts:28`:

```ts
{
  matcher: /\.mp3$/,
  handler: "CacheFirst",
  options: {
    cacheName: "audio",
    expiration: { maxEntries: 16, maxAgeSeconds: 30 * 24 * 60 * 60 },
  },
}
```

**Required companion change:** `injectManifest` precaches everything under
`public/` by default, so the samples would enter `__WB_MANIFEST` and be
precached regardless of the rule above — silently converting this decision into
"ship samples with the install". `vite.config.ts` needs:

```ts
injectManifest: { globIgnores: ['**/audio/**'] }
```

Net behaviour: PWA install stays lean; a user who installs and immediately goes
offline gets the synth; once any sound has been played online, the piano is
available offline thereafter.

### 7. Notes strike together, at one velocity

Three constants in `src/utils/chords.ts` change:

| Constant | Now | After | Why |
| --- | --- | --- | --- |
| `STRUM_DELAY_S` | `0.005` | removed | A piano hammers all held keys at once. |
| `STRUM_VELOCITIES` | `[0.55, 0.7, 0.65, 0.6, 0.6]` | `ATTACK_VELOCITY = 0.7` | The curve makes the *second* note loudest, which reads as wrong on a keyboard. |
| release timing | 5 ms cascade | simultaneous | Dampers lift together. |

Because `Tone` accepts note arrays, the per-note loops in `triggerAttackChord`
and `triggerReleaseChord` collapse to a single call each.

**The voicing itself does not change.** `chordToNotes` is already
keyboard-shaped — root in the bass at C2–B2, then the four nearest chord tones
stacked from C3 up. The README's "guitar voicings" label is inaccurate; only the
three constants above were guitar-derived.

### 8. Release is a 0.3 s damper fade

Set the Sampler's `release` to `0.3`. A real damper stops a string with a soft
edge, not a cliff, and 300 ms keeps overlap between consecutive progression
steps small enough to stay clean at fast BPM.

Full ring-out (sustain-pedal behaviour) was rejected: progression steps would
stack four deep, and dragging across a row of chord cells would leave a wash of
every chord touched.

**Knock-on change:** the PolySynth envelope release is currently `1.2` s
(`src/utils/chords.ts:184`). Left alone the fallback would ring four times
longer than the piano and feel like a different instrument. Set it to `0.3` to
match. This is a deliberate change to already-shipped sound.

### 9. The panic path stops everything within 300 ms

`releaseAllChords()` — wired to `blur`, `pagehide` and `visibilitychange` at
`src/utils/chords.ts:168` — calls `releaseAll()` on both engines.

This is a **bounded** stop, not an instant one: the release envelope still
applies, so audio ends within 300 ms rather than immediately. The bug this
handler exists for is *unbounded* sustain until page reload. A 300 ms tail on
tab-switch is not that bug.

A true hard cut would need an additional gain stage to ramp to zero. Rejected as
not worth the extra node.

### 10. Attribution

Salamander Grand Piano V3 is **CC BY 3.0**. Attribution is required.

- `public/audio/piano/LICENSE.txt` alongside the files, crediting Alexander Holm
  with the licence and source URL.
- A credit line in the `README.md` License section (`README.md:83`).
- `README.md:61` currently reads `Tone.js (PolySynth, guitar voicings)`. Both
  halves are wrong after this change; update it.

The Embed Widget carries attribution by reference through its existing backlink
to the main app, rather than spending its constrained space on a credit line.

## Testing

`src/utils/chordRelease.test.tsx` already hand-mocks Tone with a `PolySynth`
that tracks sounding notes. Extend that mock with a `Sampler` and add:

1. Attack before load uses the synth; release frees the synth's notes.
2. **Chord attacked on synth → samples become ready mid-hold → release frees the
   synth's notes, nothing left sounding.** Regression test for decision 3.
3. Attack after load uses the Sampler.
4. `releaseAllChords()` clears both engines.
5. Notes are attacked at a single timestamp, not staggered.
6. Sampler load failure still produces sound on the synth.

`src/utils/chords.test.ts` covers `chordToNotes`, which is untouched.

## Non-goals

No velocity layers. No sustain pedal. No instrument picker UI. No voicing
rework. No loading indicator. No change to `chordToNotes`, key/mode logic, or
the **Size Contract**.

## Files touched

| File | Change |
| --- | --- |
| `src/utils/chords.ts` | Engine layer, handle carries engine, attack/release constants |
| `src/sw.ts` | Audio runtime cache rule |
| `vite.config.ts` | `globIgnores` for audio |
| `src/utils/chordRelease.test.tsx` | Sampler in mock, six new tests |
| `README.md` | Audio row, attribution |
| `public/audio/piano/*` | New: samples and `LICENSE.txt` |

## Open risk

~~Actual sample-set size is unmeasured.~~ **Resolved 2026-07-25:** measured at
846 KB for the ten-file set (decision 5). No open risks remain.
