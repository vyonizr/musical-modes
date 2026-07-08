# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # starts serwist in watch mode + Next.js dev server (via concurrently)
npm run build    # Next.js production build + serwist SW build
npm start        # serve production build
```

Tests: `npm test` (vitest). No linter — do not add one without an explicit request.

## Architecture

Single-page Next.js 16 app (Pages Router). All UI state lives in `src/pages/index.tsx`. `TableContent.tsx` is purely presentational.

**Core data flow:**
1. User picks a root key → `generateModes(scale, preferSharp)` in `src/utils/generateModes.ts` computes all 7 diatonic modes by rotating the Ionian interval pattern (`W W H W W W H`)
2. Returns `Mode[]` (name, intervals, romanNumerals, chords) — types in `src/utils/types/index.ts`
3. `TableContent` renders one row per mode; chord cells call `triggerAttackChord()` / `triggerReleaseChord()` in `src/utils/chords.ts` (Tone.js `PolySynth`, lazily initialised on first interaction)

**URL state:** `?key=C&modes=ionian,dorian&acc=flat` — key, active modes, and accidental preference are synced to/from the query string via `history.replaceState`. `♭` is encoded as `b` in the URL; `acc` is `flat` or `sharp`.

**Key selector UI:** Root key is chosen via a CSS piano keyboard (`.piano-keyboard`, white/black key buttons) and a `.chromatic-grid` fallback grid (visible at smaller widths). Both render from `PIANO_WHITE_KEYS`, `PIANO_BLACK_KEYS`, `CHROMATIC_ROW1`, `CHROMATIC_ROW2` in `src/utils/constants.ts` and call `setSelectedScale(KEYS[index])`. The ♭/♯ toggle (`preferSharp` state) switches which of `KEYS` / `KEYS_SHARP` is displayed.

**Keyboard mapping:** `KEY_ROWS` in `src/utils/constants.ts` maps keyboard rows (Q–U / A–J / Z–M) to chord columns for the first three active mode rows. Modifier keys change chord flavour: `,` = flat-7, `.` = maj7, `k` = sus2, `l` = sus4. Modifiers can be pressed before or after a chord key — held chords transform live. Keyboard handlers in `index.tsx` use refs alongside state to avoid stale closures — follow the same pattern if extending.

**Chord flavours:** `ChordFlavor` (`"flat7" | "maj7" | "sus4" | "sus2"`) in `src/utils/chords.ts` threads from keyboard state in `index.tsx` → `TableContent` as `activeFlavour` prop → `display7thChordName()` / `displaySusChordName()` changes the displayed label; `triggerAttackChord(chord, flavour)` changes the notes played. Guitar voicing tables for each flavour/quality combination are in `chords.ts`. Every chord root is folded into the same fixed register (`ANCHOR_MIDI ± 6` semitones) before offsets are applied, so switching roots never causes an octave jump — see `docs/sdd/specs/2026-07-07-chord-voicing-register-balance.md`.

**Onboarding tour:** `react-joyride` runs once on first visit; `localStorage('musical-modes-tour-seen')` gates it. Restartable via the `?` link in the footer.

**Import paths** use `baseUrl: "."` (tsconfig), so imports look like `src/utils/types` not `../../utils/types`. Follow existing pattern.

**Design docs** live in `docs/sdd/specs/` as dated markdown files (e.g. `2026-07-01-feature-name.md`). Check there before implementing a feature — specs often contain rationale, voicing tables, and out-of-scope decisions that aren't obvious from the code.

**Chord progression examples:** `PROGRESSIONS` in `src/utils/progressions.ts` is a hand-authored list (`Progression { id, name, bpm?, steps: {mode, degreeIndex, flavour?, bars?}[], songs }`). Rendered by `ProgressionsPanel.tsx` (collapsible panel above the mode table), which resolves each step's roman numeral against the currently-selected key's `Mode[]` and plays it via `onPlay` → the same `triggerAttackChord`/`triggerReleaseChord` chord engine. Convention: `id` is the kebab-case of `name`, and both should describe the progression's harmonic movement/character, not just the source song. Borrowed chords (e.g. a ♭VII landing in a major-key progression) are built by pointing a step at `aeolian`'s scale degree while the rest of the progression's steps use `ionian` — see `double-plagal` and `backdoor-vamp` — rather than modeling the whole progression in `mixolydian`, to stay consistent with how `detectKey` now prefers to explain these shapes (see below). Cadence labels are *not* shown in this panel (removed — was previously computed via `classifyCadence` but read as redundant/noisy next to the roman-numeral pattern).

**Key finder:** `detectKey(sections, preferSharp)` in `src/utils/detectKey.ts` takes user-typed chord sections (space/comma separated tokens, one string per section) and scores every root × `{ionian, aeolian, dorian, mixolydian}` combination to guess the key, driven from the "Detect Key" UI in `index.tsx` (~line 590-670). Scoring weights each mode's own scale-degree chords (`WEIGHTS`, tonic/IV weighted highest), adds a smaller `BORROWED_WEIGHT` for chords explainable via `BORROW_SOURCES` (e.g. ionian borrowing from aeolian/lydian), and penalizes chords no candidate mode can explain (`NON_DIATONIC_WEIGHT`). Bonuses reward opening/closing on the tonic, a IV→I or V→I resolution anywhere in a section, and the *whole progression* (not just a section) ending on the tonic. **Deliberate tie-break:** a bare `♭VII-IV-I` vamp (e.g. `G F C G`) resolves to the *Ionian* reading with `♭VII` borrowed from Aeolian, not the Mixolydian tonic reading — `BORROWED_WEIGHT` (0.75) is tuned so a borrowed-but-otherwise-fully-major explanation edges out a same-score modal one. If you touch `WEIGHTS`/`BORROWED_WEIGHT`, re-check `detectKey.test.ts`'s mixolydian-vs-ionian cases — they encode this preference on purpose, it's not an oversight.

**Cadence classification:** `classifyCadence(romanNumerals)` in `src/utils/cadence.ts` names a small set of hard-coded roman-numeral patterns (Authentic, Plagal, Double Plagal, Aeolian, Half cadence) by scanning for them anywhere in the sequence (not just at the end) and returns per-step root-motion labels (`authentic`/`plagal`/`step-up`/etc.) regardless of match. It is currently exercised only by `cadence.test.ts` / `progressions.test.ts` and is not wired into any UI — reach for it if you need cadence naming again, rather than re-deriving the pattern list.

## Key Gotchas

- **PWA / service worker only activates in production.** `serwist.config.mjs` configures the SW; `next.config.mjs` has no PWA config. The dev script runs serwist in `--watch` mode but the SW is not registered by the browser in dev.
- **Chord cells use `onMouseDown`/`onMouseUp`/`onMouseLeave`**, not `onClick` — `onMouseDown` is intentional for mobile autoplay policy; `onMouseUp`/`onMouseLeave` trigger release. Do not change.
- **iOS audio is blocked by design.** WebAudio requires a user gesture; the app does not work around this. Known limitation, not a bug.
- **`tsconfig.json` has `strict: false`.** Do not tighten without being asked.
- **`package.json` overrides** (`serialize-javascript`, `postcss`) are security pins. Preserve them.
- **Prettier config** (`prettierrc.json`) is empty — uses defaults only.
- **Package manager**: use `npm` (`package-lock.json` is the only lockfile present).
