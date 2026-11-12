import { Keyboard } from "lucide-react";
import { useTranslation } from "react-i18next";

const MODIFIER_KEYS = [",", ".", "k", "l"];

const ShortcutHint = () => {
  const { t } = useTranslation();

  return (
    <div
      id="modifier-hint"
      className="shortcut-keys"
      role="group"
      title={t("shortcuts.tooltip")}
      aria-label={t("shortcuts.tooltip")}
    >
      <Keyboard size={16} aria-hidden />
      {MODIFIER_KEYS.map((key) => (
        <kbd key={key} className="keycap">
          {key}
        </kbd>
      ))}
      <span className="shortcut-keys-label">{t("shortcuts.modifierLabel")}</span>
    </div>
  );
};

export default ShortcutHint;
