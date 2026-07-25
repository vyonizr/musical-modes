import { useCallback, useMemo, useState } from "react";
import { Step, STATUS, EVENTS, EventData } from "react-joyride";
import { useTranslation } from "react-i18next";

const SEEN_KEY = "musical-modes-onboarding-seen";
const LEGACY_SEEN_KEY = "musical-modes-tour-seen";

export type TourId = "core" | "detector" | "progressions" | "builder";

function readSeen(): TourId[] {
  const raw = localStorage.getItem(SEEN_KEY);

  if (raw) {
    // The new key wins outright. Drop the legacy flag without reading it.
    localStorage.removeItem(LEGACY_SEEN_KEY);
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as TourId[]) : [];
    } catch {
      return [];
    }
  }

  if (localStorage.getItem(LEGACY_SEEN_KEY)) {
    // Someone who finished the old linear tour has seen the basics and
    // nothing else. Panel tours stay unseen so they still fire.
    const migrated: TourId[] = ["core"];
    localStorage.setItem(SEEN_KEY, JSON.stringify(migrated));
    localStorage.removeItem(LEGACY_SEEN_KEY);
    return migrated;
  }

  return [];
}

export function useOnboardingTour() {
  const { t } = useTranslation();

  const TOURS: Record<TourId, Step[]> = useMemo(
    () => ({
      core: [
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
      detector: [
        {
          target: ".key-detector-toggle",
          content: t("tour.keyDetectorStep"),
          skipBeacon: true,
        },
      ],
      progressions: [
        {
          target: ".progressions-toggle",
          content: t("tour.progressionsStep"),
          skipBeacon: true,
        },
      ],
      builder: [
        {
          target: ".builder-steps-list",
          content: t("tour.builderStep"),
          skipBeacon: true,
        },
        {
          target: ".builder-copy-btn",
          content: t("tour.builderEmbedStep"),
        },
      ],
    }),
    [t]
  );

  const [seen, setSeen] = useState<TourId[]>(readSeen);
  const [activeTour, setActiveTour] = useState<TourId | null>(
    seen.includes("core") ? null : "core"
  );
  const [tourStepIndex, setTourStepIndex] = useState(0);

  const markSeen = useCallback((id: TourId) => {
    setSeen((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      localStorage.setItem(SEEN_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const handleJoyrideEvent = useCallback(
    (data: EventData) => {
      const { action, index, status, type } = data;
      if (type === EVENTS.STEP_AFTER) {
        setTourStepIndex(index + 1);
      }
      if (status === STATUS.FINISHED || action === "skip") {
        if (activeTour) markSeen(activeTour);
        setActiveTour(null);
        setTourStepIndex(0);
      }
    },
    [activeTour, markSeen]
  );

  const startTour = useCallback(
    (id: TourId) => {
      if (activeTour !== null) return;
      if (seen.includes(id)) return;
      setTourStepIndex(0);
      setActiveTour(id);
    },
    [activeTour, seen]
  );

  const restartTour = useCallback(() => {
    localStorage.removeItem(SEEN_KEY);
    setSeen([]);
    setTourStepIndex(0);
    setActiveTour("core");
  }, []);

  return {
    visibleSteps: activeTour ? TOURS[activeTour] : [],
    tourRun: activeTour !== null,
    tourStepIndex,
    handleJoyrideEvent,
    restartTour,
    startTour,
  };
}
