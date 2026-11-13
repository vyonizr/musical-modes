# Musical Modes

Musical Modes shows every diatonic mode in all 12 root keys and plays its chords. It's built with React, Vite, TypeScript, and Tone.js.

[Open the live app](https://modes.vyonizr.com/).

## Features

- **Piano key selector**: 12 chromatic roots, with flat or sharp spelling.
- **Diatonic modes**: Ionian through Locrian.
- **Playback**: tap a chord cell or press a key.
  - `Q` to `U`, `A` to `J`, and `Z` to `M` map to chord columns.
  - Hold `,`, `.`, `k`, or `l` for flat 7, maj7, sus2, or sus4.
- **Roman numeral labels**: each chord shows its scale degree (`vi`) and name (`Am`).
- **Key finder**: enter chords to get a likely key and mode.
- **Chord progressions**: a library of real progressions.
- **Progression builder**: build your custom progression and copy it as an embeddable `<iframe>`.
- **PWA**: installable and works offline.

## Embed a progression

To embed a built-in progression:

1. Open **Chord Progressions**.
1. Click **Copy embed code** next to a progression.

To embed a custom progression:

1. Open **Build a Progression**.
1. Add steps. For each step, set the mode, degree, flavour, and bars. Set **BPM**.
1. Optional: Click **Preview embed**.
1. Click **Copy embed code**.

## Run locally

You need Node 24.

```bash
git clone https://github.com/vyonizr/musical-modes.git
cd musical-modes
npm install
npm run dev
```

Go to `http://localhost:5173`.

Other commands:

- `npm test`: run the tests.
- `npm run build`: create a production build.
- `npm start`: serve the production build.
- `npm run i18n:unused`: list unused UI strings.

The service worker runs only in production builds.

For the architecture and contribution rules, see the [AGENTS.md](AGENTS.md) file.

## License

[GNU General Public License v3.0](LICENSE)

Piano samples are [Salamander Grand Piano V3](https://archive.org/details/SalamanderGrandPianoV3) by Alexander Holm, licensed under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/).
