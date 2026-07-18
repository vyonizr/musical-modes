# Migrate STRINGS.ts to react-i18next + unused-key tooling

**Date:** 2026-07-10
**Status:** Proposed

## Motivation

`src/utils/strings.ts` (added in [2026-07-10-extract-ui-strings.md](./2026-07-10-extract-ui-strings.md)) centralizes UI copy but gives no way to detect copy that's no longer referenced — it's a plain nested object, and generic unused-export tools (`knip`, `ts-prune`) only see the top-level `STRINGS` export, not its properties.

Purpose-built i18n tooling (`i18n-unused`, `i18next-parser`) solves exactly this — but only once copy is behind actual `t()` calls against a locale file. This spec migrates to `react-i18next` to get that tooling, without adding a second language yet.

## Scope

**In scope:**
- Add `react-i18next` + `i18next` as runtime deps, `i18n-unused` as a dev dep.
- Create `src/locales/en.json`, mirroring `STRINGS`'s existing namespace structure (`header`, `table`, `keyDetector`, `progressions`, `tour`, `footer`) as translation keys.
- Add `src/i18n.ts`: initializes `i18next` with the `en` bundle as the only, fixed language (no language detector, no switcher UI).
- Replace every `STRINGS.x.y` call site in `App.tsx`, `TableContent.tsx`, `ProgressionsPanel.tsx` with `t('x.y')` via `useTranslation()`.
- Parameterized entries (`sectionPlaceholder(n)`, `removeSectionLabel(n)`, `notAChord(tokens)`, `borrowedFrom(mode)`, `sectionLabel(n)`) become i18next interpolation: locale value `"Section {{n}} chords (e.g. C G Am F)"`, call site `t('keyDetector.sectionPlaceholder', { n })`.
- Delete `src/utils/strings.ts` — superseded by `en.json` + `t()`.
- Add an `npm run i18n:unused` script wrapping `i18n-unused` to list unused/missing keys, run manually for now (not wired into CI).

**Out of scope (unchanged from the prior spec, same reasoning):**
- The two JSX `TOUR_STEPS` entries and the `#modifier-hint` paragraph that interleave text with `<code>` tags. `react-i18next`'s `<Trans>` component is the correct tool for this (it lets translated text wrap child elements), but wiring it up is a distinct piece of work with its own edge cases — noted here as the natural follow-up, not pulled into this migration.
- CSS class names, `localStorage` keys, URL query params, ARIA/DOM technical strings, data-derived text — same exclusions as the prior spec.
- A language switcher UI and any second locale file — per your answer, this pass is structure + tooling only.
- Wiring `i18n:unused` into CI — starts as a manual/local check; promote to CI once the team trusts the signal (no false positives from the `<Trans>` follow-up messing with detection).

## Design

**Locale file** (`src/locales/en.json`), same shape as current `STRINGS`:
```json
{
  "header": { "title": "Musical Modes", "rootKeyLabel": "Root Key", "volumeLabel": "Volume" },
  "keyDetector": {
    "sectionPlaceholder": "Section {{n}} chords (e.g. C G Am F)",
    "removeSectionLabel": "Remove section {{n}}",
    "notAChord": "Not a chord: {{tokens}}"
  }
}
```

**Init** (`src/i18n.ts`):
```ts
import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import en from "./locales/en.json"

i18n.use(initReactI18next).init({
  resources: { en: { translation: en } },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
})

export default i18n
```
Imported once, side-effect only, from `main.tsx` (mirrors how `packageJson` is imported today).

**Component usage:**
```tsx
const { t } = useTranslation()
...
<h1 className="title black">{t("header.title")}</h1>
...
placeholder={t("keyDetector.sectionPlaceholder", { n: si + 1 })}
```

**Unused-key detection:**
```json
"scripts": {
  "i18n:unused": "i18n-unused display-unused --localesPath src/locales --srcPath src"
}
```
Run manually (`npm run i18n:unused`) when copy is removed or refactored, to catch stale locale entries `knip`/`ts-prune` can't see.

## Non-goals

- No language switcher, no second locale, no language auto-detection.
- No CI gate on unused keys yet — this is a developer-run check until the signal is proven reliable.
- No `<Trans>`-based migration of the JSX tour/hint content — flagged as future work, not built here.

## Verification

- `npm test` passes unchanged.
- Manual visual diff: app renders identically to the pre-migration `STRINGS.ts` version (same English copy, same interpolated values).
- `npm run i18n:unused` runs clean (no unused keys) immediately after migration, proving the tool is wired correctly before it's trusted for future refactors.
