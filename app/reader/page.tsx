"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import {
  estimateSeconds,
  flattenWords,
  formatDuration,
  HighlightLevels,
  parseMarkdown,
} from "../../lib/reader";
import { expandSentenceSpan, locateWordSpans } from "../../lib/highlight-spans";
import {
  defaultReaderSettings,
  loadReaderSettings,
  saveReaderSettings,
  type ReaderSettings,
} from "../../lib/reader-settings";
import { languageNames } from "../../lib/language-names";
import { readableText } from "../../lib/readable-text";
import { Doc, storage } from "../../lib/storage";
import { usePlayback } from "../playback-provider";
import { CounterRow } from "./counter-row";
import { Gap } from "./gap";
import { MarkdownDocument } from "./markdown-document";
import { MiniPlayer } from "./mini-player";
import { ProgressTrack } from "./progress-track";
import { ToggleRow } from "./toggle-row";

export default function ReaderPage() {
  const {
    playing,
    progress,
    active,
    bindDocument,
    updateSettings,
    play,
    togglePlay,
    jump: jumpPlayback,
    seekToRatio: seekPlayback,
    activeIndex,
  } = usePlayback();
  const [doc, setDoc] = useState<Doc | null>(null);
  const [editing, setEditing] = useState(false);
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [saveState, setSaveState] = useState<"saved" | "saving">("saved");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [preferredVoice, setPreferredVoice] = useState(
    defaultReaderSettings.preferredVoice,
  );
  const [fontSize, setFontSize] = useState(defaultReaderSettings.fontSize);
  const [lineHeight, setLineHeight] = useState(
    defaultReaderSettings.lineHeight,
  );
  const [letterSpacing, setLetterSpacing] = useState(
    defaultReaderSettings.letterSpacing,
  );
  const [settingsReady, setSettingsReady] = useState(false);
  const positionRef = useRef<Doc["readingPosition"]>(undefined);
  const scrubbingRef = useRef<{ resume: boolean; target: number } | null>(null);

  useEffect(() => {
    const id = new URLSearchParams(location.search).get("id");
    setEditing(new URLSearchParams(location.search).get("edit") === "1");
    setMinimized(localStorage.getItem("margin-player-minimized") === "true");
    if (id)
      storage.doc(id).then((value) => {
        positionRef.current = value?.readingPosition;
        setDoc(value ?? null);
      });
  }, []);

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
    setFontSize(saved.fontSize);
    setLineHeight(saved.lineHeight);
    setLetterSpacing(saved.letterSpacing);
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
      fontSize,
      lineHeight,
      letterSpacing,
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
    fontSize,
    lineHeight,
    letterSpacing,
  ]);
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
    wpm,
    pauseEnabled.word ? wordGap : 0,
    pauseEnabled.sentence ? sentenceGap : 0,
    pauseEnabled.paragraph ? paragraphGap : 0,
    wordRepeats,
    sentenceRepeats,
    paragraphRepeats,
  );

  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".markdown-doc");
    root
      ?.querySelectorAll(".dom-paragraph-highlight")
      .forEach((element) =>
        element.classList.remove("dom-paragraph-highlight"),
      );
    const highlightRegistry = (
      CSS as unknown as {
        highlights?: {
          delete: (name: string) => void;
          set: (name: string, highlight: unknown) => void;
        };
      }
    ).highlights;
    highlightRegistry?.delete("margin-word");
    highlightRegistry?.delete("margin-sentence");
    highlightRegistry?.delete("margin-paragraph");
    if (!active || !root) return;

    const element = root.querySelector<HTMLElement>(
      `[data-read-block='${active.blockIndex}']`,
    );
    if (!element) return;

    const HighlightConstructor = (
      window as unknown as {
        Highlight?: (new (...ranges: Range[]) => {
          priority: number;
        }) & { prototype: { priority: number } };
      }
    ).Highlight;

    const setHighlight = (name: string, range: Range, priority: number) => {
      if (!HighlightConstructor || !highlightRegistry) return;
      const highlight = new HighlightConstructor(range);
      highlight.priority = priority;
      highlightRegistry.set(name, highlight);
    };

    if (levels.paragraph) {
      if (HighlightConstructor && highlightRegistry) {
        const paragraphRange = document.createRange();
        paragraphRange.selectNodeContents(element);
        setHighlight("margin-paragraph", paragraphRange, 0);
      } else {
        element.classList.add("dom-paragraph-highlight");
      }
    }

    const blockWords = words.filter(
      (word) => word.blockIndex === active.blockIndex,
    );
    const activeOrdinal = blockWords.findIndex(
      (word) =>
        word.sentenceIndex === active.sentenceIndex &&
        word.wordIndex === active.wordIndex,
    );
    const text = element.textContent ?? "";
    const spans = locateWordSpans(text, blockWords);
    const makeRange = (start: number, end: number) => {
      const range = document.createRange();
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      let offset = 0;
      let started = false;
      while ((node = walker.nextNode())) {
        const length = node.textContent?.length ?? 0;
        if (!started && start <= offset + length) {
          range.setStart(node, Math.max(0, start - offset));
          started = true;
        }
        if (started && end <= offset + length) {
          range.setEnd(node, Math.max(0, end - offset));
          return range;
        }
        offset += length;
      }
      return null;
    };

    if (HighlightConstructor && activeOrdinal >= 0) {
      if (levels.sentence) {
        const sentenceSpans = blockWords
          .map((word, index) =>
            word.sentenceIndex === active.sentenceIndex ? spans[index] : null,
          )
          .filter((span): span is { start: number; end: number } => !!span);
        if (sentenceSpans.length) {
          const expanded = expandSentenceSpan(
            text,
            sentenceSpans[0].start,
            sentenceSpans.at(-1)!.end,
          );
          const range = makeRange(expanded.start, expanded.end);
          if (range) setHighlight("margin-sentence", range, 1);
        }
      }
      if (levels.word) {
        const span = spans[activeOrdinal];
        if (span) {
          const range = makeRange(span.start, span.end);
          if (range) setHighlight("margin-word", range, 2);
        }
      }
    }

    if (playing)
      element.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [active, levels, playing, words]);
  useEffect(() => {
    if (!doc) return;
    bindDocument({ id: doc.id, title: doc.title, words });
  }, [bindDocument, doc, words]);
  useEffect(() => {
    updateSettings({
      wpm,
      wordGap,
      sentenceGap,
      paragraphGap,
      pauseEnabled,
      wordRepeats,
      sentenceRepeats,
      paragraphRepeats,
      preferredVoice,
    });
  }, [
    updateSettings,
    wpm,
    wordGap,
    sentenceGap,
    paragraphGap,
    pauseEnabled,
    wordRepeats,
    sentenceRepeats,
    paragraphRepeats,
    preferredVoice,
  ]);
  useEffect(() => {
    if (!doc || active || !doc.readingPosition || !words.length || playing)
      return;
    const saved = doc.readingPosition;
    const restoredIndex = words.findIndex(
      (word) =>
        word.blockIndex === saved.blockIndex &&
        word.sentenceIndex === saved.sentenceIndex &&
        word.wordIndex === saved.wordIndex,
    );
    if (restoredIndex >= 0)
      seekPlayback(restoredIndex / Math.max(1, words.length - 1 || 1), false);
  }, [active, doc, playing, seekPlayback, words]);
  useEffect(() => {
    if (!doc || !active) return;
    const position = {
      blockIndex: active.blockIndex,
      sentenceIndex: active.sentenceIndex,
      wordIndex: active.wordIndex,
      progress,
      savedAt: Date.now(),
    };
    positionRef.current = position;
    storage.save({ ...doc, readingPosition: position });
  }, [active, progress]);
  useEffect(() => {
    const refreshVoices = () => setVoices(speechSynthesis.getVoices());
    refreshVoices();
    speechSynthesis.addEventListener("voiceschanged", refreshVoices);
    return () =>
      speechSynthesis.removeEventListener("voiceschanged", refreshVoices);
  }, []);
  useEffect(() => {
    if (!doc) return;
    setSaveState("saving");
    const timer = window.setTimeout(async () => {
      await storage.save({
        ...doc,
        readingPosition: positionRef.current,
        updatedAt: Date.now(),
      });
      setSaveState("saved");
    }, 650);
    return () => window.clearTimeout(timer);
  }, [doc?.title, doc?.content]);

  const startAt = useCallback(
    (blockIndex: number, wordOrdinal: number) => {
      const blockWords = words.filter((word) => word.blockIndex === blockIndex);
      const target =
        blockWords[Math.min(blockWords.length - 1, Math.max(0, wordOrdinal))];
      const index = target ? words.indexOf(target) : -1;
      if (index >= 0) {
        setMinimized(true);
        localStorage.setItem("margin-player-minimized", "true");
        play(index);
      }
    },
    [play, words],
  );
  const jump = (unit: "sentence" | "paragraph", direction: -1 | 1) => {
    setMinimized(true);
    localStorage.setItem("margin-player-minimized", "true");
    jumpPlayback(unit, direction);
  };
  const seekToRatio = (ratio: number, resume = true) => {
    const target = seekPlayback(ratio, resume);
    if (scrubbingRef.current) scrubbingRef.current.target = target;
    return target;
  };
  const setPlayerMinimized = (value: boolean) => {
    setMinimized(value);
    localStorage.setItem("margin-player-minimized", String(value));
    if (!value) setSettingsOpen(true);
  };
  const setHighlightColor = (level: keyof HighlightLevels, color: string) => {
    setHighlightColors({ ...highlightColors, [level]: color });
  };
  const setTypography = (
    next: Partial<{
      fontSize: number;
      lineHeight: number;
      letterSpacing: number;
    }>,
  ) => {
    if (next.fontSize !== undefined) setFontSize(next.fontSize);
    if (next.lineHeight !== undefined) setLineHeight(next.lineHeight);
    if (next.letterSpacing !== undefined) setLetterSpacing(next.letterSpacing);
  };
  const save = async () => {
    if (!doc) return;
    setSaveState("saving");
    const next = { ...doc, updatedAt: Date.now() };
    await storage.save(next);
    setDoc(next);
    setSaveState("saved");
    setEditing(false);
  };
  if (!doc)
    return (
      <main className="reader-loading">
        <Link href="/">← Library</Link>
        <p>Opening your page…</p>
      </main>
    );

  return (
    <main className="reader-shell">
      <header className="reader-topbar">
        <Link href="/" className="back-link">
          ← <span>Library</span>
        </Link>
        <input
          className="reader-title"
          value={doc.title}
          onChange={(e) => setDoc({ ...doc, title: e.target.value })}
          aria-label="Page title"
        />
        <div className="reader-actions">
          <span
            className="auto-language"
            title="Languages are detected for every spoken word"
          >
            ◎{" "}
            {languages.map((lang) => languageNames[lang] ?? lang).join(" · ") ||
              "Auto language"}
          </span>
          <span className="autosave-state" aria-live="polite">
            {saveState === "saving" ? "Saving…" : "✓ Autosaved"}
          </span>
          <button
            className="secondary-button"
            onClick={() => setEditing(!editing)}
          >
            {editing ? "Preview" : "Edit"}
          </button>
          <button className="primary-button" onClick={save}>
            Done
          </button>
          <button
            className="mobile-settings"
            onClick={() => setSettingsOpen(true)}
            aria-label="Open reading settings"
          >
            ☷
          </button>
        </div>
      </header>
      <div className={`reader-layout ${minimized ? "player-minimized" : ""}`}>
        <article
          className="reader-paper"
          style={
            {
              "--highlight-word": highlightColors.word,
              "--highlight-word-text": readableText(highlightColors.word),
              "--highlight-sentence": highlightColors.sentence,
              "--highlight-sentence-text": readableText(
                highlightColors.sentence,
              ),
              "--highlight-paragraph": highlightColors.paragraph,
              "--highlight-paragraph-text": readableText(
                highlightColors.paragraph,
              ),
              "--reader-font-size": `${fontSize}px`,
              "--reader-line-height": String(lineHeight),
              "--reader-letter-spacing": `${letterSpacing}em`,
            } as CSSProperties
          }
        >
          {editing ? (
            <textarea
              className="notion-editor"
              value={doc.content}
              onChange={(e) => setDoc({ ...doc, content: e.target.value })}
              aria-label="Markdown page editor"
              spellCheck
            />
          ) : (
            <MarkdownDocument content={doc.content} onStartAt={startAt} />
          )}
        </article>
        {!minimized && (
          <aside
            className={`reader-controls ${settingsOpen ? "open" : ""}`}
            aria-label="Reading settings"
          >
            <button
              className="close-settings"
              onClick={() => setSettingsOpen(false)}
              aria-label="Close reading settings"
            >
              ×
            </button>
            <button
              className="minimize-player"
              onClick={() => setPlayerMinimized(true)}
              aria-label="Minimize player"
              title="Minimize player"
            >
              —
            </button>
            <div className="control-kicker">Listen & focus</div>
            <h2>Reading controls</h2>
            <div className="estimate-card">
              <span>Approx. complete time</span>
              <strong>{formatDuration(estimate)}</strong>
              <small>{words.length} words · includes all configured gaps</small>
            </div>
            <label className="voice-control">
              <span>
                <b>Preferred voice</b>
                <small>Saved globally on this device</small>
              </span>
              <select
                value={preferredVoice}
                onChange={(e) => setPreferredVoice(e.target.value)}
              >
                <option value="">Auto — multilingual</option>
                {voices.map((voice) => (
                  <option value={voice.voiceURI} key={voice.voiceURI}>
                    {voice.name} · {voice.lang}
                  </option>
                ))}
              </select>
              <small>
                Language detection overrides this choice whenever the text
                changes language.
              </small>
            </label>
            <div className="settings-section">
              <h3>Highlighter</h3>
              <p>Choose an accessible colour, then turn on any combination.</p>
              {(["word", "sentence", "paragraph"] as const).map((level) => (
                <ToggleRow
                  key={level}
                  label={level}
                  color={highlightColors[level]}
                  setColor={(color) => setHighlightColor(level, color)}
                  enabled={levels[level]}
                  onChange={() =>
                    setLevels({ ...levels, [level]: !levels[level] })
                  }
                />
              ))}
            </div>
            <div className="settings-section">
              <h3>Typography</h3>
              <p>Adjust reading text for comfort and focus.</p>
              <CounterRow
                label="Font size"
                value={fontSize}
                setValue={(next) => setTypography({ fontSize: next })}
                min={14}
                max={36}
                step={1}
                suffix="px"
              />
              <CounterRow
                label="Line height"
                value={lineHeight}
                setValue={(next) => setTypography({ lineHeight: next })}
                min={1.2}
                max={2.4}
                step={0.05}
              />
              <CounterRow
                label="Letter spacing"
                value={letterSpacing}
                setValue={(next) => setTypography({ letterSpacing: next })}
                min={-0.05}
                max={0.2}
                step={0.01}
                suffix="em"
              />
            </div>
            <div className="settings-section">
              <h3>Speed</h3>
              <p>Default is 150 words per minute.</p>
              <CounterRow
                label="Reading speed"
                value={wpm}
                setValue={setWpm}
                min={50}
                max={1000}
                step={10}
                suffix="wpm"
              />
            </div>
            <div className="gap-group">
              <h3>Pause between</h3>
              <Gap
                label="Words"
                value={wordGap}
                setValue={setWordGap}
                enabled={pauseEnabled.word}
                setEnabled={(enabled) =>
                  setPauseEnabled({ ...pauseEnabled, word: enabled })
                }
              />
              <Gap
                label="Sentences"
                value={sentenceGap}
                setValue={setSentenceGap}
                enabled={pauseEnabled.sentence}
                setEnabled={(enabled) =>
                  setPauseEnabled({ ...pauseEnabled, sentence: enabled })
                }
              />
              <Gap
                label="Paragraphs"
                value={paragraphGap}
                setValue={setParagraphGap}
                enabled={pauseEnabled.paragraph}
                setEnabled={(enabled) =>
                  setPauseEnabled({ ...pauseEnabled, paragraph: enabled })
                }
              />
            </div>
            <div className="settings-section reread-section">
              <h3>Re-reading</h3>
              <p>Set a separate repeat count for each level.</p>
              <CounterRow
                label="Each word"
                value={wordRepeats}
                setValue={setWordRepeats}
              />
              <CounterRow
                label="Each sentence"
                value={sentenceRepeats}
                setValue={setSentenceRepeats}
              />
              <CounterRow
                label="Each paragraph"
                value={paragraphRepeats}
                setValue={setParagraphRepeats}
              />
            </div>
            <div className="playback navigation-player">
              <button
                onClick={() => jump("paragraph", -1)}
                aria-label="Previous paragraph"
                title="Previous paragraph"
              >
                ¶←
              </button>
              <button
                onClick={() => jump("sentence", -1)}
                aria-label="Previous sentence"
                title="Previous sentence"
              >
                ‹
              </button>
              <button
                className="main-play"
                onClick={togglePlay}
                aria-label={playing ? "Pause" : "Play from selected position"}
              >
                {playing ? "Ⅱ" : "▶"}
              </button>
              <button
                onClick={() => jump("sentence", 1)}
                aria-label="Next sentence"
                title="Next sentence"
              >
                ›
              </button>
              <button
                onClick={() => jump("paragraph", 1)}
                aria-label="Next paragraph"
                title="Next paragraph"
              >
                →¶
              </button>
            </div>
            <ProgressTrack
              progress={progress}
              hasWords={words.length > 0}
              onSeek={(ratio) =>
                seekToRatio(ratio, scrubbingRef.current === null)
              }
              onScrubStart={() => {
                scrubbingRef.current = {
                  resume: playing,
                  target: activeIndex(),
                };
              }}
              onScrubEnd={() => {
                const scrub = scrubbingRef.current;
                scrubbingRef.current = null;
                if (scrub?.resume)
                  queueMicrotask(() => play(Math.max(0, scrub.target)));
              }}
            />
            <div className="play-status" aria-live="polite">
              {playing
                ? `Reading · ${Math.round(progress * 100)}%`
                : progress === 1
                  ? "Complete"
                  : "Ready"}
            </div>
          </aside>
        )}
        {minimized && (
          <MiniPlayer
            progress={progress}
            playing={playing}
            onExpand={() => setPlayerMinimized(false)}
            onTogglePlay={togglePlay}
          />
        )}
      </div>
    </main>
  );
}
