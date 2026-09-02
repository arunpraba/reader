import { Gap } from "../gap";

export function GapSettings({
  wordGap,
  sentenceGap,
  paragraphGap,
  pauseEnabled,
  onWordGapChange,
  onSentenceGapChange,
  onParagraphGapChange,
  onPauseEnabledChange,
}: {
  wordGap: number;
  sentenceGap: number;
  paragraphGap: number;
  pauseEnabled: { word: boolean; sentence: boolean; paragraph: boolean };
  onWordGapChange: (value: number) => void;
  onSentenceGapChange: (value: number) => void;
  onParagraphGapChange: (value: number) => void;
  onPauseEnabledChange: (
    level: "word" | "sentence" | "paragraph",
    enabled: boolean,
  ) => void;
}) {
  return (
    <div className="gap-group">
      <h3>Pause between</h3>
      <Gap
        label="Words"
        value={wordGap}
        setValue={onWordGapChange}
        enabled={pauseEnabled.word}
        setEnabled={(enabled) => onPauseEnabledChange("word", enabled)}
      />
      <Gap
        label="Sentences"
        value={sentenceGap}
        setValue={onSentenceGapChange}
        enabled={pauseEnabled.sentence}
        setEnabled={(enabled) => onPauseEnabledChange("sentence", enabled)}
      />
      <Gap
        label="Paragraphs"
        value={paragraphGap}
        setValue={onParagraphGapChange}
        enabled={pauseEnabled.paragraph}
        setEnabled={(enabled) => onPauseEnabledChange("paragraph", enabled)}
      />
    </div>
  );
}
