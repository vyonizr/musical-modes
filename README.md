# Musical Modes

A Progressive Web App that displays the diatonic chord qualities for all seven musical modes across any of the 12 chromatic root keys. Tap any chord to hear it played.

**[Live Demo →](https://modes.vyonizr.com/)**

---

## Features

- **12 root keys** — C, D♭, D, E♭, E, F, G♭, G, A♭, A, B♭, B
- **7 diatonic modes** — Ionian, Dorian, Phrygian, Lydian, Mixolydian, Aeolian, Locrian
- **Toggle modes** on/off to focus on the ones you care about
- **Roman numeral display** — switch between chord names (e.g. `Am`) and Roman numerals (e.g. `vi`)
- **Tap to play** — click or tap any chord cell to hear it (OGG audio, all 12 keys × 3 qualities)
- **PWA** — installable on desktop and Android; works offline after first load

> **Note:** Audio playback is not supported on iOS due to browser restrictions.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js](https://nextjs.org/) |
| Language | TypeScript |
| Styling | Plain CSS (CSS Modules + global stylesheets) |
| PWA | [@ducanh2912/next-pwa](https://github.com/DuCanhGH/next-pwa) |
| Formatting | [Prettier](https://prettier.io/) |
| Package manager | Yarn |

---

## Project Structure

```
musical-modes/
├── public/
│   ├── assets/
│   │   ├── audio/          # OGG chord audio files (major, minor, dim × 12 keys)
│   │   └── icons/          # PWA icons
│   └── manifest.json       # Web app manifest
└── src/
    ├── components/
    │   ├── Slider.tsx       # Toggle switch (Roman numeral mode)
    │   └── TableContent.tsx # Chord row for a single mode
    ├── pages/
    │   ├── _app.tsx
    │   ├── _document.tsx
    │   └── index.tsx        # Main page — state, controls, mode table
    ├── styles/
    │   ├── globals.css      # Base styles and layout
    │   ├── modes.css        # Per-mode color classes
    │   ├── normalize.css
    │   └── Slider.module.css
    └── utils/
        ├── constants.ts     # KEYS, MODES_LIST, COLOR_CLASSNAMES
        ├── generateModes.ts # Core music theory logic
        ├── chords.ts        # Chord → audio file mapping and playback
        ├── getOS.ts         # OS detection (for iOS audio guard)
        ├── modulo.ts        # True modulo (handles negative indices)
        ├── isStringInArray.ts
        ├── env.ts           # Site metadata constants
        └── types/
            └── index.ts     # Mode interface
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- Yarn

### Installation

```bash
git clone https://github.com/vyonizr/musical-modes.git
cd musical-modes
yarn install
```

### Development

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> PWA features (service worker, offline support) are disabled in development. Run a production build to test them.

### Production Build

```bash
yarn build
yarn start
```

---

## How It Works

### Mode Generation

Each of the 7 diatonic modes is derived from the Ionian (major) scale by rotating its interval pattern (`W W H W W W H`). For example, Dorian starts on the 2nd degree, so its intervals are `W H W W W H W`.

`generateModes(selectedScale)` iterates over all 7 modes, applies the interval rotation, then walks the chromatic `KEYS` array from the selected root to produce an array of `Mode` objects:

```ts
interface Mode {
  name: string          // e.g. "dorian"
  intervals: string[]   // e.g. ["W","H","W","W","W","H","W"]
  romanNumerals: string[] // e.g. ["i","ii","♭III","IV","v","vi°","♭VII"]
  chords: string[]      // e.g. ["Dm","Em","F","G","Am","Bdim","C"]
}
```

### Chord Qualities per Mode

| Degree | Ionian | Dorian | Phrygian | Lydian | Mixolydian | Aeolian | Locrian |
|--------|--------|--------|----------|--------|------------|---------|---------|
| I | maj | min | min | maj | maj | min | dim |
| II | min | min | ♭maj | maj | min | dim | ♭maj |
| III | min | ♭maj | ♭maj | min | dim | ♭maj | ♭min |
| IV | maj | maj | min | ♯dim | maj | min | min |
| V | maj | min | dim | maj | min | min | ♭maj |
| VI | min | dim | ♭maj | min | min | ♭maj | ♭maj |
| VII | dim | ♭maj | ♭min | min | ♭maj | ♭maj | ♭min |

### Audio Playback

Each chord cell renders a hidden `<audio>` element preloaded with the matching OGG file from `/assets/audio/`. On click/tap, `playChord()` triggers playback. If the audio is already playing, it restarts from the beginning.

---

## License

Licensed under the [GNU General Public License v3.0](LICENSE).
