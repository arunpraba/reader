import { Gap } from "../gap";

export function GapSettings({
  wordGap,
  sentenceGap,
  paragraphGap,
  pauseEnabled,
  skipParentheticals,
  onWordGapChange,
  onSentenceGapChange,
  onParagraphGapChange,
  onPauseEnabledChange,
  onSkipParentheticalsChange,
}: {
  wordGap: number;
  sentenceGap: number;
  paragraphGap: number;
  pauseEnabled: { word: boolean; sentence: boolean; paragraph: boolean };
  skipParentheticals: boolean;
  onWordGapChange: (value: number) => void;
  onSentenceGapChange: (value: number) => void;
  onParagraphGapChange: (value: number) => void;
  onPauseEnabledChange: (
    level: "word" | "sentence" | "paragraph",
    enabled: boolean,
  ) => void;
  onSkipParentheticalsChange: (enabled: boolean) => void;
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
      <div className="skip-parens-row">
        <button
          type="button"
          className={`switch compact ${skipParentheticals ? "on" : ""}`}
          onClick={() => onSkipParentheticalsChange(!skipParentheticals)}
          aria-label="Skip words in parentheses"
          aria-pressed={skipParentheticals}
        >
          <span />
        </button>
        <span>Skip words in parentheses</span>
      </div>
    </div>
  );
}
