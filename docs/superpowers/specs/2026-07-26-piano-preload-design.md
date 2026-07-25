# Piano ready before the first chord

Date: 2026-07-26
Status: awaiting review

## Problem

The first chord of every session plays the fallback synth instead of the piano.
Returning users hear it too, even though the sample bytes are already in the
service worker cache. The synth-to-piano switch mid-session breaks immersion.

## Root cause

`ensurePiano()` is called inside `triggerAttackChord` (`src/utils/chords.ts:342`).
The sample download therefore starts *at* the first attack, and `ensurePiano()`
returns `null` until `onload` fires, so that attack falls through to the synth.

Caching is not the problem. `src/sw.ts:36-43` already runtime-caches `.mp3`
CacheFirst. Even on a warm cache the fetch and decode are asynchronous, so the
first chord still misses.

## Non-goals

- Removing the synth fallback. It stays as the answer for "samples not ready".
- Changing sample pitch coverage, reverb, velocity humanisation, or the pedal.
- Any change to how chords are voiced or released.

## Measurements

Taken from the current files with `ffprobe`. Decoded figures are
`duration x 44100 Hz x 2 ch x 4 bytes`, which is how Web Audio stores
`AudioBuffer` data.

| | Download | Decoded RAM | Audio total |
|---|---|---|---|
| Current (16-22 s tails) | 868 KB | ~62 MB | 176.6 s |
| Trimmed to 6 s | 320 KB | ~21 MB | 60 s |

Download figures are measured from a real re-encode. RAM figures are computed
from measured durations.

## Design

Four changes. Parts 2 and 3 must ship together: part 2 alone silences all audio.

### 1. Trim the samples to 6 s

Re-encode all ten mp3s in `public/audio/piano/` to 6 seconds with a 0.4 s
fade-out, at the source bitrate of 40 kbps:

```sh
for f in public/audio/piano/*.mp3; do
  ffmpeg -y -i "$f" -t 6 -af "afade=t=out:st=5.6:d=0.4" \
    -c:a libmp3lame -b:a 40k -f mp3 "$f.tmp" && mv "$f.tmp" "$f"
done
```

The full 16-22 s tails are almost never heard: `RELEASE_S` is 0.3 s, reverb
decay is 1.5 s, and chords damp on release. Only a held or pedalled chord
reaches the tail, and a Salamander sample is near-silence well before 6 s.

Observable behaviour change: a held or pedalled note now fades out at 6 s
instead of ringing 16-22 s.

#### Why 6 s and not 10 s

Measured with `ffmpeg volumedetect` over one-second windows, relative to each
sample's own peak:

| | peak (0-1 s) | at 6 s | at 10 s | gain from 4 extra sec |
|---|---|---|---|---|
| C2 (lowest, longest ring) | -8.2 dB | -34.3 dB | -40.3 dB | 6 dB |
| C3 | -9.0 dB | -40.9 dB | -46.7 dB | 6 dB |
| C4 | -8.0 dB | -43.0 dB | -45.3 dB | 2 dB |

At the 6 s cut the worst case, C2, is already 26 dB below its peak. At the
default volume of 0.8 (-8 dB) that is about -42 dBFS absolute, below what a
phone speaker clears in a normal room. Ten seconds costs 200 KB and 14 MB more
for 2-6 dB of extra near-silence.

Nothing in normal use reaches either limit. Progression steps are
`(bars ?? 1) * 4 * (60000 / bpm)` (`usePlayProgression.ts:69-70`); no
progression sets `bars`, and BPM is 120 everywhere except one at 60, giving
steps of 2.0 s and at worst 4.0 s, with each step damping the previous chord.
Manual key holds run well under 2 s. The only path past 6 s is playing a
pedalled chord and then idling.

`public/audio/piano/LICENSE.txt` currently claims the files are "redistributed
unmodified". Reword to state they are trimmed to 6 s with a fade-out. CC BY 3.0
permits derivatives; attribution to Alexander Holm stays.

### 2. Preload at page load

Export a `preloadPiano()` from `chords.ts` that calls `ensurePiano()` for its
side effect and discards the result. Call it from a mount effect in `App.tsx`,
alongside the existing mount effects at lines 47-55.

