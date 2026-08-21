"use client";

export function Gap({
  label,
  value,
  setValue,
  enabled,
  setEnabled,
}: {
  label: string;
  value: number;
  setValue: (value: number) => void;
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}) {
  return (
    <div className="gap-row">
      <button
        className={`switch compact ${enabled ? "on" : ""}`}
        onClick={() => setEnabled(!enabled)}
        aria-label={`Toggle ${label} pause`}
        aria-pressed={enabled}
      >
        <span />
      </button>
      <span className="gap-name">{label}</span>
      <span className={!enabled ? "disabled-input" : ""}>
        <input
          aria-label={`${label} pause in seconds`}
          disabled={!enabled}
          type="number"
          min="0"
          max="100"
          step="0.1"
          value={value}
          onChange={(e) =>
            setValue(Math.min(100, Math.max(0, Number(e.target.value) || 0)))
          }
        />
        <small>{enabled ? "sec" : "off"}</small>
      </span>
    </div>
  );
}
