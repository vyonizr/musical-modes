# Play button hover: the icon disappears

**Date:** 2026-07-26
**Status:** Approved, ready for implementation plan

## Problem

Hovering the play button on a chord progression row makes its icon nearly
invisible. The icon turns white and sits on an almost-white background.

The cause is not a colour choice. It is a partial override left by a duplicated
stylesheet section.

`src/styles/modes.css` contains the `/* Progressions Panel */` section twice, at
lines 319-433 and 828-926. Both are top level. Neither is inside a media query,
so both are always live and the later one wins per declaration.

The two hover rules, read from the live CSSOM:

| Line | Rule | Declarations |
| --- | --- | --- |
| 425 | `.play-progression-btn:hover` | `background: var(--primary); color: #fff` |
| 919 | `.play-progression-btn:hover` | `background: rgba(66, 133, 244, 0.08)` |

Equal specificity `(0,2,0)`, so source order decides each declaration
separately. Line 919 wins `background`. Line 919 never declares `color`, so
line 425's `color: #fff` survives.

Confirmed by forcing the pseudo-state over CDP:

```json
{
  "color": "rgb(255, 255, 255)",
  "background": "rgba(66, 133, 244, 0.08)",
  "svgStroke": "rgb(255, 255, 255)"
}
```

`rgba(66, 133, 244, 0.08)` composited over the white row is `#F0F5FE`. A white
icon on it measures **1.09:1**. Line 919 was written intending a light hover
tint; it just never finished the job the rule it shadowed had started.

A second, smaller problem rides along. The icons are lucide's stroke-only
shapes: `<Play size={14} />` is a 2px outlined triangle and `<Square size={14} />`
a 2px outlined square. Even in the states that are not broken, thin strokes at
3.55:1 read poorly. WCAG's 3:1 non-text floor is measured for solid shapes, not
hairlines.

## Scope

Two buttons, two classes:

- `.play-progression-btn` — used by `ProgressionsPanel` and `ProgressionBuilder`.
  Has the invisible-icon bug.
- `.embed-play-btn` (`modes.css:1016-1041`) — used by `EmbedWidget`. Not
  duplicated, so its solid-blue hover is intact. No invisible-icon bug, but the
  same thin strokes and the same hover/playing state collision.

Both are in scope. They should behave identically.

## Decisions

### 1. Delete the stale block, keep the later one

Remove `modes.css:408-433` entirely — the whole `.play-progression-btn` trio in
the first block.

Deleting the base rule (408-423) alongside the two state rules is safe, and
verifiably so: the surviving base at 902-917 declares the same fourteen
properties. The only difference is `font-size` (`0.9em` vs `0.85em`), and
`0.85em` already wins today. Computed styles before and after the deletion are
identical.

The alternative — patching line 919 to also set `color: var(--primary)` — would
work, but it leaves two competing rules for one button and depends on their
order staying put. That is the exact shape of the current bug.

### 2. Hover is a light tint; the solid fill means playing

Replace `modes.css:919-926` with:

```css
.play-progression-btn:not(.playing):hover {
  background: rgba(66, 133, 244, 0.08);
}

.play-progression-btn.playing {
  background: var(--primary);
  color: #fff;
}

.play-progression-btn.playing:hover {
  filter: brightness(0.92);
}
```

The tint matches the file's existing hover idiom — `.progressions-toggle:hover`,
`.key-detector-toggle:hover`, `.add-section-btn:hover`,
`.progression-builder-toggle:hover` and `.builder-add-btn:hover` all use exactly
`rgba(66, 133, 244, 0.08)`.

Before this change hover and `.playing` rendered identically, so hovering an
idle button made it look like it was already playing. Separating them gives the
solid fill a single meaning.

`:not(.playing)` is deliberate. Plain `:hover` and `.playing` are both `(0,2,0)`
and only source order separates them. `:not(.playing):hover` is `(0,3,0)` and is
order-independent. Given that fragile ordering caused this bug, the selector
should not re-create the hazard.

`filter: brightness(0.92)` gives hover feedback on a button that is already
playing without introducing a second blue. The palette in `globals.css` has one.

### 3. Fill the icons

At all three call sites:

```tsx
{active ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
```

