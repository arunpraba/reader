"use client";

import { useMemo } from "react";
import { estimateSeconds, flattenWords, parseMarkdown } from "../../lib/reader";
import { ReaderControls } from "./components/reader-controls";
import { ReaderLoading } from "./components/reader-loading";
import { ReaderPaper } from "./components/reader-paper";
import { ReaderSettingsPanel } from "./components/reader-settings-panel";
import { ReaderTopbar } from "./components/reader-topbar";
import { useDomHighlight } from "./hooks/use-dom-highlight";
import { useReaderDocument } from "./hooks/use-reader-document";
import { useReaderPlayback } from "./hooks/use-reader-playback";
import { useReaderSettings } from "./hooks/use-reader-settings";
import { useTtsVoices } from "./hooks/use-tts-voices";
import { MiniPlayer } from "./mini-player";

export function ReaderPage() {
  const settings = useReaderSettings();
  const { doc, setDoc, editing, setEditing, saveState, save, positionRef } =
    useReaderDocument();
  const { voices, edgeVoices } = useTtsVoices(settings.ttsEngine);

  const blocks = useMemo(
    () => parseMarkdown(doc?.content ?? ""),
    [doc?.content],
  );
  const words = useMemo(() => flattenWords(blocks), [blocks]);
  const languages = useMemo(
    () => [...new Set(words.map((word) => word.language))],
    [words],
  );
  const estimate = estimateSeconds(
    words,
    settings.wpm,
    settings.pauseEnabled.word ? settings.wordGap : 0,
    settings.pauseEnabled.sentence ? settings.sentenceGap : 0,
    settings.pauseEnabled.paragraph ? settings.paragraphGap : 0,
    settings.wordRepeats,
    settings.sentenceRepeats,
    settings.paragraphRepeats,
  );

  const playback = useReaderPlayback({
    doc,
    words,
    settings,
    positionRef,
    setMinimized: settings.setPlayerMinimized,
  });

  useDomHighlight({
    active: playback.active,
    levels: settings.levels,
    playing: playback.playing,
    words,
  });

  if (!doc) return <ReaderLoading />;

  return (
    <main className="reader-shell">
      <ReaderTopbar
        title={doc.title}
        languages={languages}
        saveState={saveState}
        editing={editing}
        onTitleChange={(title) => setDoc({ ...doc, title })}
        onToggleEditing={() => setEditing(!editing)}
        onSave={save}
        onOpenSettings={() => settings.setSettingsOpen(true)}
      />
      <div
        className={`reader-layout ${settings.minimized ? "player-minimized" : ""}`}
      >
        <ReaderPaper
          editing={editing}
          content={doc.content}
          highlightColors={settings.highlightColors}
          fontSize={settings.fontSize}
          lineHeight={settings.lineHeight}
          letterSpacing={settings.letterSpacing}
          onContentChange={(content) => setDoc({ ...doc, content })}
          onStartAt={playback.startAt}
        />
        {!settings.minimized && (
          <ReaderControls
            settingsOpen={settings.settingsOpen}
            onMinimize={() => settings.setPlayerMinimized(true)}
            onClose={() => settings.setSettingsOpen(false)}
          >
            <ReaderSettingsPanel
              estimate={estimate}
              wordCount={words.length}
              ttsEngine={settings.ttsEngine}
              preferredVoice={settings.preferredVoice}
              preferredEdgeVoice={settings.preferredEdgeVoice}
              voices={voices}
              edgeVoices={edgeVoices}
              levels={settings.levels}
              highlightColors={settings.highlightColors}
              fontSize={settings.fontSize}
              lineHeight={settings.lineHeight}
              letterSpacing={settings.letterSpacing}
              wpm={settings.wpm}
              wordGap={settings.wordGap}
              sentenceGap={settings.sentenceGap}
              paragraphGap={settings.paragraphGap}
              pauseEnabled={settings.pauseEnabled}
              wordRepeats={settings.wordRepeats}
              sentenceRepeats={settings.sentenceRepeats}
              paragraphRepeats={settings.paragraphRepeats}
              playing={playback.playing}
              progress={playback.progress}
              hasWords={words.length > 0}
              onTtsEngineChange={settings.setTtsEngine}
              onPreferredVoiceChange={settings.setPreferredVoice}
              onPreferredEdgeVoiceChange={settings.setPreferredEdgeVoice}
              onLevelChange={(level, enabled) =>
                settings.setLevels({ ...settings.levels, [level]: enabled })
              }
              onColorChange={settings.setHighlightColor}
              onTypographyChange={settings.setTypography}
              onWpmChange={settings.setWpm}
              onWordGapChange={settings.setWordGap}
              onSentenceGapChange={settings.setSentenceGap}
              onParagraphGapChange={settings.setParagraphGap}
              onPauseEnabledChange={(level, enabled) =>
                settings.setPauseEnabled({
                  ...settings.pauseEnabled,
                  [level]: enabled,
                })
              }
              onWordRepeatsChange={settings.setWordRepeats}
              onSentenceRepeatsChange={settings.setSentenceRepeats}
              onParagraphRepeatsChange={settings.setParagraphRepeats}
              onJump={playback.jump}
              onTogglePlay={playback.togglePlay}
              onSeek={playback.seekFromProgress}
              onScrubStart={playback.onScrubStart}
              onScrubEnd={playback.onScrubEnd}
            />
          </ReaderControls>
        )}
        {settings.minimized && (
          <MiniPlayer
            progress={playback.progress}
            playing={playback.playing}
            onExpand={() => settings.setPlayerMinimized(false)}
            onTogglePlay={playback.togglePlay}
          />
        )}
      </div>
    </main>
  );
}
