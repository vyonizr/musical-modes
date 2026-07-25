# Onboarding: restructuring one linear tour into per-surface tours

**Date:** 2026-07-25
**Status:** Approved, ready for implementation plan

## Problem

`useOnboardingTour.tsx` runs one linear eight-step tour on first visit. It has
two failures, one visible today and one that gets worse every release.

**It teaches nothing past the third step.** Step 6 explains that `,` and `.`
produce 7th chords. At that point the user has not played a chord. There is
nothing for the fact to attach to, so it is gone by the time they could use it.
Steps four through eight are all in this position.

**It cannot stay current.** Adding a feature means adding a step, which makes
the tour longer and its completion rate lower. Worse, `musical-modes-tour-seen`
is a single boolean: anyone who finished the tour once never sees a new step,
ever. The Progression Builder — the newest and largest feature, including the
whole embed authoring flow — has no coverage at all, and simply appending steps
would not reach a single existing user.

The tour also mixes conventions. Five steps use `t()`; three carry hardcoded
English JSX.

## Approach

Replace the single tour with **four independent tours**, each owning its own
seen-flag. First run teaches only the core loop. Everything behind a toggle is
taught the first time that toggle is opened.

The toggles are the reason this works. Key Detector, Progressions and
Progression Builder each sit behind a button the user must click. That click is
the user asking to be taught, and it is a far better teaching moment than step
seven of a cold tour.

```
First visit ──> Core tour (3 steps)
                    │
                    v
              User explores
                    ├── opens Key Detector ──────> Detector tour (1 step)
                    ├── opens Progressions ──────> Progressions tour (1 step)
                    └── opens Progression Builder > Builder tour (2 steps)
```

First run drops from 8 steps to 3. No user is ever shown more than 3 steps in
one sitting. A future feature behind a new panel costs 0 steps for users who
never open it.

## Decisions

### 1. Four tours replace one

| Tour | Fires | Steps | Targets |
| --- | --- | --- | --- |
| `core` | First visit | 3 | `#modes`, `.legends-wrapper`, `table` |
| `detector` | First open of Key Detector | 1 | `.key-detector-toggle` |
| `progressions` | First open of Progressions | 1 | `.progressions-toggle` |
| `builder` | First open of Progression Builder | 2 | `.builder-steps-list`, `.builder-copy-btn` |

The core tour reorders the surviving steps to follow the actual first-use
sequence: set the root key, choose which modes are shown, then play a chord.
Today `.legends-wrapper` comes after the accidental toggle and before `table`;
removing the accidental step makes the order contiguous.

### 2. Three steps leave onboarding

**Accidental toggle (current step 2) is deleted outright.** It is a preference
control with two visibly-labelled states, not a concept. Its copy was inline
JSX, so no i18n key is orphaned.

**Keyboard map (step 5) and modifier keys (step 6) move to the shortcuts
disclosure** described in decision 5. Their JSX moves verbatim.

### 3. Active-tour state

One `<Joyride>` instance stays in `App.tsx`. Only one tour can run at a time;
the hook decides which steps it is fed.

```ts
type TourId = "core" | "detector" | "progressions" | "builder";

const TOURS: Record<TourId, Step[]> = { core: [...], detector: [...], ... };

const [activeTour, setActiveTour] = useState<TourId | null>(null);
```

- `visibleSteps` becomes `activeTour ? TOURS[activeTour] : []`
- `tourRun` becomes `activeTour !== null`
- `tourStepIndex` and the `EVENTS.STEP_AFTER` increment survive unchanged
- on `STATUS.FINISHED` or `action === "skip"`, the hook marks the active tour
  seen and sets `activeTour` back to `null`

`startTour(id: TourId)` is added to the hook's return value. It sets
`activeTour = id` and `tourStepIndex = 0`, so a tour always begins at its own
first step. It no-ops when `id` is already in the seen list, or when
`activeTour !== null`. Both guards live here and nowhere else.

### 4. Persistence and migration

The boolean is replaced by one key holding a list:

