import { useEffect, useRef, useState } from "react";
import generateModes from "src/utils/generateModes";
import { KEY_ROWS } from "src/utils/constants";
import { Mode } from "src/utils/types";
import {
  triggerAttackChord,
  triggerReleaseChord,
  dampChord,
  releaseAllChords,
  ChordFlavor,
  ChordHandle,
} from "src/utils/chords";

// Keyed by the keyboard key, not the chord name: two keys can resolve to the
// same chord, and the chord a key resolves to changes when the user switches
// key or mode mid-press.
type HeldChord = {
  chordName: string;
  handle: ChordHandle;
};

const MODIFIER_KEYS: Record<string, ChordFlavor> = {
  ",": "flat7",
  ".": "maj7",
  k: "sus2",
  l: "sus4",
};
export function isTextInput(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if (target.isContentEditable) return true;
  return false;
}

export function findChordForKey(
  key: string,
  activeModesData: Mode[]
): string | null {
  for (let row = 0; row < KEY_ROWS.length; row++) {
    const col = KEY_ROWS[row].indexOf(key);
    if (
      col !== -1 &&
      row < activeModesData.length &&
      col < activeModesData[row].chords.length
    ) {
      return activeModesData[row].chords[col];
    }
  }
  return null;
}

export function useChordKeyboardInput(
  selectedScale: string,
  activeModes: string[],
  preferSharp: boolean
) {
  const selectedScaleRef = useRef(selectedScale);
  const activeModesRef = useRef(activeModes);
  const preferSharpRef = useRef(preferSharp);
  const sevenFlavourRef = useRef<ChordFlavor | undefined>(undefined);
  const pressedChordsRef = useRef(new Map<string, HeldChord>());

  const [activeFlavour, setActiveFlavour] = useState<ChordFlavor | undefined>(
    undefined
  );
  const [keyboardPressedChords, setKeyboardPressedChords] = useState<
    string[]
  >([]);

  useEffect(() => {
    selectedScaleRef.current = selectedScale;
    activeModesRef.current = activeModes;
    preferSharpRef.current = preferSharp;
  }, [selectedScale, activeModes, preferSharp]);

  useEffect(() => {
    const getActiveModes = () =>
      generateModes(selectedScaleRef.current, preferSharpRef.current).filter(
        (m) => activeModesRef.current.includes(m.name)
      );

    const syncPressedChords = () =>
      setKeyboardPressedChords(
        Array.from(pressedChordsRef.current.values(), (h) => h.chordName)
      );

    // A flavour change rewrites the voicing of a chord the musician is still
    // holding. That is a correction, not a release, so it damps past the
    // pedal — otherwise the pre-modifier voicing would ring underneath.
    const retriggerHeldChords = (nextFlavour: ChordFlavor | undefined) => {
      pressedChordsRef.current.forEach((held, key) => {
        dampChord(held.handle);
        pressedChordsRef.current.set(key, {
          chordName: held.chordName,
          handle: triggerAttackChord(held.chordName, nextFlavour),
        });
      });
    };

    // The browser swallows keyup while the window is unfocused, so a held
    // chord would sustain forever. Drop everything we think is held instead.
    const handleWindowBlur = () => {
      pressedChordsRef.current.clear();
      syncPressedChords();
      releaseAllChords();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (isTextInput(e.target)) return;

      const rawKey = e.key;
      const flavour = MODIFIER_KEYS[rawKey];
      if (flavour) {
        sevenFlavourRef.current = flavour;
        setActiveFlavour(flavour);
        retriggerHeldChords(flavour);
        return;
      }

      const key = e.key.toUpperCase();
      const chordName = findChordForKey(key, getActiveModes());
      if (!chordName) return;
      if (pressedChordsRef.current.has(key)) return;

      pressedChordsRef.current.set(key, {
        chordName,
        handle: triggerAttackChord(chordName, sevenFlavourRef.current),
      });
      syncPressedChords();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const rawKey = e.key;
      if (rawKey in MODIFIER_KEYS) {
        sevenFlavourRef.current = undefined;
        setActiveFlavour(undefined);
        retriggerHeldChords(undefined);
        return;
      }

      const held = pressedChordsRef.current.get(e.key.toUpperCase());
      if (!held) return;

      pressedChordsRef.current.delete(e.key.toUpperCase());
      syncPressedChords();
      triggerReleaseChord(held.handle);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleWindowBlur);
      pressedChordsRef.current.forEach((held) => dampChord(held.handle));
      pressedChordsRef.current.clear();
    };
  }, []);

  return { activeFlavour, keyboardPressedChords };
}