This works, and was verified against the installed `lucide-react@1.23.0` rather
than assumed. In `Icon` (`lucide-react.js:82-95`) the component's `...rest` is
spread *after* `...defaultAttributes`, so a `fill` prop overrides the root
`<svg>`'s `fill: "none"`. Both icon nodes are a single shape carrying no `fill`
of their own — `Play` is one `path`, `Square` one `rect` — so each inherits it.

The fill applies in every state, not only on hover. The shape then stays
constant and only its colours change, which is why the fix is a legibility fix
rather than a hover effect.

### 4. Same three rules for the embed

Replace `modes.css:1033-1041` with:

```css
.embed-play-btn:not(.playing):hover {
  background: rgba(66, 133, 244, 0.08);
}

.embed-play-btn.playing {
  background: var(--primary);
  color: #fff;
}

.embed-play-btn.playing:hover {
  filter: brightness(0.92);
}
```

The `.embed-play-btn` base rule (1016-1031) is unchanged.

This does change what already-pasted iframes render, because an embed loads the
live app. The Embed Snippet freezes the progression, key, tempo and iframe size
— not the app's styling. Accepted deliberately: leaving the two play buttons on
different hover behaviour is worse than the drift.

## Resulting contrast

| State | Icon | Background | Ratio |
| --- | --- | --- | --- |
| Hover, today | `#fff`, 2px stroke | `#F0F5FE` | **1.09:1** |
| Idle | `#4285f4`, solid | `#fff` | 3.55:1 |
| Hover | `#4285f4`, solid | `#F0F5FE` | 3.25:1 |
| Playing | `#fff`, solid | `#4285f4` | 3.55:1 |
| Playing + hover | `#EBEBEB`, solid | `#3d7ae0` | 3.48:1 |

Every state clears the 3:1 non-text floor, and every state is now a solid shape,
which is the geometry that ratio is defined for.

`filter: brightness` darkens the icon along with the background, which is why
the playing-hover row is 3.48:1 and not higher. It stays above the floor and the
change is visible, which is all that state needs to do.

## Side effect: sticky hover on touch

Touch browsers leave `:hover` applied after a tap until the user taps elsewhere.
Today that means tapping play leaves the button in the broken hover state after
playback finishes — an invisible icon on a button that is no longer playing.
Making hover a light tint removes the failure. No touch-specific code is needed.

## Explicitly not doing

- **No merge of the duplicated `/* Progressions Panel */` section.** Filed as its
  own ticket. It cannot be a straight deletion: the two blocks disagree on
  `.progression-name` (`0.9em` vs `0.85em`), `.progression-songs` (`0.75em` vs
  `0.7em`), and row spacing (block B adds `margin-bottom: 6px` on top of block
  A's `gap: 6px`, so rows currently sit 12px apart). Block A also centres the
  panel with `margin: 0 auto 1em`, which block B does not. Any consolidation has
  to preserve today's computed values property by property.
- **No new colour tokens.** `--primary` stays the only blue in `globals.css`.
- **No `.copy-embed-btn` change.** It is already legible: it shifts
  `--disabled` to `--primary` on hover and never inverts.
- **No `computeEmbedHeight` change.** Nothing changes size, so previously copied
  snippets keep their baked-in height.
- **No new tests.** This is a CSS and icon-prop change with no new observable
  contract. The existing suite must stay green.

## Files touched

| File | Change |
| --- | --- |
| `src/styles/modes.css` | Delete 408-433; replace 919-926; replace 1033-1041 |
| `src/components/ProgressionsPanel.tsx` | `fill="currentColor"` on both icons (line 118) |
| `src/components/ProgressionBuilder.tsx` | `fill="currentColor"` on both icons (line 180) |
| `src/components/EmbedWidget.tsx` | `fill="currentColor"` on both icons (line 111) |

## Verification

Computed styles, not eyeballing. For each of the three surfaces — the
progressions panel, the builder, and `/?embed=1` — force `:hover` and read back
the computed values:

1. **Hover idle.** `color` is `rgb(66, 133, 244)`, not `rgb(255, 255, 255)`.
   `background-color` is the tint. The icon is visible.
2. **Playing.** Solid `--primary` background, filled white square.
3. **Hover while playing.** Background stays solid `--primary` — not the tint —
   and the button renders visibly darker.
4. **Deletion is inert.** Computed styles of an idle `.play-progression-btn`
   are unchanged from before the change.
5. `npm test` — existing suite green, including
   `ProgressionsPanel.test.tsx`'s assertion that the copy control renders an
   icon rather than a literal HTML entity.
