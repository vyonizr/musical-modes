# Loading skeleton for the pre-mount blank page

Date: 2026-07-26
Status: awaiting review

## Problem

`index.html` ships `<div id="root"></div>` — empty. Until the 611 KB JS bundle
downloads, parses, and React mounts, the user sees a blank near-white page with
no indication anything is happening.

## What was rejected, and why

The original proposal was a loading bar that gates the app until the piano
samples are fetched. Measured against the built app in a throttled browser,
that is not worth doing.

Returning user, service worker precache warm:

| Network | App paints | Samples ready | Gap |
|---|---|---|---|
| Slow 4G | 444 ms | 404 ms | −40 ms |
| Fast 3G | 1280 ms | 1232 ms | −48 ms |
| Slow 3G | 4140 ms | 4109 ms | −31 ms |

Samples finish **before first paint**. The precache work already closed that
window; there is nothing left to gate on.

First-time visitor, cold cache:

| Network | App paints | Samples ready | Synth window |
|---|---|---|---|
| Fast 4G | 456 ms | 928 ms | 472 ms |
| Slow 4G | 1360 ms | 3376 ms | 2.0 s |
| Fast 3G | 2184 ms | 5038 ms | 2.9 s |
| Slow 3G | 7892 ms | 18817 ms | 10.9 s |

Only first-timers have a window, and gating them is strictly worse: on Slow 4G
they would wait until 3.4 s instead of using the app at 1.4 s. On Slow 3G,
18.8 s instead of 7.9 s. That trades a subtle timbre difference for a 2.5×
worse time-to-usable on the connections least able to afford it.

It also inverts the existing architecture. `chordEngine.test.ts` opens with
"the piano is an upgrade that arrives, never a dependency that blocks."

## Non-goals

- Gating, blocking, or delaying the app on sample readiness. Nothing here waits
  on audio.
- Any change to `preloadPiano()`, `unlockAudio()`, `ensurePiano()`, or the synth
  fallback.
- A progress bar with real percentages. There is no meaningful total to divide
  by, and the bundle is a single request.
- Fixing the pre-existing `theme-color` mismatch (`index.html` declares
  `#161a1d`; the body is `#f8f9fa`). Unrelated, noted only so the next reader
  does not think this spec introduced it.

## Design

Static skeleton markup inside `<div id="root">`, styled by an inline `<style>`
block in `<head>`. The browser paints it as soon as the HTML parses. When
`ReactDOM.createRoot().render()` runs, React clears the container and the
skeleton disappears.

No cleanup code, no state, no JavaScript, no React changes.

### Why the styles must be inline

`index-*.css` arrives at roughly the same time as the JS bundle it would be
covering for. A rule placed in the bundle lands after the window it exists to
fill. The same reasoning rules out using the `--primary` custom property from
`globals.css`: it is not available before that stylesheet loads, so the accent
colour is hardcoded to `#4285f4` (the current value of `--primary`). If
`--primary` ever changes, this value must be updated by hand.

### `index.html` changes

Add to `<head>`, immediately before `</head>`:

```html
  <style>
    .app-loading {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #f8f9fa;
    }
    .app-loading-spinner {
      width: 36px;
      height: 36px;
      border: 3px solid rgba(66, 133, 244, 0.2);
      border-top-color: #4285f4;
      border-radius: 50%;
      animation: app-loading-spin 0.8s linear infinite;
    }
    @keyframes app-loading-spin {
      to { transform: rotate(360deg); }
    }
    @media (prefers-reduced-motion: reduce) {
      .app-loading-spinner { animation: none; }
    }
  </style>
```

Replace the empty root element:

```html
<div id="root">
  <div class="app-loading" role="status" aria-label="Loading">
    <div class="app-loading-spinner"></div>
  </div>
</div>
```

`background-color: #f8f9fa` matches `globals.css`, so there is no flash when the
real stylesheet lands.

## Verified mechanism

The exact markup and CSS above were built and observed on Slow 3G (400 kbps,
2000 ms latency), DOM sampled once per second:

| t | `readyState` | spinner visible | computed background | app mounted |
|---|---|---|---|---|
| 3.1–4.1 s | `loading` | root not parsed yet | — | no |
| 5.1–7.1 s | `interactive` | yes | `rgb(248, 249, 250)` | no |
| 8.1 s | `complete` | no | — | yes |

React cleared the skeleton on mount with no cleanup code, confirming the
mechanism. Zero console errors and zero page errors throughout. The computed
background matches `#f8f9fa` exactly, confirming no flash when the real
stylesheet lands.

The spinner renders **42 × 42 px**, not 36: `width: 36px` plus the 3 px border
on each side, under the inherited `content-box` sizing. This is intentional and
left alone — a `box-sizing` override would be a line of CSS to fix an invisible
difference. Noted so the numbers in the CSS are not mistaken for the rendered
size.

The verification build was reverted; nothing was committed.

## Coverage limits

The skeleton covers **HTML parsed → React mounted**. It cannot cover the
network fetch of the HTML document itself, because `#root` does not exist until
that document arrives. In the Slow 3G run above it filled roughly 3 s (5.1 s to
8.1 s) of an 8.1 s total.

This shrinks the blank window. It does not eliminate it, and no in-page change
can.

## Error handling

There is no failure mode to handle.

- JS bundle never arrives: the spinner keeps spinning. That is the correct
  signal and strictly better than today's blank page.
- CSS bundle fails: the skeleton still renders, because its styles are inline.
- JS disabled: the spinner spins forever. Same as today's permanent blank page,
  no worse.

## Testing

No unit tests. There is no logic to assert — this is static markup, and a test
that greps `index.html` for a `div` would defend nothing and break on any
markup tweak.

Verification is the throttled browser check already used on the prototype,
re-run against the final build:

1. Build, serve, throttle to Slow 3G, clear site data.
2. While `document.readyState === "interactive"`, assert `.app-loading` is
   present and visible.
3. After mount, assert `.app-loading` is gone and `.playable-chord` exists.
4. Confirm no console errors.

Regression checks: the existing 159 tests across 16 files must stay green, and
the build must still emit 15 precache entries (the skeleton adds no assets).

## Files changed

- `index.html` — inline `<style>` block in `<head>`, skeleton markup inside
  `#root`

No other file changes.
