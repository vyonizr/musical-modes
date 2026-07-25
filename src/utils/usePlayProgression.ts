import { useCallback, useEffect, useRef, useState } from "react";
import { Mode } from "src/utils/types";
import { Progression } from "src/utils/progressions";
import {
  triggerAttackChord,
  dampChord,
  ChordFlavor,
  ChordHandle,
} from "src/utils/chords";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function usePlayProgression() {
  const [activeProgressionStep, setActiveProgressionStep] = useState<{
    mode: string;
    degreeIndex: number;
    flavour?: ChordFlavor;
  } | null>(null);
  const [activeProgressionId, setActiveProgressionId] = useState<string | null>(null);

  const activeProgressionIdRef = useRef<string | null>(null);
  const playbackGenRef = useRef(0);
  const activeProgressionChordRef = useRef<ChordHandle | null>(null);

  // Unmounting mid-chord (embed teardown, route change) must not leave the
  // last chord sounding.
  useEffect(
    () => () => {
      playbackGenRef.current++;
      dampChord(activeProgressionChordRef.current);
      activeProgressionChordRef.current = null;
    },
    []
  );

  const handlePlayProgression = useCallback(
    async (progression: Progression, modes: Mode[]) => {
      dampChord(activeProgressionChordRef.current);
      activeProgressionChordRef.current = null;

      const wasPlayingThis = activeProgressionIdRef.current === progression.id;
      if (wasPlayingThis) {
        playbackGenRef.current++;
        activeProgressionIdRef.current = null;
        setActiveProgressionStep(null);
        setActiveProgressionId(null);
        return;
      }

      const gen = ++playbackGenRef.current;
      activeProgressionIdRef.current = progression.id;
      setActiveProgressionId(progression.id);

      for (let i = 0; i < progression.steps.length; i++) {
        if (playbackGenRef.current !== gen) break;
        const step = progression.steps[i];
        const mode = modes.find((m) => m.name === step.mode);
        if (!mode) continue;
        const chord = mode.chords[step.degreeIndex];
        setActiveProgressionStep({
          mode: step.mode,
          degreeIndex: step.degreeIndex,
          flavour: step.flavour,
        });
        activeProgressionChordRef.current = triggerAttackChord(
          chord,
          step.flavour
        );
        const durationMs =
          (step.bars ?? 1) * 4 * (60000 / (progression.bpm ?? 120));
        await delay(durationMs - 80);
        if (playbackGenRef.current !== gen) break;
        // Playback timing is authored, not performed: the step duration above
        // already says how long this chord rings. A latched pedal must not
        // smear the progression into one cluster.
        dampChord(activeProgressionChordRef.current);
        activeProgressionChordRef.current = null;
      }

      if (playbackGenRef.current === gen) {
        activeProgressionIdRef.current = null;
        setActiveProgressionStep(null);
        setActiveProgressionId(null);
      }
    },
    []
  );

  return { activeProgressionStep, activeProgressionId, handlePlayProgression };
}
