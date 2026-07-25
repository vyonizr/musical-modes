// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/react";
import ProgressionsPanel from "./ProgressionsPanel";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

afterEach(() => {
  cleanup();
});

// JSX only decodes the XHTML 1.0 named entity set, so HTML5-only names like
// &check; pass through as literal text. Guard the copy-confirmation glyph
// against a regression back to an entity.
const progression = {
  id: "p1",
  name: "Test Progression",
  steps: [{ mode: "Ionian", degreeIndex: 0 }],
  songs: ["Song A"],
} as never;

describe("ProgressionsPanel copy confirmation", () => {
  it("renders an icon, not a literal HTML entity", () => {
    const { container } = render(
      <ProgressionsPanel
        progressions={[progression]}
        modes={[]}
        onPlay={() => {}}
        activeProgressionId={null}
        onCopyEmbed={() => {}}
        onOpen={() => {}}
      />
    );

    fireEvent.click(container.querySelector(".progressions-toggle")!);
    fireEvent.click(container.querySelector(".copy-embed-btn")!);

    expect(container.textContent).not.toContain("&check;");
    expect(container.querySelector("svg.copy-embed-done")).toBeTruthy();
  });
});
