# AGENTS.md

## Scope

Musical Modes is a React 19 single-page app built with Vite. It generates diatonic modes and chords, supports Tone.js playback, and provides embeddable progression widgets.

## Start here

- Read `CLAUDE.md` before changing code. It is the authoritative architecture reference, command list, and source of behavioural invariants.
- Read `CONTEXT.md` when work involves the Embed Widget, Embed Snippet, Embed Preview, Host Page, or Size Contract. Its terms are canonical.
- Read the relevant dated document in `docs/sdd/specs/` before changing a feature. Specs record intent, constraints, and out-of-scope decisions.
- Read applicable ADRs in `docs/adr/` when a change touches their subject.

## Working rules

- Use `npm`; `package-lock.json` is the only lockfile.
- Keep UI copy in `src/locales/en.json`; use `t()` for ordinary translated strings and `Trans` when markup is required.
- Keep imports rooted at `src/`.
- Preserve existing behavioural invariants in `CLAUDE.md`, especially chord-handle release ownership, URL state, embed size calculation, and progression playback.
- Make the smallest change that satisfies the requested behaviour. Do not add a linter or tighten TypeScript strictness without an explicit request.

## Verification

- Run `npm test` for behavioural changes.
- Run `npm run build` after production-code changes, including PWA or embed work.
- Run `npm run i18n:unused` after changing `src/locales/en.json` or its callers.
- For UI changes, exercise the changed flow in a browser.
