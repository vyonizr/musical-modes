// lucide-react ships no pedal glyph, so this one is drawn to match its 24px,
// 2px-stroke style.
const PedalIcon = () => (
  <svg
    className="sustain-icon"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M3 21h18" />
    <path d="M6 18 9 6h6l3 12Z" />
  </svg>
);

export default PedalIcon;
