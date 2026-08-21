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

export function CounterRow({
  label,
  value,
  setValue,
  min = 1,
  max = 10,
  step = 1,
  suffix,
}: {
  label: string;
  value: number;
  setValue: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  const clamp = (next: number) =>
    Math.min(max, Math.max(min, roundToStep(next, step)));
  const display =
    stepDecimals(step) > 0 ? value.toFixed(stepDecimals(step)) : String(value);

  return (
    <div className="counter-row">
      <span>{label}</span>
      <span className="counter-input">
        <button
          onClick={() => setValue(clamp(value - step))}
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <input
          aria-label={label}
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
        {suffix ? <small className="counter-suffix">{suffix}</small> : null}
        <button
          onClick={() => setValue(clamp(value + step))}
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </span>
    </div>
  );
}
