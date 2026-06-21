# AGENTS.md — musical-modes

## Commands

```bash
# Dev server (--webpack is required; Next 16 defaults to Turbopack, but next-pwa needs webpack)
yarn dev

# Production build + start (PWA/service worker only active in production)
yarn build
yarn start
```

The package manager in docs says Yarn, but only `package-lock.json` exists (no `yarn.lock`). If `yarn` fails, use `npm`.

## Architecture

- **Next.js 16** (Pages Router), React 19, TypeScript (`strict: false`)
- **PWA**: `@ducanh2912/next-pwa` — **disabled in dev** (`disable: process.env.NODE_ENV === 'development'` in `next.config.js`). Service worker, offline caching, and install prompts only work in production builds.
- **Styling**: Plain CSS (global + CSS Modules). No Tailwind, no CSS-in-JS.
- Entry: `src/pages/index.tsx` — single-page app, all state lives there.

## Key Gotchas

1. **`yarn dev` requires `--webpack`**. The `dev` script in `package.json` already includes it. Next 16 defaults to Turbopack, but this project's PWA plugin (`next-pwa`) only works with webpack. Do not remove the `--webpack` flag.

2. **`tsconfig.json` has `strict: false`**. Type errors are not build-blocking. Don't "fix" type strictness without being asked.

3. **No test framework, no ESLint**. Do not add either without explicit request.

4. **`.prettierrc.json` is empty** — just uses Prettier defaults. There is no custom config despite what stale docs may claim.

5. **Audio playback uses `onMouseDown`** (not `onClick`) on chord cells — this is intentional for mobile autoplay policy compatibility. Do not change to `onClick`.

6. **`next-pwa` build excludes**: `buildExcludes: [/middleware-manifest.json$/]`. If adding middleware later, this may need updating.

7. **`package.json` `overrides`** pin `serialize-javascript` and `postcss` for security. Preserve them, don't "clean up".

8. **iOS audio blocked**: `playChord()` in `src/utils/chords.ts` shows an alert on iOS. Browser autoplay policies prevent programmatic audio on iOS Safari. This is a known limitation, not a bug.

9. **Import paths**: Components use non-relative imports like `src/utils/types` (no `../` prefix). The `baseUrl: "."` in `tsconfig.json` enables this. Follow the existing pattern.

## Source Layout

| Directory | Purpose |
|-----------|---------|
| `src/pages/` | Next.js Pages Router (single page: `index.tsx`) |
| `src/components/` | `Slider.tsx` (roman numeral toggle), `TableContent.tsx` (one row per mode) |
| `src/utils/` | `generateModes.ts` (core theory), `chords.ts` (audio mapping), `constants.ts` (KEYS, MODES_LIST), `getOS.ts`, `modulo.ts` |
| `public/assets/audio/` | OGG chord files (major, minor, dim × 12 keys) |