`ensurePiano()` is already idempotent (guarded on `piano` being non-null), so
the later call from `triggerAttackChord` is a no-op.

This is safe while the audio context is suspended. `ToneAudioBuffer.js:313`
decodes via `getContext().decodeAudioData(...)`, and `decodeAudioData` is
independent of context state per the Web Audio spec.

No idle-callback deferral. A mount effect already runs after the bundle has
parsed and the first paint has happened, so the fetch does not compete with the
critical path.

### 3. Unlock the audio context on the first gesture

Today the `AudioContext` is created lazily inside `triggerAttackChord`, which
is always inside a user gesture, so browsers create it in the `running` state.
The app works despite never calling `Tone.start()` — by accident of timing.

Preloading at page load creates that context *outside* a gesture. It starts
`suspended`, and nothing in the codebase resumes it, so every chord would be
silent. Verified: `Tone.start()` is exactly `globalContext.resume()`
(`node_modules/tone/build/esm/core/Global.js:59-61`), with no internal gesture
listener.

Add an `unlockAudio()` to `chords.ts`:

- Registers one-shot `pointerdown` and `keydown` listeners on `document`, in
  the capture phase, so it runs before the React handlers that attack chords.
- Calls `Tone.start()`, then unbinds both listeners.
- Idempotent and safe to call when already running.

Wire it up from `preloadPiano()` so the two always ship together.

### 4. Precache the samples

With the payload at 320 KB, the reasoning behind `globIgnores` no longer holds,
and the runtime cache's `maxAgeSeconds: 30 * 24 * 60 * 60` means a user
returning after 31 days re-downloads and can hear the synth again.

- `vite.config.ts`: drop `injectManifest: { globIgnores: ['**/audio/**'] }` and
  its stale comment, so samples enter the precache manifest.
- `src/sw.ts`: delete the now-redundant runtime `.mp3` rule (lines 36-43).

Samples then never expire, are versioned per deploy, and work offline on a cold
first launch. Cost is +320 KB on service worker install.

## Failure modes

| Case | Behaviour |
|---|---|
| Samples still loading at first chord | Synth answers, as today. Preload just makes this window much smaller. |
| Sample fetch fails | `pianoState = "failed"`, synth for the rest of the session. Unchanged. |
| Context suspended, user attacks a chord | Capture-phase `Tone.start()` resumes it first. |
| User never plays a chord | Pays 320 KB and ~21 MB. Accepted tradeoff, down from 868 KB / ~62 MB. |

## Risks

**First-gesture timing.** `Tone.start()` returns a promise that will not resolve
before the same-tick React handler runs. Notes scheduled against a
still-suspended context sound once it resumes, so the first chord may be a few
milliseconds late or slightly clipped. Acceptable: it affects one gesture per
session. If it proves audible, gate the first attack on the resume promise.

**Console warning.** Chrome logs "The AudioContext was not allowed to start"
when a context is created outside a gesture. Harmless, but it will appear on
every page load until the first interaction.

## Testing

`src/utils/toneMock.ts` needs a `start` spy so the unlock path is observable.

Existing tests that must keep passing unchanged:

- "plays on the synth before samples finish loading" — still valid; preload does
  not mean loaded.
- "stays on the synth for the rest of the session when samples fail"
- "releases on the synth even when samples arrive mid-hold"

New cases:

- `preloadPiano()` starts the sample load with no attack; after `onload`, the
  first `triggerAttackChord` uses the piano, not the synth. This is the
  regression test for the reported bug.
- `preloadPiano()` twice constructs only one `Sampler`.
- First `pointerdown` calls `Tone.start()` once and unbinds; a second
  `pointerdown` does not call it again.
- A chord attacked before `onload` still releases cleanly on the synth.

## Files changed

- `public/audio/piano/*.mp3` — 10 files regenerated
- `public/audio/piano/LICENSE.txt` — wording
- `src/utils/chords.ts` — `preloadPiano()`, `unlockAudio()`
- `src/App.tsx` — mount effect
- `vite.config.ts` — drop `globIgnores`
- `src/sw.ts` — drop runtime mp3 rule
- `src/utils/toneMock.ts` — `start` spy
- `src/utils/chordEngine.test.ts` — new cases
