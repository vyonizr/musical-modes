import { Fragment, useMemo, useCallback } from "react";
import { Play, Square } from "lucide-react";
import { useTranslation } from "react-i18next";
import { generateModes } from "src/utils";
import { KEYS } from "src/utils/constants";
import { usePlayProgression } from "src/utils/usePlayProgression";
import { PROGRESSIONS, Progression } from "src/utils/progressions";
import { ChordFlavor } from "src/utils/chords";
import TableContent from "src/components/TableContent";

function romanWithFlavour(roman: string, flavour?: ChordFlavor): string {
  if (!flavour) return roman;
  if (flavour === "flat7") return roman + "7";
  if (flavour === "maj7") return roman + "maj7";
  if (flavour === "sus4") return roman + "sus4";
  if (flavour === "sus2") return roman + "sus2";
  return roman;
}

export default function EmbedWidget() {
  const { t } = useTranslation();
  const params = new URLSearchParams(location.search);

  const progressionId = params.get("progression") || PROGRESSIONS[0].id;
  const keyParam = params.get("key") || "C";
  const accParam = params.get("acc") || "flat";
  const bpmOverride = params.get("bpm") ? parseInt(params.get("bpm")!, 10) : undefined;

  const selectedScale = KEYS.find((k) => k.replace("♭", "b") === keyParam) || "C";
  const preferSharp = accParam === "sharp";

  const progression = PROGRESSIONS.find((p) => p.id === progressionId) || PROGRESSIONS[0];
  const effectiveBpm = bpmOverride || progression.bpm;
  const effectiveProgression: Progression = bpmOverride
    ? { ...progression, bpm: bpmOverride }
    : progression;

  const modes = useMemo(() => generateModes(selectedScale, preferSharp), [selectedScale, preferSharp]);

  const modeNames = useMemo(
    () => Array.from(new Set(progression.steps.map((s) => s.mode))),
    [progression]
  );

  const pattern = useMemo(() => {
    return progression.steps
      .map((step) => {
        const mode = modes.find((m) => m.name === step.mode);
        const roman = mode ? mode.romanNumerals[step.degreeIndex] : "?";
        return romanWithFlavour(roman, step.flavour);
      })
      .join(" \u2013 ");
  }, [progression, modes]);

  const { activeProgressionStep, activeProgressionId, handlePlayProgression } = usePlayProgression();

  const handlePlay = useCallback(() => {
    handlePlayProgression(effectiveProgression, modes);
  }, [effectiveProgression, modes, handlePlayProgression]);

  const backlinkParams = new URLSearchParams();
  backlinkParams.set("key", selectedScale.replace("♭", "b"));
  backlinkParams.set("acc", preferSharp ? "sharp" : "flat");
  backlinkParams.set("modes", modeNames.join(","));

  return (
    <div className="embed-widget">
      <div className="embed-header">
        <div className="embed-header-info">
          <span className="embed-progression-name">{progression.name}</span>
          <span className="embed-progression-pattern">{pattern}</span>
          <span className="embed-progression-bpm">{effectiveBpm} BPM</span>
        </div>
        <button
          className={`embed-play-btn${activeProgressionId === progression.id ? " playing" : ""}`}
          onClick={handlePlay}
          aria-label={activeProgressionId === progression.id ? t("progressions.stopLabel") : t("progressions.playLabel")}
        >
          {activeProgressionId === progression.id ? <Square size={14} /> : <Play size={14} />}
        </button>
      </div>
      <div className="embed-table-container">
        <table>
          {(() => {
            let activeRowCount = 0;
            return modes
              .filter((mode) => modeNames.includes(mode.name))
              .map((mode, index) => (
                <Fragment key={index}>
                  <TableContent
                    mode={mode}
                    index={modes.indexOf(mode)}
                    activeRowIndex={activeRowCount++}
                    keyboardPressedChords={[]}
                    activeFlavour={undefined}
                    activeProgressionStep={activeProgressionStep}
                  />
                </Fragment>
              ));
          })()}
        </table>
      </div>
      <div className="embed-backlink">
        <a
          href={`/?${backlinkParams.toString()}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("embed.backlink")} &nearr;
        </a>
      </div>
    </div>
  );
}
