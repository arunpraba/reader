"use client";

export function ToggleRow({
  label,
  color,
  setColor,
  enabled,
  onChange,
}: {
  label: string;
  color: string;
  setColor: (color: string) => void;
  enabled: boolean;
  onChange: () => void;
}) {
  return (
    <div className="toggle-row">
      <label
        className="color-picker"
        title={`Choose ${label} highlight colour`}
      >
        <span className="sr-only">{label} highlight colour</span>
        <input
          type="color"
          value={color}
          onChange={(event) => setColor(event.target.value)}
          aria-label={`${label} highlight colour`}
        />
      </label>
      <span>{label[0].toUpperCase() + label.slice(1)}</span>
      <button
        className={`switch ${enabled ? "on" : ""}`}
        onClick={onChange}
        aria-label={`Toggle ${label} highlighting`}
        aria-pressed={enabled}
      >
        <span />
      </button>
    </div>
  );
}
