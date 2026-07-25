# The Embed Widget has a fixed width, not a fluid one

**Status:** accepted

The Embed Widget is deliberately a fixed-width box, and the Embed Snippet is a
bare `<iframe>` with both width and height baked in at copy time. A future
reader will reasonably assume the widget should be responsive and try to make
it so — this records why it isn't.

## Why

An Embed Snippet has to survive being pasted into pages the author does not
control, including platforms that strip `<script>` tags (Medium, Notion,
Substack). That rules out the only honest way to do a fluid widget: an iframe
cannot size itself to its content, so a width-responsive widget must report its
height back to the host page over `postMessage`, which requires the snippet to
carry a script. A one-line, script-free `<iframe>` is worth more than
responsiveness.

Fixing the width also keeps the height computable. The widget's height depends
on the number of mode rows and on which CSS breakpoint is active; the
breakpoint is a function of the frame's width. Fix the width and the height
becomes a pure function of the mode count, which is what the snippet needs in
order to bake a correct height in.

## Considered and rejected

**Fluid with a max width.** Preferred on the merits — it adapts to narrow host
pages — but it makes the baked height structurally unable to be correct, since
height then varies with width. Adopting it means adopting the `postMessage`
height protocol and giving up the script-free snippet. Revisit only if narrow
host pages become a real complaint.

## Consequences

- The widget's width and the snippet's `width` attribute are a single contract
  and must agree. They did not agree when this was written: the widget was
  456px inside a 375px frame, overflowing by 81px in every snippet copied to
  that point.
- The narrow-cell CSS breakpoint is part of that same contract. Changing the
  frame width can silently change the row height, and therefore invalidate the
  baked height.
- Snippets already copied by authors cannot be corrected. Any change to the
  size contract orphans them.
