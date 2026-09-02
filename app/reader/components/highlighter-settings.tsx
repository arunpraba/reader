import type { HighlightLevels } from "../../../lib/reader";
import { ToggleRow } from "../toggle-row";

export function HighlighterSettings({
  levels,
  highlightColors,
  onLevelChange,
  onColorChange,
}: {
  levels: HighlightLevels;
  highlightColors: { word: string; sentence: string; paragraph: string };
  onLevelChange: (level: keyof HighlightLevels, enabled: boolean) => void;
  onColorChange: (level: keyof HighlightLevels, color: string) => void;
}) {
  return (
    <div className="settings-section">
      <h3>Highlighter</h3>
      <p>Pick colours, then turn on word, sentence, or paragraph.</p>
      {(["word", "sentence", "paragraph"] as const).map((level) => (
        <ToggleRow
          key={level}
          label={level}
          color={highlightColors[level]}
          setColor={(color) => onColorChange(level, color)}
          enabled={levels[level]}
          onChange={() => onLevelChange(level, !levels[level])}
        />
      ))}
    </div>
  );
}
