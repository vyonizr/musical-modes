# musical-modes — Copilot Instructions

## Project Overview
A Next.js + TypeScript web app that displays musical modes (Ionian, Dorian, Phrygian, Lydian, Mixolydian, Aeolian, Locrian) and their chord qualities for a selected root key. Users can toggle modes on/off, switch between note names and Roman numerals, and tap chords to play them.

## Tech Stack
- **Framework**: Next.js 12 with React 17
- **Language**: TypeScript (strict)
- **Styling**: Plain CSS (no Tailwind or CSS-in-JS)
- **PWA**: next-pwa
- **Formatter**: Prettier (`prettier.config.json`)
- **Package manager**: Yarn

## Project Structure
```
src/
  pages/        # Next.js pages (_app.tsx, _document.tsx, index.tsx)
  components/   # React components (Slider.tsx, TableContent.tsx)
  utils/        # Business logic and helpers
    constants.ts       # KEYS, MODES_LIST, COLOR_CLASSNAMES
    generateModes.ts   # Core mode generation logic
    chords.ts          # Chord definitions
    types/             # TypeScript type definitions
```

## Coding Conventions
- Use **functional components** with React hooks only (no class components)
- Use **TypeScript** with explicit types; avoid `any`
- Follow existing **Prettier** config — run formatter before committing
- Use named exports for utilities; default export for pages and components
- CSS class names use kebab-case (e.g., `table-container`, `legends-wrapper`)
- Color/mode class names come from `COLOR_CLASSNAMES` (keys of `MODES_LIST`)

## Key Domain Concepts
- **Mode**: one of the 7 diatonic modes; each has a `degree` (0–6) and an array of 7 `chords_quality` values
- **Root Key**: one of 12 chromatic keys in `KEYS` (uses ♭ symbols, e.g., `D♭`)
- **Chord quality**: strings like `'major'`, `'minor'`, `'diminished'`, `'flat major'`, `'sharp diminished'`
- `generateModes(selectedScale)` returns an array of `Mode` objects for the selected key

## Important Notes
- No test framework is set up — do not add one without being asked
- No linting (ESLint) is configured — do not add it without being asked
- Scripts: `yarn dev`, `yarn build`, `yarn start`
