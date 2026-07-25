import { useCallback, useEffect, useState } from "react";
import { setSustain } from "src/utils/chords";
import { isTextInput } from "src/utils/useChordKeyboardInput";

// Space already means "scroll the page" and "activate the focused control".
// Claiming it unconditionally would break both, and the second one bites
// immediately: the pedal's own toggle button keeps focus after a click.
function spaceIsSpokenFor(target: EventTarget | null): boolean {
  if (isTextInput(target)) return true;
  const active = document.activeElement;
  if (!active) return false;
  const tag = active.tagName.toLowerCase();
  return (
    tag === "button" ||
    tag === "input" ||
    tag === "select" ||
    tag === "textarea"
  );
}

/**
 * The sustain pedal's React state and its keyboard shortcut.
 *
 * A latch, not a momentary hold. The chord surface already has two
 * simultaneous hold classes — a chord key and a flavour modifier — and a
 * held pedal would make three. A latch adds none.
 */
export function useSustainPedal() {
  const [sustainOn, setSustainOn] = useState(false);

  const toggleSustain = useCallback(() => setSustainOn((prev) => !prev), []);

  // The engine's flag is module state, so it is driven from the rendered
  // value rather than from inside the toggle. That keeps the state updater
  // free of side effects, which React may run more than once per update.
  useEffect(() => {
    setSustain(sustainOn);
  }, [sustainOn]);

  // Separate from the effect above on purpose: a combined effect would damp
  // every sustained chord each time the pedal is raised.
  useEffect(() => () => setSustain(false), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      if (e.repeat) return;
      if (spaceIsSpokenFor(e.target)) return;
      e.preventDefault();
      toggleSustain();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [toggleSustain]);

  return { sustainOn, toggleSustain };
}
