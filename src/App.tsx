import { Fragment, useState, useEffect, useCallback } from "react";
import { Joyride } from "react-joyride";

import { generateModes } from "./utils";
import { Mode } from "./utils/types";
import {
  KEYS,
  KEYS_SHARP,
  COLOR_CLASSNAMES,
  PIANO_WHITE_KEYS,
  PIANO_BLACK_KEYS,
  CHROMATIC_ROW1,
  CHROMATIC_ROW2,
} from "./utils/constants";
import { setVolume, getStoredVolume } from "./utils/chords";

import { useTranslation } from "react-i18next";
import TableContent from "./components/TableContent";
import { PROGRESSIONS, Progression } from "./utils/progressions";
import ProgressionsPanel from "./components/ProgressionsPanel";
import ProgressionBuilder from "./components/ProgressionBuilder";
import KeyDetectorPanel from "./components/KeyDetectorPanel";
import { usePlayProgression } from "./utils/usePlayProgression";
import { useOnboardingTour } from "./utils/useOnboardingTour";
import { useChordKeyboardInput } from "./utils/useChordKeyboardInput";
import { buildEmbedSnippet } from "./utils/embed";
import packageJson from "../package.json";

export default function App() {
  const { t } = useTranslation();

  const [selectedScale, setSelectedScale] = useState("C");
  const [activeModes, setActiveModes] = useState([COLOR_CLASSNAMES[0]]);
  const [preferSharp, setPreferSharp] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [volume, setVolumeState] = useState(0.8);

  const { activeFlavour, keyboardPressedChords } = useChordKeyboardInput(
    selectedScale,
    activeModes,
    preferSharp
  );
  const { activeProgressionStep, activeProgressionId, handlePlayProgression: hookPlayProgression } = usePlayProgression();

  useEffect(() => {
    setIsTouchDevice(
      !window.matchMedia("(hover: hover) and (pointer: fine)").matches
    );
  }, []);

  useEffect(() => {
    setVolumeState(getStoredVolume());
  }, []);

  const handleVolumeChange = useCallback((next: number) => {
    setVolumeState(next);
    setVolume(next);
  }, []);

  const handlePlayProgression = useCallback(
    async (progression: Progression) => {
      const modes = generateModes(selectedScale, preferSharp);
      const modeNames = Array.from(new Set(progression.steps.map((s) => s.mode)));
      setActiveModes(modeNames);
      await hookPlayProgression(progression, modes);
    },
    [selectedScale, preferSharp, hookPlayProgression]
  );

  const handleCopyEmbed = useCallback(
    (progression: Progression) => {
      const iframe = buildEmbedSnippet(
        progression,
        selectedScale,
        preferSharp,
        window.location.origin
      );
      navigator.clipboard.writeText(iframe);
    },
    [selectedScale, preferSharp]
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const urlKey = params.get("key");
    if (urlKey) {
      const matched = KEYS.find((k) => k.replace("♭", "b") === urlKey);
      if (matched) setSelectedScale(matched);
    }

    const urlModes = params.get("modes");
    if (urlModes) {
      const parsed = urlModes
        .split(",")
        .filter((m) => COLOR_CLASSNAMES.includes(m));
      if (parsed.length > 0) setActiveModes(parsed);
    }

    if (params.get("acc") === "sharp") {
      setPreferSharp(true);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("key", selectedScale.replace("♭", "b"));
    params.set("modes", activeModes.join(","));
    params.set("acc", preferSharp ? "sharp" : "flat");
    history.replaceState(null, "", "?" + params.toString());
  }, [selectedScale, activeModes, preferSharp]);

  const keyLabel = (index: number) =>
    preferSharp ? KEYS_SHARP[index] : KEYS[index];
  const isSelectedKey = (index: number) => selectedScale === KEYS[index];

  const toggleActiveMode = (modeName: string) =>
    setActiveModes((prev) =>
      prev.includes(modeName)
        ? prev.filter((m) => m !== modeName)
        : [...prev, modeName]
    );

  const {
    visibleSteps,
    tourRun,
    tourStepIndex,
    handleJoyrideEvent,
    restartTour,
  } = useOnboardingTour(isTouchDevice);

  return (
    <div>
      <main>
        <h1 className="title black">{t("header.title")}</h1>
        <div className="key-selector-root">
          <div className="key-selector-header">
            <label>{t("header.rootKeyLabel")}</label>
            <div className="accidental-toggle">
              <button
                className={`acc-btn${!preferSharp ? " active" : ""}`}
                onClick={() => setPreferSharp(false)}
                aria-pressed={!preferSharp}
              >
                ♭
              </button>
              <button
                className={`acc-btn${preferSharp ? " active" : ""}`}
                onClick={() => setPreferSharp(true)}
                aria-pressed={preferSharp}
              >
                ♯
              </button>
            </div>
          </div>
          <div className="piano-keyboard" id="modes">
            {PIANO_BLACK_KEYS.map(({ index, left }) => (
              <button
                key={index}
                className={`black-key${
                  isSelectedKey(index) ? " selected" : ""
                } noselect`}
                style={{ left }}
                onClick={() => setSelectedScale(KEYS[index])}
                aria-pressed={isSelectedKey(index)}
                aria-label={keyLabel(index)}
              >
                {keyLabel(index)}
              </button>
            ))}
            {PIANO_WHITE_KEYS.map(({ index, label }) => (
              <button
                key={index}
                className={`white-key${
                  isSelectedKey(index) ? " selected" : ""
                } noselect`}
                onClick={() => setSelectedScale(KEYS[index])}
                aria-pressed={isSelectedKey(index)}
                aria-label={label}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="chromatic-grid">
            {CHROMATIC_ROW1.map((keyIndex) => (
              <button
                key={`n-${keyIndex}`}
                className={`chromatic-grid-item natural${
                  isSelectedKey(keyIndex) ? " selected" : ""
                } noselect`}
                onClick={() => setSelectedScale(KEYS[keyIndex])}
                aria-pressed={isSelectedKey(keyIndex)}
                aria-label={KEYS[keyIndex]}
              >
                {KEYS[keyIndex]}
              </button>
            ))}
            {CHROMATIC_ROW2.map((keyIndex, col) => (
              <button
                key={`a-${col}`}
                className={`chromatic-grid-item accidental${
                  keyIndex !== null && isSelectedKey(keyIndex)
                    ? " selected"
                    : ""
                } noselect`}
                onClick={() => {
                  if (keyIndex !== null) setSelectedScale(KEYS[keyIndex]);
                }}
                aria-pressed={keyIndex !== null && isSelectedKey(keyIndex)}
                aria-label={keyIndex !== null ? keyLabel(keyIndex) : undefined}
                disabled={keyIndex === null}
                style={keyIndex === null ? { visibility: "hidden" } : undefined}
              >
                {keyIndex !== null ? keyLabel(keyIndex) : ""}
              </button>
            ))}
          </div>
          <div className="volume-control">
            <label htmlFor="volume-slider">{t("header.volumeLabel")}</label>
            <input
              id="volume-slider"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              onMouseUp={(e) => e.currentTarget.blur()}
              onTouchEnd={(e) => e.currentTarget.blur()}
            />
          </div>
        </div>
        <ProgressionsPanel
          progressions={PROGRESSIONS}
          modes={generateModes(selectedScale, preferSharp)}
          onPlay={handlePlayProgression}
          activeProgressionId={activeProgressionId}
          onCopyEmbed={handleCopyEmbed}
        />
        <ProgressionBuilder
          modes={generateModes(selectedScale, preferSharp)}
          selectedScale={selectedScale}
          preferSharp={preferSharp}
          onPlay={handlePlayProgression}
          activeProgressionId={activeProgressionId}
        />
        <div className="table-container">
          {activeModes.length === 0 ? (
            <h3>{t("table.nothingToPlay")}</h3>
          ) : (
            <Fragment>
              <p className="black" style={{ marginTop: "0.5rem" }}>
                {t("table.playHint")}
              </p>
              <table>
                {(() => {
                  let activeRowCount = 0;
                  return generateModes(selectedScale, preferSharp).map(
                    (mode: Mode, index: number) => (
                      <Fragment key={index}>
                        {activeModes.includes(mode.name) && (
                          <TableContent
                            mode={mode}
                            index={index}
                            activeRowIndex={activeRowCount++}
                            keyboardPressedChords={keyboardPressedChords}
                            activeFlavour={activeFlavour}
                            activeProgressionStep={activeProgressionStep}
                          />
                        )}
                      </Fragment>
                    )
                  );
                })()}
              </table>
            </Fragment>
          )}
        </div>
        {/* ponytail: JSX left inline, not a pure string — see 2026-07-10-extract-ui-strings.md */}
        <p
          id="modifier-hint"
          className="black"
          style={{ marginTop: "0.25rem" }}
        >
          Hold <code>,</code> &middot; <code>.</code> &middot; <code>k</code>{" "}
          &middot; <code>l</code> for 7th / sus chords
        </p>
        <p className="black" style={{ marginTop: "1rem" }}>
          {t("table.toggleModesHint")}
        </p>
        <div className="legends-wrapper">
          {COLOR_CLASSNAMES.map((modeName: string, index: number) => (
            <div
              key={index}
              className={`bg-${
                activeModes.includes(modeName)
                  ? `${modeName} white`
                  : "disabled"
              } legends-items max-content pointer noselect`}
              onClick={() => toggleActiveMode(modeName)}
            >
              {modeName}
            </div>
          ))}
        </div>
        <KeyDetectorPanel
          preferSharp={preferSharp}
          onKeySelected={(root, modes) => {
            setSelectedScale(root);
            setActiveModes(modes);
          }}
        />
        <footer style={{ textAlign: "center" }}>
          © 2020-{new Date().getFullYear()}{" "}
          <a
            href="https://vyonizr.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("footer.authorLabel")}
          </a>{" "}
          |{" "}
          <a
            href="https://github.com/vyonizr/musical-modes"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("footer.githubLabel")}
          </a>{" "}
          |{" "}
          <span
            className="pointer noselect"
            onClick={restartTour}
            style={{ textDecoration: "underline" }}
          >
            ?
          </span>
          <br />v{packageJson.version}
        </footer>
      </main>
      <Joyride
        steps={visibleSteps}
        run={tourRun}
        stepIndex={tourStepIndex}
        continuous
        onEvent={handleJoyrideEvent}
        options={{
          overlayClickAction: false,
          buttons: ["back", "close", "primary", "skip"],
          closeButtonAction: "skip",
          primaryColor: "#4285f4",
          zIndex: 10000,
        }}
        locale={{
          next: t("tour.joyrideNext"),
          skip: t("tour.joyrideSkip"),
          last: t("tour.joyrideLast"),
        }}
      />
    </div>
  );
}
