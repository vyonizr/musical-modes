import { useEffect, useRef, useState } from "react";
import generateModes from "src/utils/generateModes";
import { KEY_ROWS } from "src/utils/constants";
import { Mode } from "src/utils/types";
import {
  triggerAttackChord,
  triggerReleaseChord,
  ChordFlavor,
} from "src/utils/chords";

const MODIFIER_KEYS: Record<string, ChordFlavor> = {
  ",": "flat7",
  ".": "maj7",
  k: "sus2",
  l: "sus4",
};

function isTextInput(target: EventTarget | null): boolean {
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
  const pressedChordsRef = useRef(new Map<string, ChordFlavor | undefined>());

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

    const retriggerHeldChords = (nextFlavour: ChordFlavor | undefined) => {
      pressedChordsRef.current.forEach((oldFlavour, chordName) => {
        triggerReleaseChord(chordName, oldFlavour);
        triggerAttackChord(chordName, nextFlavour);
        pressedChordsRef.current.set(chordName, nextFlavour);
      });
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

      const chordName = findChordForKey(e.key.toUpperCase(), getActiveModes());
      if (!chordName) return;

      const activeFlavour = sevenFlavourRef.current;
      pressedChordsRef.current.set(chordName, activeFlavour);
      setKeyboardPressedChords((prev) => [...prev, chordName]);
      triggerAttackChord(chordName, activeFlavour);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const rawKey = e.key;
      if (rawKey in MODIFIER_KEYS) {
        sevenFlavourRef.current = undefined;
        setActiveFlavour(undefined);
        retriggerHeldChords(undefined);
        return;
      }

      const chordName = findChordForKey(e.key.toUpperCase(), getActiveModes());
      if (!chordName) return;

      const flavour = pressedChordsRef.current.get(chordName);
      pressedChordsRef.current.delete(chordName);
      setKeyboardPressedChords((prev) => prev.filter((c) => c !== chordName));
      triggerReleaseChord(chordName, flavour);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      pressedChordsRef.current.forEach((flavour, chordName) =>
        triggerReleaseChord(chordName, flavour)
      );
      pressedChordsRef.current.clear();
    };
  }, []);

  return { activeFlavour, keyboardPressedChords };
}
