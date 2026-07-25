// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import { STATUS } from "react-joyride";
import { useOnboardingTour } from "./useOnboardingTour";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const SEEN_KEY = "musical-modes-onboarding-seen";
const LEGACY_SEEN_KEY = "musical-modes-tour-seen";

// handleJoyrideEvent only reads `status`, `action`, `index` and `type`, so a
// partial event is enough to drive it. EventData has many required fields we
// do not care about here.
const finishEvent = () => ({ status: STATUS.FINISHED } as never);

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
});

describe("useOnboardingTour first visit", () => {
  it("runs the three-step core tour when nothing has been seen", () => {
    const { result } = renderHook(() => useOnboardingTour());

    expect(result.current.tourRun).toBe(true);
    expect(result.current.visibleSteps).toHaveLength(3);
    expect(result.current.visibleSteps[0].target).toBe("#modes");
  });
});

describe("useOnboardingTour legacy migration", () => {
  it("treats a legacy flag as core-seen, still offers panel tours, and drops the old key", () => {
    localStorage.setItem(LEGACY_SEEN_KEY, "true");

    const { result } = renderHook(() => useOnboardingTour());

    expect(result.current.tourRun).toBe(false);

    act(() => result.current.startTour("builder"));

    expect(result.current.tourRun).toBe(true);
    expect(result.current.visibleSteps).toHaveLength(2);
    expect(localStorage.getItem(LEGACY_SEEN_KEY)).toBeNull();
  });
});

describe("useOnboardingTour dedupe", () => {
  it("does not replay a tour that has already finished", () => {
    localStorage.setItem(SEEN_KEY, JSON.stringify(["core"]));

    const { result } = renderHook(() => useOnboardingTour());

    act(() => result.current.startTour("builder"));
    expect(result.current.tourRun).toBe(true);

    act(() => result.current.handleJoyrideEvent(finishEvent()));
    expect(result.current.tourRun).toBe(false);

    act(() => result.current.startTour("builder"));
    expect(result.current.tourRun).toBe(false);
  });
});

describe("useOnboardingTour mutual exclusion", () => {
  it("ignores a start request while another tour is running", () => {
    const { result } = renderHook(() => useOnboardingTour());

    expect(result.current.visibleSteps).toHaveLength(3);

    act(() => result.current.startTour("detector"));

    expect(result.current.visibleSteps).toHaveLength(3);
    expect(result.current.visibleSteps[0].target).toBe("#modes");
  });
});

describe("useOnboardingTour reset", () => {
  it("clears every seen flag and reruns the core tour", () => {
    localStorage.setItem(SEEN_KEY, JSON.stringify(["core", "builder"]));

    const { result } = renderHook(() => useOnboardingTour());
    expect(result.current.tourRun).toBe(false);

    act(() => result.current.restartTour());

    expect(result.current.tourRun).toBe(true);
    expect(result.current.visibleSteps).toHaveLength(3);
    expect(localStorage.getItem(SEEN_KEY)).toBeNull();
  });
});
