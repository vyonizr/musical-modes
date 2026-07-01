# Musical Modes

## The Problem

You're learning a mode. Say Dorian. You want to know: what chords do I actually play in A Dorian?

You could work it out from the interval formula. Or look it up in a book. Or, if you want to transpose it, do it all over again for every key.

Now say you're going deeper: modal mixture. You want to borrow a chord from the parallel minor (Aeolian) while you're in the major (Ionian). Which chords overlap? Which ones are the borrowed ones? That comparison doesn't live anywhere convenient.

## The Solution

**Musical Modes** puts every diatonic mode across all 12 root keys on a single interactive page and lets you *hear* the chords, not just read them.

Pick a root key on the piano. Tap a mode to see its chords. Tap any chord cell to play it.

Want to explore modal mixture? Toggle both Ionian and Aeolian on at the same time. Same root, both rows visible. You can see exactly which chords they share and which ones are borrowed.

**[Try it live →](https://modes.vyonizr.com/)**

## The Impact

You stop doing theory math mid-practice. You change the root key in one click, the whole page updates. You hear the chord before you explain it.

For modal mixture, the comparison is right there: multiple rows, same root, same page. No textbook cross-referencing.

## Features

- **Piano key selector** — 12 chromatic roots, flat or sharp spelling
- **7 diatonic modes** — Ionian through Locrian, toggle any combination
- **Tap or keyboard to play** — `Q`–`U` / `A`–`J` / `Z`–`M` map to chord columns; hold `,` `.` `k` `l` for 7th and sus voicings
- **Roman numeral view** — switch between chord names (`Am`) and scale degrees (`vi`)
- **PWA** — installable, works offline after first load

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (Pages Router) |
| Language | TypeScript |
| Audio | Tone.js (PolySynth, guitar voicings) |
| PWA | Serwist |
| Styling | Plain CSS |

## Getting Started

```bash
git clone https://github.com/vyonizr/musical-modes.git
cd musical-modes
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> PWA / service worker only activates in production builds (`npm run build && npm start`).

---

## License

[GNU General Public License v3.0](LICENSE)
