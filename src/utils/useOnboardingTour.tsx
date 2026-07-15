import { useCallback, useMemo, useState } from "react";
import { Step, STATUS, EVENTS, EventData } from "react-joyride";
import { useTranslation } from "react-i18next";

const TOUR_SEEN_KEY = "musical-modes-tour-seen";

export function useOnboardingTour(isTouchDevice: boolean) {
  const { t } = useTranslation();

  const TOUR_STEPS: Step[] = [
    {
      target: "#modes",
      content: t("tour.rootKeyStep"),
      skipBeacon: true,
    },
    {
      target: ".accidental-toggle",
      content: (
        <span>
          Switch between flat (<code>♭</code>) and sharp (<code>♯</code>){" "}
          spelling for accidental notes. Same sound, different notation.
        </span>
      ),
    },
    {
      target: ".legends-wrapper",
      content: t("tour.toggleModesStep"),
    },
    {
      target: "table",
      content: t("tour.playChordStep"),
    },
    {
      target: "table",
      content: (
        <span>
          Your keyboard maps to the chords too. <code>Q</code> through{" "}
          <code>U</code> for the top row, <code>A</code> through <code>J</code>{" "}
          for the second, <code>Z</code> through <code>M</code> for the third.
        </span>
      ),
    },
    {
      target: "#modifier-hint",
      content: (
        <span>
          Hold <code>,</code> or <code>.</code> for 7th chords; <code>k</code>{" "}
          or <code>l</code> for sus chords. You can press a modifier before or
          after a chord key. Hold a chord and add the modifier to hear it
          transform instantly.
        </span>
      ),
    },
    {
      target: ".key-detector-toggle",
      content: t("tour.keyDetectorStep"),
    },
    {
      target: ".progressions-toggle",
      content: t("tour.progressionsStep"),
    },
  ];

  const [tourRun, setTourRun] = useState(
    () => !localStorage.getItem(TOUR_SEEN_KEY)
  );
  const [tourStepIndex, setTourStepIndex] = useState(0);

  const handleJoyrideEvent = useCallback((data: EventData) => {
    const { action, index, status, type } = data;
    if (type === EVENTS.STEP_AFTER) {
      setTourStepIndex(index + 1);
    }
    if (status === STATUS.FINISHED || action === "skip") {
      setTourRun(false);
      localStorage.setItem(TOUR_SEEN_KEY, "true");
    }
  }, []);

  const restartTour = useCallback(() => {
    setTourRun(true);
    setTourStepIndex(0);
  }, []);

  const visibleSteps = useMemo(() => {
    if (isTouchDevice) {
      return TOUR_STEPS.filter((s) => s.target !== "#modifier-hint");
    }
    return TOUR_STEPS;
  }, [isTouchDevice, t]);

  return {
    visibleSteps,
    tourRun,
    tourStepIndex,
    handleJoyrideEvent,
    restartTour,
  };
}
