import { useCallback, useEffect, useState } from "react";
import type { HighlightLevels } from "../../../lib/reader";
import {
  defaultReaderSettings,
  loadReaderSettings,
  saveReaderSettings,
  type ReaderSettings,
} from "../../../lib/reader-settings";

export function useReaderSettings() {
  const [levels, setLevels] = useState<HighlightLevels>(
    defaultReaderSettings.levels,
  );
  const [highlightColors, setHighlightColors] = useState(
    defaultReaderSettings.highlightColors,
  );
  const [wpm, setWpm] = useState(defaultReaderSettings.wpm);
  const [wordGap, setWordGap] = useState(defaultReaderSettings.wordGap);
  const [sentenceGap, setSentenceGap] = useState(
    defaultReaderSettings.sentenceGap,
  );
  const [paragraphGap, setParagraphGap] = useState(
    defaultReaderSettings.paragraphGap,
  );
  const [pauseEnabled, setPauseEnabled] = useState(
    defaultReaderSettings.pauseEnabled,
  );
  const [wordRepeats, setWordRepeats] = useState(
    defaultReaderSettings.wordRepeats,
  );
  const [sentenceRepeats, setSentenceRepeats] = useState(
    defaultReaderSettings.sentenceRepeats,
  );
  const [paragraphRepeats, setParagraphRepeats] = useState(
    defaultReaderSettings.paragraphRepeats,
  );
  const [settingsOpen, setSettingsOpen] = useState(
    defaultReaderSettings.settingsOpen,
  );
  const [minimized, setMinimized] = useState(
    defaultReaderSettings.playerMinimized,
  );
  const [preferredVoice, setPreferredVoice] = useState(
    defaultReaderSettings.preferredVoice,
  );
  const [ttsEngine, setTtsEngine] = useState(defaultReaderSettings.ttsEngine);
  const [preferredEdgeVoice, setPreferredEdgeVoice] = useState(
    defaultReaderSettings.preferredEdgeVoice,
  );
  const [fontSize, setFontSize] = useState(defaultReaderSettings.fontSize);
  const [lineHeight, setLineHeight] = useState(
    defaultReaderSettings.lineHeight,
  );
  const [letterSpacing, setLetterSpacing] = useState(
    defaultReaderSettings.letterSpacing,
  );
  const [settingsReady, setSettingsReady] = useState(false);

  useEffect(() => {
    const saved = loadReaderSettings();
    setLevels(saved.levels);
    setHighlightColors(saved.highlightColors);
    setWpm(saved.wpm);
    setWordGap(saved.wordGap);
    setSentenceGap(saved.sentenceGap);
    setParagraphGap(saved.paragraphGap);
    setPauseEnabled(saved.pauseEnabled);
    setWordRepeats(saved.wordRepeats);
    setSentenceRepeats(saved.sentenceRepeats);
    setParagraphRepeats(saved.paragraphRepeats);
    setPreferredVoice(saved.preferredVoice);
    setTtsEngine(saved.ttsEngine);
    setPreferredEdgeVoice(saved.preferredEdgeVoice);
    setFontSize(saved.fontSize);
    setLineHeight(saved.lineHeight);
    setLetterSpacing(saved.letterSpacing);
    setSettingsOpen(saved.settingsOpen);
    setMinimized(saved.playerMinimized);
    setSettingsReady(true);
  }, []);

  useEffect(() => {
    if (!settingsReady) return;
    const settings: ReaderSettings = {
      levels,
      highlightColors,
      wpm,
      wordGap,
      sentenceGap,
      paragraphGap,
      pauseEnabled,
      wordRepeats,
      sentenceRepeats,
      paragraphRepeats,
      preferredVoice,
      ttsEngine,
      preferredEdgeVoice,
      fontSize,
      lineHeight,
      letterSpacing,
      settingsOpen,
      playerMinimized: minimized,
    };
    saveReaderSettings(settings);
  }, [
    settingsReady,
    levels,
    highlightColors,
    wpm,
    wordGap,
    sentenceGap,
    paragraphGap,
    pauseEnabled,
    wordRepeats,
    sentenceRepeats,
    paragraphRepeats,
    preferredVoice,
    ttsEngine,
    preferredEdgeVoice,
    fontSize,
    lineHeight,
    letterSpacing,
    settingsOpen,
    minimized,
  ]);

  const setPlayerMinimized = useCallback((value: boolean) => {
    setMinimized(value);
    if (!value) setSettingsOpen(true);
  }, []);

  const setHighlightColor = useCallback(
    (level: keyof HighlightLevels, color: string) => {
      setHighlightColors((current) => ({ ...current, [level]: color }));
    },
    [],
  );

  const setTypography = useCallback(
    (
      next: Partial<{
        fontSize: number;
        lineHeight: number;
        letterSpacing: number;
      }>,
    ) => {
      if (next.fontSize !== undefined) setFontSize(next.fontSize);
      if (next.lineHeight !== undefined) setLineHeight(next.lineHeight);
      if (next.letterSpacing !== undefined) setLetterSpacing(next.letterSpacing);
    },
    [],
  );

  return {
    levels,
    setLevels,
    highlightColors,
    setHighlightColors,
    wpm,
    setWpm,
    wordGap,
    setWordGap,
    sentenceGap,
    setSentenceGap,
    paragraphGap,
    setParagraphGap,
    pauseEnabled,
    setPauseEnabled,
    wordRepeats,
    setWordRepeats,
    sentenceRepeats,
    setSentenceRepeats,
    paragraphRepeats,
    setParagraphRepeats,
    settingsOpen,
    setSettingsOpen,
    minimized,
    setMinimized,
    preferredVoice,
    setPreferredVoice,
    ttsEngine,
    setTtsEngine,
    preferredEdgeVoice,
    setPreferredEdgeVoice,
    fontSize,
    lineHeight,
    letterSpacing,
    setPlayerMinimized,
    setHighlightColor,
    setTypography,
  };
}
