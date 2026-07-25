# Context

Glossary of domain terms for this project. Terms here are canonical — use them in
code, copy, docs and conversation. No implementation details.

## Embed Widget

The stripped-down, self-contained view of a chord progression, intended to be
placed on a web page the author does not control. It shows one mode row per
distinct mode in the progression and can play the progression back.

Not to be confused with the **main app**, which is the full page a musician
visits directly. "Widget" on its own is ambiguous — always say Embed Widget.

## Author

The person copying an Embed Snippet in order to put a progression on their own
page. Distinct from the **musician**, who is whoever later lands on that page
and presses play. The Embed Preview serves the author; the Embed Widget serves
the musician.

## Host Page

The page an Embed Snippet is pasted into. The author controls its content but
often not its platform, so a snippet must assume the host page may strip
scripts and may give the widget an arbitrary amount of room.

## Size Contract

The agreement between the Embed Widget and the Embed Snippet about how much
room the widget needs on the Host Page. Because a snippet is frozen at copy
time, the size it declares must be derivable from the progression alone. Any
widget behaviour that makes size depend on the Host Page instead breaks the
contract.

## Embed Snippet

The block of HTML an author copies to their clipboard in order to put an Embed
Widget on their page. It fully determines what the widget will show: the
progression, the key, the accidental preference, the tempo, and the size the
widget will be given on the host page.

A snippet is a **frozen artifact**: once copied, it does not track later changes
to the app or to the progression it came from.

## Embed Preview

An in-app rendering of an Embed Snippet, shown to the author before they copy
it. Its purpose is to answer "will this snippet work when I paste it
somewhere?" — not merely "what does the widget look like?".

A preview is only trustworthy if it renders the *same* snippet the author will
copy. A preview that re-derives its own equivalent snippet is not an Embed
Preview; it is a mock-up, and can silently disagree with the clipboard.

### What an Embed Preview is answerable for

- **Fit** — the widget is given the right amount of room; it is neither clipped
  nor surrounded by dead space.
- **Content** — the progression, key, accidentals and tempo baked into the
  snippet are the ones the author chose.

### What it is deliberately not answerable for

- **Framing policy** — whether a third-party site is permitted to frame the
  widget at all. That is a deployment concern, not an authoring concern.
