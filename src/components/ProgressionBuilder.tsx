import { useState, useCallback } from "react";
import { Play, Square, Copy, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { MODE_NAMES } from "src/utils/types";
import { Progression, ProgressionStep, BPM_DEFAULT } from "src/utils/progressions";
import { ChordFlavor } from "src/utils/chords";
import { encodeSteps } from "src/utils/steps";
import { computeEmbedHeight } from "src/utils/embed";
import { Mode } from "src/utils/types";

const FLAVOUR_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "—" },
  { value: "flat7", label: "7" },
  { value: "maj7", label: "maj7" },
  { value: "sus4", label: "sus4" },
  { value: "sus2", label: "sus2" },
];

function emptyStep(): ProgressionStep {
  return { mode: "ionian", degreeIndex: 0 };
}

interface IProps {
  modes: Mode[]
  selectedScale: string
  preferSharp: boolean
  onPlay: (progression: Progression) => void
  activeProgressionId: string | null
}

const ProgressionBuilder = ({ modes, selectedScale, preferSharp, onPlay, activeProgressionId }: IProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [steps, setSteps] = useState<ProgressionStep[]>([emptyStep()]);
  const [bpm, setBpm] = useState(BPM_DEFAULT);
  const [copied, setCopied] = useState(false);

  const builderProgression: Progression = {
    id: "builder",
    name: "Custom progression",
    bpm,
    steps,
    songs: [],
  };

  const updateStep = (index: number, field: keyof ProgressionStep, value: string | number | undefined) => {
    setSteps((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addStep = () => {
    setSteps((prev) => [...prev, emptyStep()]);
  };

  const removeStep = (index: number) => {
    setSteps((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const handlePlay = () => {
    onPlay(builderProgression);
  };

  const handleCopyEmbed = useCallback(() => {
    const modeNames = Array.from(new Set(steps.map((s) => s.mode)));
    const height = computeEmbedHeight(modeNames.length);
    const encoded = encodeSteps(steps);
    const src = `${window.location.origin}/?embed=1&key=${selectedScale.replace("♭", "b")}&acc=${preferSharp ? "sharp" : "flat"}&bpm=${bpm}&steps=${encoded}`;
    const iframe = `<iframe src="${src}" width="375" height="${height}" frameborder="0" loading="lazy" title="Custom progression — Musical Modes"></iframe>`;
    navigator.clipboard.writeText(iframe);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [steps, selectedScale, preferSharp, bpm]);

  const degreeOptions = modes.length > 0
    ? modes[0].romanNumerals.map((rn, i) => ({ value: i, label: rn }))
    : Array.from({ length: 7 }, (_, i) => ({ value: i, label: String(i) }));

  return (
    <div className="progression-builder">
      <button
        className="progression-builder-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        {t("progressionBuilder.toggleLabel")} {open ? "\u25B4" : "\u25BE"}
      </button>
      {open && (
        <div className="progression-builder-body">
          <div className="progression-builder-controls">
            <label className="builder-bpm-label">
              {t("progressionBuilder.bpmLabel")}
              <input
                type="number"
                className="builder-bpm-input"
                min={20}
                max={300}
                value={bpm}
                onChange={(e) => setBpm(Math.max(20, parseInt(e.target.value) || BPM_DEFAULT))}
              />
            </label>
          </div>
          <div className="builder-steps-list">
            {steps.map((step, i) => (
              <div key={i} className="builder-step-row">
                <select
                  className="builder-select builder-mode-select"
                  value={step.mode}
                  onChange={(e) => updateStep(i, "mode", e.target.value)}
                >
                  {MODE_NAMES.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <select
                  className="builder-select builder-degree-select"
                  value={step.degreeIndex}
                  onChange={(e) => updateStep(i, "degreeIndex", parseInt(e.target.value, 10))}
                >
                  {degreeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <select
                  className="builder-select builder-flavour-select"
                  value={step.flavour || ""}
                  onChange={(e) => updateStep(i, "flavour", e.target.value || undefined)}
                >
                  {FLAVOUR_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <input
                  type="number"
                  className="builder-bars-input"
                  min={1}
                  max={16}
                  value={step.bars ?? 1}
                  onChange={(e) => updateStep(i, "bars", Math.max(1, parseInt(e.target.value) || 1))}
                />
                <span className="builder-bars-label">{t("progressionBuilder.barsLabel")}</span>
                <button
                  className="builder-remove-btn"
                  onClick={() => removeStep(i)}
                  disabled={steps.length <= 1}
                  aria-label={t("progressionBuilder.removeStepLabel")}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="builder-actions">
            <button className="builder-add-btn" onClick={addStep}>
              <Plus size={14} /> {t("progressionBuilder.addStep")}
            </button>
            <button
              className={`play-progression-btn${activeProgressionId === "builder" ? " playing" : ""}`}
              onClick={handlePlay}
            >
              {activeProgressionId === "builder" ? <Square size={14} /> : <Play size={14} />}
            </button>
            <button className="builder-copy-btn" onClick={handleCopyEmbed}>
              <Copy size={14} /> {copied ? t("progressions.embedCopied") : t("progressionBuilder.copyEmbed")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressionBuilder;
