import { CounterRow } from "../counter-row";

export function RereadSettings({
  wordRepeats,
  sentenceRepeats,
  paragraphRepeats,
  onWordRepeatsChange,
  onSentenceRepeatsChange,
  onParagraphRepeatsChange,
}: {
  wordRepeats: number;
  sentenceRepeats: number;
  paragraphRepeats: number;
  onWordRepeatsChange: (value: number) => void;
  onSentenceRepeatsChange: (value: number) => void;
  onParagraphRepeatsChange: (value: number) => void;
}) {
  return (
    <div className="settings-section reread-section">
      <h3>Re-reading</h3>
      <p>Set a separate repeat count for each level.</p>
      <CounterRow
        label="Each word"
        value={wordRepeats}
        setValue={onWordRepeatsChange}
      />
      <CounterRow
        label="Each sentence"
        value={sentenceRepeats}
        setValue={onSentenceRepeatsChange}
      />
      <CounterRow
        label="Each paragraph"
        value={paragraphRepeats}
        setValue={onParagraphRepeatsChange}
      />
    </div>
  );
}
