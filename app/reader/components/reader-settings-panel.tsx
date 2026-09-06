import { formatDuration, type HighlightLevels } from "@/lib/reader";
import { estimatePlayheadDuration } from "@/lib/playback-engine";
import { GapSettings } from "./gap-settings";
import { HighlighterSettings } from "./highlighter-settings";
import { PlaybackControls } from "./playback-controls";
import { RereadSettings } from "./reread-settings";
import { SpeedSettings } from "./speed-settings";
import { TypographySettings } from "./typography-settings";
import { VoiceSettings } from "./voice-settings";

export function ReaderSettingsPanel({
  estimate,
  wordCount,
  preferredVoice,
  voices,
  levels,
  highlightColors,
  fontSize,
  lineHeight,
  letterSpacing,
  wpm,
  wordGap,
  sentenceGap,
  paragraphGap,
  pauseEnabled,
  wordRepeats,
  sentenceRepeats,
  paragraphRepeats,
  playing,
  progress,
  hasWords,
  onPreferredVoiceChange,
  onLevelChange,
  onColorChange,
  onTypographyChange,
  onWpmChange,
  onWordGapChange,
  onSentenceGapChange,
  onParagraphGapChange,
  onPauseEnabledChange,
  onWordRepeatsChange,
  onSentenceRepeatsChange,
  onParagraphRepeatsChange,
  onJump,
  onTogglePlay,
  onSeek,
  onScrubStart,
  onScrubEnd,
}: {
  estimate: number;
  wordCount: number;
  preferredVoice: string;
  voices: SpeechSynthesisVoice[];
  levels: HighlightLevels;
  highlightColors: { word: string; sentence: string; paragraph: string };
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  wpm: number;
  wordGap: number;
  sentenceGap: number;
  paragraphGap: number;
  pauseEnabled: { word: boolean; sentence: boolean; paragraph: boolean };
  wordRepeats: number;
  sentenceRepeats: number;
  paragraphRepeats: number;
  playing: boolean;
  progress: number;
  hasWords: boolean;
  onPreferredVoiceChange: (voice: string) => void;
  onLevelChange: (level: keyof HighlightLevels, enabled: boolean) => void;
  onColorChange: (level: keyof HighlightLevels, color: string) => void;
  onTypographyChange: (
    next: Partial<{
      fontSize: number;
      lineHeight: number;
      letterSpacing: number;
    }>,
  ) => void;
  onWpmChange: (wpm: number) => void;
  onWordGapChange: (value: number) => void;
  onSentenceGapChange: (value: number) => void;
  onParagraphGapChange: (value: number) => void;
  onPauseEnabledChange: (
    level: "word" | "sentence" | "paragraph",
    enabled: boolean,
  ) => void;
  onWordRepeatsChange: (value: number) => void;
  onSentenceRepeatsChange: (value: number) => void;
  onParagraphRepeatsChange: (value: number) => void;
  onJump: (unit: "sentence" | "paragraph", direction: -1 | 1) => void;
  onTogglePlay: () => void;
  onSeek: (ratio: number) => void;
  onScrubStart: () => void;
  onScrubEnd: () => void;
}) {
  return (
    <>
      <div className="estimate-card">
        <span>Estimated listen time</span>
        <strong>{formatDuration(estimate)}</strong>
        <small>{wordCount} words · based on your speed and pauses</small>
      </div>
      <VoiceSettings
        preferredVoice={preferredVoice}
        voices={voices}
        onPreferredVoiceChange={onPreferredVoiceChange}
      />
      <HighlighterSettings
        levels={levels}
        highlightColors={highlightColors}
        onLevelChange={onLevelChange}
        onColorChange={onColorChange}
      />
      <TypographySettings
        fontSize={fontSize}
        lineHeight={lineHeight}
        letterSpacing={letterSpacing}
        onTypographyChange={onTypographyChange}
      />
      <SpeedSettings wpm={wpm} onWpmChange={onWpmChange} />
      <GapSettings
        wordGap={wordGap}
        sentenceGap={sentenceGap}
        paragraphGap={paragraphGap}
        pauseEnabled={pauseEnabled}
        onWordGapChange={onWordGapChange}
        onSentenceGapChange={onSentenceGapChange}
        onParagraphGapChange={onParagraphGapChange}
        onPauseEnabledChange={onPauseEnabledChange}
      />
      <RereadSettings
        wordRepeats={wordRepeats}
        sentenceRepeats={sentenceRepeats}
        paragraphRepeats={paragraphRepeats}
        onWordRepeatsChange={onWordRepeatsChange}
        onSentenceRepeatsChange={onSentenceRepeatsChange}
        onParagraphRepeatsChange={onParagraphRepeatsChange}
      />
      <PlaybackControls
        playing={playing}
        progress={progress}
        duration={estimatePlayheadDuration(wordCount, wpm)}
        hasWords={hasWords}
        onJump={onJump}
        onTogglePlay={onTogglePlay}
        onSeek={onSeek}
        onScrubStart={onScrubStart}
        onScrubEnd={onScrubEnd}
      />
    </>
  );
}
