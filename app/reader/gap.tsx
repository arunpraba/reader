"use client";

function stepDecimals(step: number) {
  const text = String(step);
  const dot = text.indexOf(".");
  return dot === -1 ? 0 : text.length - dot - 1;
}

function roundToStep(value: number, step: number) {
  const decimals = stepDecimals(step);
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

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
  const min = 0;
  const max = 100;
  const step = 0.1;
  const clamp = (next: number) =>
    Math.min(max, Math.max(min, roundToStep(next, step)));
  const display = value.toFixed(stepDecimals(step));

  return (
    <div className="counter-row gap-row">
      <button
        type="button"
        className={`switch compact ${enabled ? "on" : ""}`}
        onClick={() => setEnabled(!enabled)}
        aria-label={`Toggle ${label} pause`}
        aria-pressed={enabled}
      >
        <span />
      </button>
      <span className="gap-name">{label}</span>
      <span className={`counter-input ${enabled ? "" : "disabled-input"}`}>
        <button
          type="button"
          disabled={!enabled}
          onClick={() => setValue(clamp(value - step))}
          aria-label={`Decrease ${label} pause`}
        >
          −
        </button>
        <input
          aria-label={`${label} pause in seconds`}
          disabled={!enabled}
          type="number"
          min={min}
          max={max}
          step={step}
          value={display}
          onChange={(e) => {
            const next = Number(e.target.value);
            if (Number.isFinite(next)) setValue(clamp(next));
          }}
        />
        <small className="counter-suffix">{enabled ? "sec" : "off"}</small>
        <button
          type="button"
          disabled={!enabled}
          onClick={() => setValue(clamp(value + step))}
          aria-label={`Increase ${label} pause`}
        >
          +
        </button>
      </span>
    </div>
  );
}
