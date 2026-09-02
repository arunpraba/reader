import { CounterRow } from "../counter-row";

export function SpeedSettings({
  wpm,
  onWpmChange,
}: {
  wpm: number;
  onWpmChange: (wpm: number) => void;
}) {
  return (
    <div className="settings-section">
      <h3>Speed</h3>
      <p>Default is 150 words per minute.</p>
      <CounterRow
        label="Reading speed"
        value={wpm}
        setValue={onWpmChange}
        min={50}
        max={1000}
        step={10}
        suffix="wpm"
      />
    </div>
  );
}
