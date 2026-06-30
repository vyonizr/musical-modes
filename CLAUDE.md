# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # dev server (--webpack flag is baked in — required, do not remove)
npm run build    # production build (PWA/service worker only active here)
npm start        # serve production build
```

No test runner, no linter. Do not add either without an explicit request.

## Architecture

Single-page Next.js 16 app (Pages Router). All UI state lives in `src/pages/index.tsx`. The two components (`Slider.tsx`, `TableContent.tsx`) are purely presentational.

**Core data flow:**
1. User picks a root key → `generateModes(key)` in `src/utils/generateModes.ts` computes all 7 diatonic modes by rotating the Ionian interval pattern (`W W H W W W H`)
2. Returns `Mode[]` (name, intervals, romanNumerals, chords) — types in `src/utils/types/index.ts`
3. `TableContent` renders one row per mode; chord cells play audio via `playChord()` in `src/utils/chords.ts`

**Import paths** use `baseUrl: "."` (tsconfig), so imports look like `src/utils/types` not `../../utils/types`. Follow existing pattern.

## Key Gotchas

- **`--webpack` is mandatory** in dev. Turbopack (Next 16 default) breaks `next-pwa`. Already in the `dev` script.
- **PWA is disabled in dev** (`disable: process.env.NODE_ENV === 'development'` in `next.config.js`). Service worker and offline only work in production builds.
- **Chord cells use `onMouseDown`**, not `onClick` — intentional for mobile autoplay policy. Do not change.
- **iOS audio is blocked by design.** `playChord()` shows an alert on iOS. Known limitation, not a bug.
- **`tsconfig.json` has `strict: false`.** Do not tighten without being asked.
- **`package.json` overrides** (`serialize-javascript`, `postcss`) are security pins. Preserve them.
- **Prettier config** (`prettierrc.json`) is empty — uses defaults only.
- **Package manager**: README says Yarn but only `package-lock.json` exists. Use `npm`.
