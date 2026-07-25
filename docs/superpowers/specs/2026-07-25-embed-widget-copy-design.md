# Embed widget copy: replacing "Custom progression"

**Date:** 2026-07-25
**Status:** Approved, ready for implementation plan

## Problem

The embed widget labels user-built progressions "Custom progression". The word
is filler. The header already shows the roman-numeral pattern and the BPM
directly beneath it, so the label adds no information. Worse, "custom" is
written from the builder's point of view: the person reading the widget is a
stranger on a blog post who never opened the builder, so they have nothing to
contrast "custom" against.

The string is hardcoded in three places with three different audiences, all
using the same words:

| Location | Audience | Currently |
| --- | --- | --- |
| `src/components/EmbedWidget.tsx:39` | Reader of the embedded widget | "Custom progression" |
| `src/components/ProgressionBuilder.tsx:40` | Nobody, never rendered | "Custom progression" |
| `src/utils/embed.ts:43` | Screen readers, crawlers (iframe `title`) | "Custom progression — Musical Modes" |

It is also the only user-facing string in the app that does not go through
`t()`. Everything else lives in `src/locales/en.json`.

## Audience

The embed is primarily for the author dropping progressions into their own blog
posts, and secondarily for other people using it to teach. Both audiences are
readers, not builders. Copy should describe the progression or credit the tool,
never describe how the progression was authored.

## Decisions

### 1. Header name becomes "Made with Musical Modes"

`EmbedWidget.tsx:100` renders the name only for the custom case:

```tsx
{progression.id === "custom" ? t("embed.customName") : progression.name}
```

Preset progressions keep their real names ("Mario Cadence", "Backdoor Vamp").
`buildProgression` already stamps `id: "custom"` when the URL carries `steps`,
so no new state is needed.

The lookup happens at the render site rather than inside `buildProgression`
(line 39). That function is defined outside the component where `t` is not
available, and it should stay pure.

`name` is required on the `Progression` interface, so `buildProgression`
cannot drop the field. It becomes `name: ""` — the displayed name now comes
from the render site, and leaving the old copy there would be a stale second
source of truth.

### 2. New i18n key

Add to `src/locales/en.json` under the existing `embed` block:

```json
"embed": {
  "backlink": "modes.vyonizr.com",
  "customName": "Made with Musical Modes"
}
```

This moves the last hardcoded user-facing string into i18n.

### 3. Footer backlink becomes "modes.vyonizr.com"

`embed.backlink` changes from "Musical Modes" to "modes.vyonizr.com".

Without this, the widget would say "Musical Modes" twice in a 456px box, about
100px apart. Naming the domain instead keeps the attribution, avoids the
repetition, and tells a reader where the link goes. The domain matches the
canonical URL in `index.html:20`.

The `↗` in `EmbedWidget.tsx:140` sits outside the i18n string and stays.

The `href` stays relative (`/?${backlinkParams}`). Inside an iframe it resolves
against the iframe document's own origin, which is modes.vyonizr.com, so the
link text and destination agree.

### 4. iframe title stays descriptive

`embed.ts:43` becomes:

```ts
`Chord progression in ${selectedScale} — Musical Modes`
```

`buildStepsEmbedSnippet` already receives `selectedScale` as a parameter, so no
new plumbing. This string is announced by screen readers and indexed by
crawlers, where the key is the one piece of context roman numerals cannot
carry. "Made with Musical Modes" would be useless here.

Preset embeds keep `${progression.name} — Musical Modes` with no key. Adding
the key there is a separate change and out of scope.

## Explicitly not doing

- **`ProgressionBuilder.tsx:40` stays as-is.** Its `name` field exists only to
  satisfy the required `name: string` on the `Progression` interface before the
  object is handed to `onPlay`. It is never rendered. Changing it is churn.
- **No CSS changes.** An earlier option dropped the name entirely and promoted
  the pattern to be the title, which would have needed a modifier class on
  `.embed-header-info` because `.embed-progression-pattern` is styled as a
  subtitle (`0.8em`, weight 600) under a `0.95em` weight-700 name. Keeping the
  name slot filled avoids that work.
- **No `computeEmbedHeight` re-measure.** The comment at `embed.ts:9-14`
  requires re-measuring if `.embed-backlink` changes. Only its text changes.
  "modes.vyonizr.com ↗" at `0.75em` centered in a 456px box is roughly 110px
  wide, so it cannot wrap and the 14px line stays one line.
- **No key added to preset embed titles.**

## Files touched

| File | Change |
| --- | --- |
| `src/components/EmbedWidget.tsx` | Line 39 becomes `name: ""`; line 100 gains the conditional |
| `src/locales/en.json` | `embed.backlink` reworded, `embed.customName` added |
| `src/utils/embed.ts` | Line 43 title string |

## Verification

1. Open the builder, add a 3-4 step progression, click "Preview embed".
   Header reads "Made with Musical Modes" above the pattern and BPM.
   Footer reads "modes.vyonizr.com ↗".
2. Load a preset embed URL (`/?embed=1&progression=mario-cadence&key=C`).
   Header still reads "Mario Cadence". Footer reads the domain.
3. Copy the embed snippet for a custom progression and confirm the `title`
   attribute reads `Chord progression in C — Musical Modes`.
4. Click the footer link from inside the preview iframe and confirm it opens
   modes.vyonizr.com with the key and modes preserved.
