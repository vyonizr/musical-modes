import {
  Fragment,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { Joyride, Step, STATUS, EVENTS, EventData } from "react-joyride";

import {
  generateModes,
  detectKey,
  isValidChordToken,
  parseSection,
} from "./utils";
import { DetectionResult } from "./utils/detectKey";
import {
  KEYS,
  KEYS_SHARP,
  COLOR_CLASSNAMES,
  KEY_ROWS,
  PIANO_WHITE_KEYS,
  PIANO_BLACK_KEYS,
  CHROMATIC_ROW1,
  CHROMATIC_ROW2,
} from "./utils/constants";
import { Mode } from "./utils/types";
import {
  triggerAttackChord,
  triggerReleaseChord,
  setVolume,
  getStoredVolume,
  ChordFlavor,
} from "./utils/chords";

import { useTranslation } from "react-i18next";
import TableContent from "./components/TableContent";
import { PROGRESSIONS, Progression } from "./utils/progressions";
import ProgressionsPanel from "./components/ProgressionsPanel";
import ProgressionBuilder from "./components/ProgressionBuilder";
import { usePlayProgression } from "./utils/usePlayProgression";
import { computeEmbedHeight } from "./utils/embed";
import packageJson from "../package.json";

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

export default function App() {
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
          Switch between flat (<code>♭</code>) and sharp (<code>♯</code>) spelling
          for accidental notes. Same sound, different notation.
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
          Hold <code>,</code> or <code>.</code> for 7th chords; <code>k</code> or{" "}
          <code>l</code> for sus chords. You can press a modifier before or after
          a chord key. Hold a chord and add the modifier to hear it transform
          instantly.
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

  const [selectedScale, setSelectedScale] = useState("C");
  const [activeModes, setActiveModes] = useState([COLOR_CLASSNAMES[0]]);
  const [preferSharp, setPreferSharp] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [volume, setVolumeState] = useState(0.8);

  const [keyDetectorOpen, setKeyDetectorOpen] = useState(false);
  const [detectorSections, setDetectorSections] = useState<string[]>([""]);
  const [detectionResults, setDetectionResults] = useState<
    DetectionResult[] | null
  >(null);

  const [tourRun, setTourRun] = useState(false);
  const [tourStepIndex, setTourStepIndex] = useState(0);

  const selectedScaleRef = useRef(selectedScale);
  const activeModesRef = useRef(activeModes);
  const sevenFlavourRef = useRef<ChordFlavor | undefined>(undefined);
  const [activeFlavour, setActiveFlavour] = useState<ChordFlavor | undefined>(
    undefined
  );
  const [keyboardPressedChords, setKeyboardPressedChords] = useState<string[]>(
    []
  );
  const pressedChordsRef = useRef(new Map<string, ChordFlavor | undefined>());
  const preferSharpRef = useRef(preferSharp);
  const { activeProgressionStep, activeProgressionId, handlePlayProgression: hookPlayProgression } = usePlayProgression();

  useEffect(() => {
    setIsTouchDevice(
      !window.matchMedia("(hover: hover) and (pointer: fine)").matches
    );
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("musical-modes-tour-seen")) {
      setTourRun(true);
      setTourStepIndex(0);
    }
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
      const modeNames = Array.from(new Set(progression.steps.map((s) => s.mode)));
      const height = computeEmbedHeight(modeNames.length);
      const src = `${window.location.origin}/?embed=1&progression=${progression.id}&key=${selectedScale.replace("♭", "b")}&acc=${preferSharp ? "sharp" : "flat"}&bpm=${progression.bpm ?? 120}`;
      const iframe = `<iframe src="${src}" width="375" height="${height}" frameborder="0" loading="lazy" title="${progression.name} — Musical Modes"></iframe>`;
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

    const findChordForKey = (key: string, activeModesData: Mode[]) => {
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
    };

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

  const keyLabel = (index: number) =>
    preferSharp ? KEYS_SHARP[index] : KEYS[index];
  const isSelectedKey = (index: number) => selectedScale === KEYS[index];

  const toggleActiveMode = (modeName: string) =>
    setActiveModes((prev) =>
      prev.includes(modeName)
        ? prev.filter((m) => m !== modeName)
        : [...prev, modeName]
    );

  const handleJoyrideEvent = useCallback((data: EventData) => {
    const { action, index, status, type } = data;
    if (type === EVENTS.STEP_AFTER) {
      setTourStepIndex(index + 1);
    }
    if (status === STATUS.FINISHED || action === "skip") {
      setTourRun(false);
      localStorage.setItem("musical-modes-tour-seen", "true");
    }
  }, []);

  const restartTour = () => {
    setTourRun(true);
    setTourStepIndex(0);
  };

  const visibleSteps = useMemo(() => {
    if (isTouchDevice) {
      return TOUR_STEPS.filter((s) => s.target !== "#modifier-hint");
    }
    return TOUR_STEPS;
  }, [isTouchDevice, TOUR_STEPS]);

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
        <div className="key-detector">
          <button
            className="key-detector-toggle"
            onClick={() => setKeyDetectorOpen((prev) => !prev)}
            aria-expanded={keyDetectorOpen}
          >
            {t("keyDetector.toggleLabel")}{" "}
            {keyDetectorOpen ? "\u25B4" : "\u25BE"}
          </button>
          <p className="key-detector-hint">
            {t("keyDetector.experimentalHint")}
          </p>
          {keyDetectorOpen && (
            <div className="key-detector-body">
              {detectorSections.map((section, si) => {
                const tokens = parseSection(section);
                const invalidTokens = tokens.filter(
                  (t) => !isValidChordToken(t)
                );
                return (
                  <div key={si}>
                    <div className="key-detector-section">
                      <input
                        type="text"
                        className={`chord-input${
                          invalidTokens.length > 0 ? " chord-input-invalid" : ""
                        }`}
                        placeholder={t("keyDetector.sectionPlaceholder", { n: si + 1 })}
                        value={section}
                        onChange={(e) => {
                          const next = [...detectorSections];
                          next[si] = e.target.value;
                          setDetectorSections(next);
                          setDetectionResults(null);
                        }}
                        autoCapitalize="off"
                        autoCorrect="off"
                        spellCheck={false}
                      />
                      {detectorSections.length > 1 && (
                        <button
                          className="remove-section-btn"
                          onClick={() => {
                            setDetectorSections((prev) =>
                              prev.filter((_, i) => i !== si)
                            );
                            setDetectionResults(null);
                          }}
                          aria-label={t("keyDetector.removeSectionLabel", { n: si + 1 })}
                        >
                          &times;
                        </button>
                      )}
                    </div>
                    {invalidTokens.length > 0 && (
                      <p className="chord-input-error">
                        {t("keyDetector.notAChord", { tokens: invalidTokens.join(", ") })}
                      </p>
                    )}
                  </div>
                );
              })}
              <button
                className="add-section-btn"
                onClick={() => setDetectorSections((prev) => [...prev, ""])}
              >
                {t("keyDetector.addSection")}
              </button>
              <button
                className="detect-btn"
                disabled={detectorSections.some((s) => {
                  const tokens = parseSection(s);
                  return tokens.some((t) => !isValidChordToken(t));
                })}
                onClick={() => {
                  const results = detectKey(detectorSections, preferSharp);
                  setDetectionResults(results);
                }}
              >
                {t("keyDetector.detect")}
              </button>
              {detectionResults && detectionResults.length > 0 && (
                <div className="detection-results">
                  <p className="detection-disclaimer">
                    {t("keyDetector.resultsDisclaimer")}
                  </p>
                  {(() => {
                    const topScore = detectionResults[0].totalScore;
                    const tied = detectionResults.filter(
                      (r) => r.totalScore === topScore
                    );
                    const isTie = tied.length > 1;
                    return (
                      <>
                        <p className="detection-heading">
                          {isTie ? t("keyDetector.tiedResultsHeading") : t("keyDetector.bestGuessHeading")}
                        </p>
                        {tied.map((result, i) => (
                          <div key={i} className="detection-result-group">
                            <button
                              className={`detection-result-btn${
                                i === 0 ? " primary-result" : ""
                              }`}
                              onClick={() => {
                                setSelectedScale(result.root);
                                setActiveModes(
                                  result.hasBorrowed
                                    ? [result.mode, ...result.borrowedModes]
                                    : [result.mode]
                                );
                                setKeyDetectorOpen(false);
                                setDetectionResults(null);
                              }}
                            >
                              <strong>{result.displayName}</strong>
                            </button>
                            <div className="detection-breakdown">
                              {result.sections.map((section) => (
                                <div
                                  key={section.sectionIndex}
                                  className="detection-section"
                                >
                                  <span className="detection-section-label">
                                    {t("keyDetector.sectionLabel", { n: section.sectionIndex + 1 })}
                                    {section.cadentialMatch && (
                                      <span className="tag-note">
                                        {" "}
                                        &mdash; {t("keyDetector.resolvesToTonic")}
                                      </span>
                                    )}
                                    :
                                  </span>
                                  <div className="detection-chord-list">
                                    {section.matches.map((m, mi) => (
                                      <span
                                        key={mi}
                                        className={`detection-chord-tag${
                                          m.native
                                            ? " tag-native"
                                            : m.borrowed
                                            ? " tag-borrowed"
                                            : " tag-non-diatonic"
                                        }`}
                                      >
                                        {m.chord}
                                        {m.borrowed && m.borrowedFrom && (
                                          <span className="tag-note">
                                            {" "}
                                            {t("keyDetector.borrowedFrom", { mode: m.borrowedFrom })}
                                          </span>
                                        )}
                                        {m.nonDiatonic && (
                                          <span className="tag-note">
                                            {" "}
                                            {t("keyDetector.nonDiatonic")}
                                          </span>
                                        )}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </>
                    );
                  })()}
                </div>
              )}
              {detectionResults && detectionResults.length === 0 && (
                <p className="detection-empty">
                  {t("keyDetector.emptyState")}
                </p>
              )}
            </div>
          )}
        </div>
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
