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

Single-page Next.js 16 app (Pages Router). All UI state lives in `src/pages/index.tsx`. `TableContent.tsx` is purely presentational. (`Slider.tsx` exists but is currently unused.)

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

## Key Gotchas

- **PWA / service worker only activates in production.** `serwist.config.mjs` configures the SW; `next.config.mjs` has no PWA config. The dev script runs serwist in `--watch` mode but the SW is not registered by the browser in dev.
- **Chord cells use `onMouseDown`/`onMouseUp`/`onMouseLeave`**, not `onClick` — `onMouseDown` is intentional for mobile autoplay policy; `onMouseUp`/`onMouseLeave` trigger release. Do not change.
- **iOS audio is blocked by design.** WebAudio requires a user gesture; the app does not work around this. Known limitation, not a bug.
- **`tsconfig.json` has `strict: false`.** Do not tighten without being asked.
- **`package.json` overrides** (`serialize-javascript`, `postcss`) are security pins. Preserve them.
- **Prettier config** (`prettierrc.json`) is empty — uses defaults only.
- **Package manager**: README says Yarn but only `package-lock.json` exists. Use `npm`.