```
musical-modes-onboarding-seen  →  ["core","detector"]
```

One read on mount, one write per completed tour.

Migration runs once on mount: if `musical-modes-tour-seen` exists, seed the
list with `["core"]` and delete the legacy key. Existing users are treated as
having seen the basics and nothing else. They are not re-onboarded, and they do
get the Builder tour the first time they open the builder. That is the point of
the restructure.

If both keys somehow exist, the new list wins and the legacy key is deleted
without being read.

### 5. `#modifier-hint` becomes a shortcuts disclosure

`App.tsx:281-288` is today an always-visible `<p>` listing four modifier keys.
It becomes a native `<details>`:

```tsx
{!isTouchDevice && (
  <details id="modifier-hint" className="black" style={{ marginTop: "0.25rem" }}>
    <summary>Hold <code>,</code> &middot; <code>.</code> &middot; <code>k</code> &middot; <code>l</code> for 7th / sus chords</summary>
    {/* row map + modifier detail, moved from TOUR_STEPS[4] and TOUR_STEPS[5] */}
  </details>
)}
```

Native `<details>`, not a state-driven component: no `useState`, no ARIA to
wire, keyboard and screen-reader behaviour come free.

The summary keeps today's text, so collapsed it is a no-op visual change.
Expanded it adds the two things currently trapped in tour steps: the row map
(`Q`-`U` top row, `A`-`J` second, `Z`-`M` third) and the modifier detail
(a modifier may be pressed before or after a chord key; holding a chord and
adding a modifier transforms it live). Both move as verbatim JSX.

The `!isTouchDevice` gate is new. The tour filtered this content for touch
devices; the paragraph itself never did, so touch users are currently shown
keyboard shortcuts they cannot use. This is why `isTouchDevice` stops being a
tour argument and becomes a render condition in `App.tsx` — it moves rather
than disappears.

Per the convention visible across the codebase, strings carrying inline
`<code>` markup stay as JSX and are not extracted to `en.json`. `<Trans>` is
used nowhere and is not introduced here.

### 6. Panels report opens, the hook dedupes

Each panel gains a required `onOpen: () => void` prop, called on the
closed→open transition of its existing local `open` state. Required rather than
optional so a panel left unwired is a type error rather than a tour that
silently never fires. Panels do not know what "first" means; the hook dedupes
against the seen list.

```tsx
<ProgressionBuilder onOpen={() => startTour("builder")} ... />
```

`KeyDetectorPanel` closes itself programmatically at `KeyDetectorPanel.tsx:130`
after a detected key is applied. That is a close, so it cannot fire `onOpen`.
Reopening the panel afterwards fires `onOpen` again, which the hook no-ops if
the tour is already seen.

### 7. The `?` button resets everything

`restartTour` clears the seen list and sets `activeTour = "core"`. Panel tours
re-arm and fire the next time each panel is opened.

The transition-only rule in decision 6 handles the awkward case for free: a
panel that is already open when `?` is clicked produces no closed→open
transition, so its tour does not stack on top of the core tour. It arms for
next time.

### 8. Two new i18n keys

All five existing `tour` content keys survive, redistributed across tours.
`joyrideNext` / `joyrideSkip` / `joyrideLast` are shared by all four.

Added to the `tour` block in `src/locales/en.json`:

- **`tour.builderStep`** — arranging steps, choosing mode and degree per step,
  setting bars and BPM, hearing it back.
- **`tour.builderEmbedStep`** — that the progression can be copied out as an
  embed for the author's own page, and that the snippet is **frozen**: later
  edits in the builder do not reach a page it was already pasted into.

