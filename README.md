# Musical Modes

## The Problem

You're learning a mode. Say Dorian. You want to know: what chords do I actually play in A Dorian?

You could work it out from the interval formula. Or look it up in a book. Or, if you want to transpose it, do it all over again for every key.

Now say you're going deeper: modal mixture. You want to borrow a chord from the parallel minor (Aeolian) while you're in the major (Ionian). Which chords overlap? Which ones are the borrowed ones? That comparison doesn't live anywhere convenient.

Or you're working backwards. You heard a song, worked out its chords by ear, and now you want to know what key and mode it's actually in. And once you know, you're stuck on what to play next: every progression you reach for is the same four chords you always use.

## The Solution

**Musical Modes** puts every diatonic mode across all 12 root keys on a single interactive page and lets you *hear* the chords, not just read them.

Pick a root key on the piano. Tap a mode to see its chords. Tap any chord cell to play it.

Want to explore modal mixture? Toggle both Ionian and Aeolian on at the same time. Same root, both rows visible. You can see exactly which chords they share and which ones are borrowed.

Not sure what key a song's in? Type its chords into the key finder and it'll guess the key and mode. Want progression ideas? Browse a library of real chord progressions, resolved to your current key, and play them back.

**[Try it live →](https://modes.vyonizr.com/)**

## The Impact

You stop doing theory math mid-practice. You change the root key in one click, the whole page updates. You hear the chord before you explain it.

For modal mixture, the comparison is right there: multiple rows, same root, same page. No textbook cross-referencing.

Working backwards from chords to key stops being guesswork too. Type what you've got, get a key and mode back, then pull from a library of real progressions instead of defaulting to the same four chords.

## Features

- **Piano key selector**: 12 chromatic roots, flat or sharp spelling
- **7 diatonic modes**: Ionian through Locrian, toggle any combination
- **Tap or keyboard to play**: `Q`–`U` / `A`–`J` / `Z`–`M` map to chord columns; hold `,` `.` `k` `l` for 7th and sus voicings
- **Roman numeral labels**: every chord shows its scale degree (`vi`) alongside its name (`Am`)
- **Key finder**: type in a song's chords and get its key/mode guessed for you
- **Chord progressions**: a library of real progressions, resolved to your current key and playable in one tap
- **PWA**: installable, works offline after first load

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Vite + React |
| Language | TypeScript |
| Audio | Tone.js (PolySynth, guitar voicings) |
| PWA | vite-plugin-pwa |
| Styling | Plain CSS |

## Getting Started

```bash
git clone https://github.com/vyonizr/musical-modes.git
cd musical-modes
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

> PWA / service worker only activates in production builds (`npm run build && npm start`).
>
> Run the test suite with `npm test` (vitest).

---

## License

[GNU General Public License v3.0](LICENSE)
