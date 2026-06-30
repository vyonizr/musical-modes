# SDD: MIDI Synthesis — Replace OGG Audio with Tone.js

**Date:** 2026-06-30  
**Status:** Approved  

---

## 1. Overview

Replace the 36 static OGG files and DOM `<audio>` element system with real-time in-browser chord synthesis using Tone.js `PolySynth`. Chords are computed from note data rather than looked up as audio file paths. Playback is hold-until-release across all modes. The first 3 active modes gain keyboard shortcuts.

---

## 2. Chord-to-Notes Computation

A pure function replaces `chordsSwitch`. Given a chord name string (e.g. `"Fm"`, `"G♭dim"`), it:

1. Parses root + quality from the chord string (root may include `♭` or `♯`; suffix `m` = minor, `dim` = diminished, no suffix = major)
2. Selects inversion based on root:

| Root | Inversion | Notes (major example) |
|---|---|---|
| C, D♭, D, E♭, E | Root position | C4, E4, G4 |
| F, G♭, G | Second inversion (fifth in bass) | C4, F4, A4 |
| G♯/A♭, A, B♭, B | First inversion (third in bass) | C4, E♭4, A♭4 |

3. Applies interval offsets by quality:
   - Major: +0, +4, +7 semitones
   - Minor: +0, +3, +7 semitones
   - Diminished: +0, +3, +6 semitones
4. Returns a string array of note names Tone.js accepts (e.g. `["C4", "F4", "A4"]`)

The inversion table is chosen so all chords stay within approximately the C4–B4 window, avoiding octave jumps between adjacent root keys.

---

## 3. Synth Configuration

A single `Tone.PolySynth` instance is created once on page load and reused for all playback.

- **Oscillator:** `triangle` — softer harmonic content, closer to piano timbre than sawtooth
- **Envelope:** fast attack (~5 ms), short decay (~300 ms), low sustain (~20%), medium release (~500 ms)
- **Max polyphony:** 6 voices (3 notes × 2 margin for overlapping releases)

No new synth instance is created per chord tap.

---

## 4. Playback Model

All chord cells across all modes use hold-until-release:

| Event | Action |
|---|---|
| `mousedown` / `keydown` | `synth.triggerAttack(notes)` |
| `mouseup` / `mouseleave` / `keyup` | `synth.triggerRelease(notes)` |

On `keydown`, if the chord is already attacking (OS key-repeat), the event is ignored — no re-trigger.

There is no fixed playback duration. The Tone.js release envelope fades the sound naturally after the user releases.

The iOS `getOS()` guard and its alert are removed entirely. `onMouseDown` satisfies the Web Audio API user-gesture requirement on iOS.

---

## 5. Keyboard Shortcuts

Key bindings map dynamically to the first 3 **currently active** modes at the time of the event. Active mode order follows the display order in the table.

| Key row | Maps to |
|---|---|
| `Q W E R T Y U` | 1st active mode, chords 1–7 |
| `A S D F G H J` | 2nd active mode, chords 1–7 |
| `Z X C V B N M` | 3rd active mode, chords 1–7 |

- Bindings are derived from the live active mode list on each event — no pre-computed static map.
- If fewer than 3 modes are active, the corresponding key row does nothing.
- Global `keydown` and `keyup` listeners are attached in `index.tsx` (the component that owns active-mode state).
- Key events are ignored when focus is inside a text input (guard against accidental triggers).

---

## 6. Files Changed

| File | Change |
|---|---|
| `src/utils/chords.ts` | Full rewrite: chord-name parser, inversion logic, note array output, Tone.js `triggerAttack` / `triggerRelease` calls |
| `src/components/TableContent.tsx` | Remove `<audio>` elements; add `onMouseUp` and `onMouseLeave` handlers alongside existing `onMouseDown` |
| `src/pages/index.tsx` | Add global `keydown` / `keyup` listeners; derive key→chord mapping from active modes |
| `public/assets/audio/` | Delete all 36 OGG files |
| `package.json` | Add `tone` as a dependency |

---

## 7. What Does Not Change

- `generateModes` and all music theory logic
- `Mode` interface and `constants.ts`
- `Slider.tsx` and roman numeral toggle
- Mode toggle (show/hide) behavior
- `onMouseDown` as the primary interaction trigger (keyboard adds to it, not replaces it)
- CSS, styling, layout