The frozen-snippet property is the one thing in the builder a user cannot infer
from the interface. `CONTEXT.md` states it directly ("once copied, it does not
track later changes"). No button label warns of it, and the failure is silent:
the author edits the progression, assumes their blog updated, and it did not.
That is what the second step exists for.

Nothing is deleted from `en.json`, so `i18n-unused` stays clean.

## Explicitly not doing

- **No menu on the `?` button.** A user who clicks `?` is asking because they
  cannot name what they are missing; a menu asks them to answer the question
  they came with. It is also a UI to build and translate for a rarely-clicked
  control.
- **No tour step pointing at the shortcuts disclosure.** Its content is a
  visible line of text under the table. If a user cannot find visible text, a
  popup indicating it is not the fix.
- **No mini-tour on first chord play.** First chord play is the moment the app
  pays off. A popup over it trades the best moment in the product for reference
  material the user did not ask for.
- **No third builder step for the preview button.** Its label reads "Preview
  embed". Narrating labelled buttons is the padding that makes people press
  Skip — and skipping would cost them the frozen-snippet step.
- **No volume slider step.** A labelled slider needs no tour.
- **No `<Trans>` adoption, no extraction of markup-bearing strings.**
- **No CSS changes.** `<details>` is unstyled here; the summary inherits
  `.black` exactly as the `<p>` did.

## Files touched

| File | Change |
| --- | --- |
| `src/utils/useOnboardingTour.tsx` | `TOURS` record, `activeTour` state, `startTour`, list persistence with legacy migration; `isTouchDevice` arg and `visibleSteps` filter removed |
| `src/App.tsx` | `#modifier-hint` becomes touch-gated `<details>`; `onOpen` wired to three panels |
| `src/components/KeyDetectorPanel.tsx` | `onOpen` prop, fired on closed→open |
| `src/components/ProgressionsPanel.tsx` | `onOpen` prop, fired on closed→open |
| `src/components/ProgressionBuilder.tsx` | `onOpen` prop, fired on closed→open |
| `src/locales/en.json` | `tour.builderStep`, `tour.builderEmbedStep` added |
| `src/utils/useOnboardingTour.test.tsx` | New |
| `src/components/ProgressionBuilder.test.tsx` | One case added |
| `src/components/ProgressionsPanel.test.tsx` | Existing render gains the now-required `onOpen` prop |

## Testing

Existing convention, from `ProgressionsPanel.test.tsx`: vitest,
`// @vitest-environment jsdom`, `@testing-library/react`, `react-i18next`
mocked so `t` returns its key, colocated `*.test.tsx`.

`useOnboardingTour` has no tests today and is about to hold all the branching.
New file `src/utils/useOnboardingTour.test.tsx`, driven through `renderHook`
with `localStorage` cleared between cases:

1. **Fresh visitor** — empty storage; `core` is active on mount.
2. **Legacy migration** — storage has `musical-modes-tour-seen=true`; `core`
   does not run, `startTour("builder")` does run, and the legacy key is absent
   afterwards.
3. **Dedupe** — `startTour("builder")` twice; the second call no-ops.
4. **Mutual exclusion** — with `core` running, `startTour("detector")` no-ops.
5. **Reset** — `restartTour()` clears the seen list and makes `core` active.

One case added to `ProgressionBuilder.test.tsx`: opening the panel calls
`onOpen`; closing and reopening calls it again. This pins the transition
contract the hook depends on.

Joyride's own rendering is not tested. `<details>` is not tested — native
markup, no logic.

## Verification

1. Clear `localStorage`, load the app. Three steps run: root key, mode toggles,
   play a chord. Tour ends.
2. Open Key Detector. One step runs. Close and reopen. Nothing runs.
3. Open Progression Builder. Two steps run, the second covering the embed and
   the frozen snippet.
4. Reload. Nothing runs.
5. Click `?`. Core tour runs again. Open the builder: its two steps run again.
6. Click `?` with the builder already open. Core tour runs; no builder tour
   stacks on top. Close and reopen the builder: its tour runs then.
7. Set `musical-modes-tour-seen=true`, clear the new key, reload. No core tour.
   Open the builder: its tour runs. Confirm `musical-modes-tour-seen` is gone
   from `localStorage`.
8. On desktop, the shortcuts line under the table expands to the row map and
   modifier detail. In mobile emulation, it is absent entirely.
