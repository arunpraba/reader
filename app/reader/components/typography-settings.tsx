import { CounterRow } from "../counter-row";

export function TypographySettings({
  fontSize,
  lineHeight,
  letterSpacing,
  guidedFocus,
  guidedFocusOpacity,
  onTypographyChange,
}: {
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  guidedFocus: boolean;
  guidedFocusOpacity: number;
  onTypographyChange: (
    next: Partial<{
      fontSize: number;
      lineHeight: number;
      letterSpacing: number;
      guidedFocus: boolean;
      guidedFocusOpacity: number;
    }>,
  ) => void;
}) {
  return (
    <div className="settings-section">
      <h3>Typography</h3>
      <p>Base text size in rem. Headings, lists, and code scale with it.</p>
      <CounterRow
        label="Font size"
        value={fontSize}
        setValue={(next) => onTypographyChange({ fontSize: next })}
        min={0.25}
        max={2.25}
        step={0.05}
        suffix="rem"
      />
      <CounterRow
        label="Line height"
        value={lineHeight}
        setValue={(next) => onTypographyChange({ lineHeight: next })}
        min={1.2}
        max={2.4}
        step={0.05}
      />
      <CounterRow
        label="Letter spacing"
        value={letterSpacing}
        setValue={(next) => onTypographyChange({ letterSpacing: next })}
        min={-0.05}
        max={0.2}
        step={0.01}
        suffix="em"
      />
      <div className="skip-parens-row">
        <button
          type="button"
          className={`switch compact ${guidedFocus ? "on" : ""}`}
          onClick={() => onTypographyChange({ guidedFocus: !guidedFocus })}
          aria-label="Guided focus"
          aria-pressed={guidedFocus}
        >
          <span />
        </button>
        <span>Guided focus</span>
      </div>
      <CounterRow
        label="Rest opacity"
        value={guidedFocusOpacity}
        setValue={(next) => onTypographyChange({ guidedFocusOpacity: next })}
        min={0.1}
        max={1}
        step={0.05}
      />
    </div>
  );
}
