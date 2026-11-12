import { useCallback, useMemo, useState } from "react";
import { Step, STATUS, EVENTS, EventData } from "react-joyride";
import { useTranslation } from "react-i18next";

const SEEN_KEY = "musical-modes-onboarding-seen";
const LEGACY_SEEN_KEY = "musical-modes-tour-seen";
// The flag is a list of finished tours so records written when panels had
// their own tours stay readable. Only "core" exists now.
const CORE_SEEN = JSON.stringify(["core"]);

function readCoreSeen(): boolean {
  const raw = localStorage.getItem(SEEN_KEY);

  if (raw) {
    // The new key wins outright. Drop the legacy flag without reading it.
    localStorage.removeItem(LEGACY_SEEN_KEY);
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.includes("core");
    } catch {
      return false;
    }
  }

  if (localStorage.getItem(LEGACY_SEEN_KEY)) {
    localStorage.setItem(SEEN_KEY, CORE_SEEN);
    localStorage.removeItem(LEGACY_SEEN_KEY);
    return true;
  }

  return false;
}

export function useOnboardingTour() {
  const { t } = useTranslation();

  const steps: Step[] = useMemo(
    () => [
      {
        target: "#modes",
        content: t("tour.rootKeyStep"),
        skipBeacon: true,
      },
      {
        target: ".legends-wrapper",
        content: t("tour.toggleModesStep"),
      },
      {
        target: "table",
        content: t("tour.playChordStep"),
      },
    ],
    [t]
  );

  const [tourRun, setTourRun] = useState(() => !readCoreSeen());
  const [tourStepIndex, setTourStepIndex] = useState(0);

  const handleJoyrideEvent = useCallback((data: EventData) => {
    const { action, index, status, type } = data;
    if (type === EVENTS.STEP_AFTER) {
      setTourStepIndex(index + 1);
    }
    if (status === STATUS.FINISHED || action === "skip") {
      localStorage.setItem(SEEN_KEY, CORE_SEEN);
      setTourRun(false);
      setTourStepIndex(0);
    }
  }, []);

  const restartTour = useCallback(() => {
    localStorage.removeItem(SEEN_KEY);
    setTourStepIndex(0);
    setTourRun(true);
  }, []);

  return {
    visibleSteps: tourRun ? steps : [],
    tourRun,
    tourStepIndex,
    handleJoyrideEvent,
    restartTour,
  };
}
