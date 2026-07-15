import { useState } from "react";
import { useTranslation } from "react-i18next";
import { detectKey, isValidChordToken, parseSection, DetectionResult } from "src/utils/detectKey";

interface IProps {
  preferSharp: boolean;
  onKeySelected: (root: string, modes: string[]) => void;
}

const KeyDetectorPanel = ({ preferSharp, onKeySelected }: IProps) => {
  const { t } = useTranslation();
  const [keyDetectorOpen, setKeyDetectorOpen] = useState(false);
  const [detectorSections, setDetectorSections] = useState<string[]>([""]);
  const [detectionResults, setDetectionResults] = useState<
    DetectionResult[] | null
  >(null);

  return (
    <div className="key-detector">
      <button
        className="key-detector-toggle"
        onClick={() => setKeyDetectorOpen((prev) => !prev)}
        aria-expanded={keyDetectorOpen}
      >
        {t("keyDetector.toggleLabel")} {keyDetectorOpen ? "▴" : "▾"}
      </button>
      <p className="key-detector-hint">{t("keyDetector.experimentalHint")}</p>
      {keyDetectorOpen && (
        <div className="key-detector-body">
          {detectorSections.map((section, si) => {
            const tokens = parseSection(section);
            const invalidTokens = tokens.filter((t) => !isValidChordToken(t));
            return (
              <div key={si}>
                <div className="key-detector-section">
                  <input
                    type="text"
                    className={`chord-input${
                      invalidTokens.length > 0 ? " chord-input-invalid" : ""
                    }`}
                    placeholder={t("keyDetector.sectionPlaceholder", {
                      n: si + 1,
                    })}
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
                      aria-label={t("keyDetector.removeSectionLabel", {
                        n: si + 1,
                      })}
                    >
                      &times;
                    </button>
                  )}
                </div>
                {invalidTokens.length > 0 && (
                  <p className="chord-input-error">
                    {t("keyDetector.notAChord", {
                      tokens: invalidTokens.join(", "),
                    })}
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
                      {isTie
                        ? t("keyDetector.tiedResultsHeading")
                        : t("keyDetector.bestGuessHeading")}
                    </p>
                    {tied.map((result, i) => (
                      <div key={i} className="detection-result-group">
                        <button
                          className={`detection-result-btn${
                            i === 0 ? " primary-result" : ""
                          }`}
                          onClick={() => {
                            const modes = result.hasBorrowed
                              ? [result.mode, ...result.borrowedModes]
                              : [result.mode];
                            onKeySelected(result.root, modes);
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
                                {t("keyDetector.sectionLabel", {
                                  n: section.sectionIndex + 1,
                                })}
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
                                        {t("keyDetector.borrowedFrom", {
                                          mode: m.borrowedFrom,
                                        })}
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
            <p className="detection-empty">{t("keyDetector.emptyState")}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default KeyDetectorPanel;
