# POCO M3 playback-crackle diagnostic

**Status:** implemented

## Problem

On a POCO M3 using Chrome Android, piano playback intermittently produces an
Intermittent Playback Crackle through every input path. Ordinary media playback
on the device does not exhibit the symptom. The current evidence supports a
shared Web Audio output-path investigation; it does not identify the cause.

## Goal

Let the affected musician compare normal piano playback with the same piano
playback that bypasses only the shared reverb, without changing the default
sound or making an unmeasured Android-specific audio policy permanent.

## Scope

- Add one diagnostic-only URL parameter for dry playback.
- In dry playback, route the selected piano or synth directly to the existing
  volume and limiter stages, bypassing only `Tone.Reverb`.
- Preserve the sample set, note scheduling, voice release behavior, volume,
  limiter, and every input path.
- Add diagnostic-only attack counters to the browser console so a later
  Android remote-debugging session can distinguish duplicate/late attacks from
  an output-graph issue.
- Make the default URL retain the current audio graph and behavior exactly.

## Out of scope

- Removing reverb or changing audio quality for Android users by default.
- Claiming that the POCO M3 has a particular callback buffer size or that the
  reverb is the cause.
- Changing samples, limiter settings, velocity, chord scheduling, interaction
  handlers, or progression timing.
- Adding a visible settings control for a temporary investigation feature.

## Acceptance criteria

1. The normal URL still uses `Sampler or PolySynth → Reverb → Volume → Limiter
   → destination`.
2. The diagnostic dry URL uses `Sampler or PolySynth → Volume → Limiter →
   destination`; no alternate engine, volume mapping, or limiter is introduced.
3. The dry parameter is read once at startup and never changes the normal URL
   or persists in local storage.
4. A diagnostic attack record identifies its input source, chord, note count,
   scheduled times, and monotonic sequence number. It must not alter playback
   scheduling.
5. The diagnostic code is removable as one bounded feature after the affected
   device comparison.
6. A POCO M3 comparison can answer one question: does the crackle occur in
   normal playback, dry playback, both, or neither during equivalent ordinary
   use?

## Verification

- Add focused tests for URL parsing, normal-versus-dry routing selection, and
  one attack record per `triggerAttackChord` invocation.
- Run the focused tests and `npm run build` once implemented.
- On the POCO M3, use the normal URL and dry URL during ordinary playing. Record
  the observed crackle class for each; no fixed trial count is required.

## Outcome

The affected musician reported an Intermittent Playback Crackle in both normal
and dry playback. Bypassing `Tone.Reverb` therefore does not remove the
symptom. Reverb is not a sufficient direct cause; this one comparison does not
distinguish render underruns, limiter or destination distortion, or duplicate
and late input attacks.

## Next evidence

Use the normal audio path with Chrome Android remote DevTools. The one-off
`scripts/poco-m3-audio-trace.sh` wizard captures the first crackle's Render
Capacity, callback interval, callback buffer size, sample rate, and
`AudioContext` state. This is the next probe because it can confirm or reject a
real-time render underrun without changing the phone's audio graph.

## Decision

Use a reversible diagnostic build before a permanent audio change. A blind
reverb removal could hide a render-capacity issue, would change the intended
sound for every Android musician, and would not distinguish level distortion
or duplicated input events. No ADR is needed: this diagnostic is local and
intended for removal. The canonical symptom term is **Intermittent Playback
Crackle** in `CONTEXT.md`. Source-backed findings are in
`docs/sdd/research/2026-08-26-poco-m3-chrome-tone-audio-crackle.md`.
