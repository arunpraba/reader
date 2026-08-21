"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  detectLanguage,
  estimateSeconds,
  flattenWords,
  formatDuration,
  HighlightLevels,
  parseMarkdown,
  Word,
} from "../../lib/reader";
import { languageNames } from "../../lib/language-names";
import { readableText } from "../../lib/readable-text";
import { Doc, storage } from "../../lib/storage";
import { CounterRow } from "./counter-row";
import { Gap } from "./gap";
import { MarkdownDocument } from "./markdown-document";
import { MiniPlayer } from "./mini-player";
import { ProgressTrack } from "./progress-track";
import { ToggleRow } from "./toggle-row";

export default function ReaderPage() {
  const [doc, setDoc] = useState<Doc | null>(null);
  const [editing, setEditing] = useState(false);
  const [levels, setLevels] = useState<HighlightLevels>({
    word: true,
    sentence: false,
    paragraph: false,
  });
  const [highlightColors, setHighlightColors] = useState({
    word: "#e6b54f",
    sentence: "#f2d78f",
    paragraph: "#cfe5d8",
  });
  const [wpm, setWpm] = useState(150);
  const [wordGap, setWordGap] = useState(0);
  const [sentenceGap, setSentenceGap] = useState(0);
  const [paragraphGap, setParagraphGap] = useState(0);
  const [pauseEnabled, setPauseEnabled] = useState({
    word: false,
    sentence: false,
    paragraph: false,
  });
  const [wordRepeats, setWordRepeats] = useState(1);
  const [sentenceRepeats, setSentenceRepeats] = useState(1);
  const [paragraphRepeats, setParagraphRepeats] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [active, setActive] = useState<Word | null>(null);
  const [progress, setProgress] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [saveState, setSaveState] = useState<"saved" | "saving">("saved");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [preferredVoice, setPreferredVoice] = useState("");
  const [fontSize, setFontSize] = useState(21);
  const [lineHeight, setLineHeight] = useState(1.85);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const runId = useRef(0);
  const speedRef = useRef(wpm);
  const gapRef = useRef({
    word: wordGap,
    sentence: sentenceGap,
    paragraph: paragraphGap,
    enabled: pauseEnabled,
  });
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
    const matches = [
      ...(element.textContent ?? "").matchAll(/[\p{L}\p{M}\p{N}'’-]+/gu),
    ];
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
        const indices = blockWords
          .map((word, index) => ({ word, index }))
          .filter((item) => item.word.sentenceIndex === active.sentenceIndex)
          .map((item) => item.index);
        const first = matches[indices[0]];
        const last = matches[indices.at(-1) ?? -1];
        if (first && last && first.index !== undefined) {
          const text = element.textContent ?? "";
          let start = first.index;
          let end = last.index + last[0].length;
          // Pull in opening quotes/brackets before the first word.
          while (start > 0 && /["'«“‘(\[{]/u.test(text[start - 1])) {
            start -= 1;
          }
          // Pull in trailing punctuation after the last word (., !, ?, ), ", …).
          while (
            end < text.length &&
            !/[\s\p{L}\p{M}\p{N}]/u.test(text[end] ?? "")
          ) {
            end += 1;
          }
          const range = makeRange(start, end);
          if (range) setHighlight("margin-sentence", range, 1);
        }
      }
      if (levels.word && matches[activeOrdinal]) {
        const match = matches[activeOrdinal];
        if (match.index !== undefined) {
          const range = makeRange(match.index, match.index + match[0].length);
          if (range) setHighlight("margin-word", range, 2);
        }
      }
    }

    if (playing)
      element.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [active, levels, playing, words]);
  useEffect(() => () => speechSynthesis.cancel(), []);
  useEffect(() => {
    speedRef.current = wpm;
  }, [wpm]);
  useEffect(() => {
    gapRef.current = {
      word: wordGap,
      sentence: sentenceGap,
      paragraph: paragraphGap,
      enabled: pauseEnabled,
    };
  }, [wordGap, sentenceGap, paragraphGap, pauseEnabled]);
  useEffect(() => {
    if (!doc || active || !doc.readingPosition || !words.length) return;
    const saved = doc.readingPosition;
    const restored = words.find(
      (word) =>
        word.blockIndex === saved.blockIndex &&
        word.sentenceIndex === saved.sentenceIndex &&
        word.wordIndex === saved.wordIndex,
    );
    if (restored) {
      setActive(restored);
      setProgress(saved.progress);
    }
  }, [doc?.id, words.length]);
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
    setPreferredVoice(localStorage.getItem("margin-preferred-voice") ?? "");
    const savedColors = localStorage.getItem("margin-highlight-colors");
    if (savedColors)
      try {
        setHighlightColors(JSON.parse(savedColors));
      } catch {
        /* use accessible defaults */
      }
    const savedTypography = localStorage.getItem("margin-typography");
    if (savedTypography)
      try {
        const next = JSON.parse(savedTypography) as {
          fontSize?: number;
          lineHeight?: number;
          letterSpacing?: number;
        };
        if (typeof next.fontSize === "number") setFontSize(next.fontSize);
        if (typeof next.lineHeight === "number") setLineHeight(next.lineHeight);
        if (typeof next.letterSpacing === "number")
          setLetterSpacing(next.letterSpacing);
      } catch {
        /* use defaults */
      }
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

  const stop = (clearActive = true) => {
    runId.current += 1;
    speechSynthesis.cancel();
    setPlaying(false);
    if (clearActive) setActive(null);
  };
  const configureUtterance = (
    utterance: SpeechSynthesisUtterance,
    language: string,
  ) => {
    utterance.lang = language;
    utterance.rate = Math.min(10, Math.max(0.1, speedRef.current / 150));
    const available = speechSynthesis.getVoices();
    const preferred = available.find(
      (voice) =>
        voice.voiceURI === preferredVoice &&
        voice.lang
          .toLowerCase()
          .startsWith(utterance.lang.slice(0, 2).toLowerCase()),
    );
    utterance.voice =
      preferred ??
      available.find(
        (voice) => voice.lang.toLowerCase() === utterance.lang.toLowerCase(),
      ) ??
      available.find((voice) =>
        voice.lang
          .toLowerCase()
          .startsWith(utterance.lang.slice(0, 2).toLowerCase()),
      ) ??
      null;
  };
  const speakWord = (word: Word) =>
    new Promise<void>((resolve) => {
      const utterance = new SpeechSynthesisUtterance(word.text);
      configureUtterance(utterance, detectLanguage(word.text));
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      speechSynthesis.speak(utterance);
    });
  const speakRun = (run: Word[]) =>
    new Promise<void>((resolve) => {
      const text = run.map((word) => word.text).join(" ");
      const starts: number[] = [];
      let cursor = 0;
      run.forEach((word) => {
        starts.push(cursor);
        cursor += word.text.length + 1;
      });
      const utterance = new SpeechSynthesisUtterance(text);
      configureUtterance(utterance, run[0].language);
      setActive(run[0]);
      utterance.onboundary = (event) => {
        let index = 0;
        starts.forEach((start, item) => {
          if (start <= event.charIndex) index = item;
        });
        setActive(run[index]);
      };
      utterance.onend = () => {
        setActive(run.at(-1) ?? null);
        resolve();
      };
      utterance.onerror = () => resolve();
      speechSynthesis.speak(utterance);
    });
  const wait = (seconds: number, id: number) =>
    new Promise<void>((resolve) => {
      const check = () => (id === runId.current ? resolve() : resolve());
      setTimeout(check, seconds * 1000);
    });
  const play = async (startIndex = 0) => {
    if (!words.length) return;
    const normalizedStart = Math.min(words.length - 1, Math.max(0, startIndex));
    stop(false);
    const id = ++runId.current;
    setPlaying(true);
    setProgress(normalizedStart / words.length);
    const remainingWords = words.slice(normalizedStart);
    const paragraphs = remainingWords.reduce<Word[][]>((groups, word) => {
      const last = groups.at(-1);
      if (!last || last[0].blockIndex !== word.blockIndex) groups.push([word]);
      else last.push(word);
      return groups;
    }, []);
    let completed = 0;
    const total =
      remainingWords.length * wordRepeats * sentenceRepeats * paragraphRepeats;
    for (const paragraph of paragraphs)
      for (let pr = 0; pr < paragraphRepeats; pr++) {
        const sentences = paragraph.reduce<Word[][]>((groups, word) => {
          const last = groups.at(-1);
          if (!last || last[0].sentenceIndex !== word.sentenceIndex)
            groups.push([word]);
          else last.push(word);
          return groups;
        }, []);
        for (const sentence of sentences)
          for (let sr = 0; sr < sentenceRepeats; sr++) {
            if (!gapRef.current.enabled.word && wordRepeats === 1) {
              const runs = sentence.reduce<Word[][]>((groups, word) => {
                const last = groups.at(-1);
                if (!last || last[0].language !== word.language)
                  groups.push([word]);
                else last.push(word);
                return groups;
              }, []);
              for (const run of runs) {
                if (id !== runId.current) return;
                await speakRun(run);
                completed += run.length;
                setProgress(completed / total);
              }
            } else
              for (const word of sentence)
                for (let wr = 0; wr < wordRepeats; wr++) {
                  if (id !== runId.current) return;
                  setActive(word);
                  await speakWord(word);
                  completed += 1;
                  setProgress(completed / total);
                  if (
                    (wr < wordRepeats - 1 || !word.sentenceEnd) &&
                    gapRef.current.enabled.word
                  )
                    await wait(gapRef.current.word, id);
                }
            if (
              (sr < sentenceRepeats - 1 || !sentence.at(-1)?.paragraphEnd) &&
              gapRef.current.enabled.sentence
            )
              await wait(gapRef.current.sentence, id);
          }
        if (gapRef.current.enabled.paragraph)
          await wait(gapRef.current.paragraph, id);
      }
    if (id === runId.current) {
      setPlaying(false);
      setProgress(1);
    }
  };
  const activeIndex = () =>
    active
      ? words.findIndex(
          (word) =>
            word.blockIndex === active.blockIndex &&
            word.sentenceIndex === active.sentenceIndex &&
            word.wordIndex === active.wordIndex,
        )
      : 0;
  const startAt = (blockIndex: number, wordOrdinal: number) => {
    const blockWords = words.filter((word) => word.blockIndex === blockIndex);
    const target =
      blockWords[Math.min(blockWords.length - 1, Math.max(0, wordOrdinal))];
    const index = target ? words.indexOf(target) : -1;
    if (index >= 0) {
      setMinimized(true);
      localStorage.setItem("margin-player-minimized", "true");
      play(index);
    }
  };
  const jump = (unit: "sentence" | "paragraph", direction: -1 | 1) => {
    const starts = words.reduce<number[]>((items, word, index) => {
      const previous = words[index - 1];
      if (
        !previous ||
        (unit === "paragraph"
          ? previous.blockIndex !== word.blockIndex
          : previous.blockIndex !== word.blockIndex ||
            previous.sentenceIndex !== word.sentenceIndex)
      )
        items.push(index);
      return items;
    }, []);
    const current = activeIndex();
    let group = Math.max(
      0,
      starts.findIndex(
        (start, index) =>
          start <= current && (starts[index + 1] ?? Infinity) > current,
      ),
    );
    group = Math.min(starts.length - 1, Math.max(0, group + direction));
    const target = starts[group] ?? 0;
    const resume = playing;
    stop(false);
    setActive(words[target]);
    setProgress(target / Math.max(1, words.length));
    setMinimized(true);
    localStorage.setItem("margin-player-minimized", "true");
    if (resume) queueMicrotask(() => play(target));
  };
  const seekToRatio = (ratio: number, resume = true) => {
    if (!words.length) return 0;
    const target = Math.min(
      words.length - 1,
      Math.max(0, Math.round(ratio * (words.length - 1))),
    );
    const shouldResume = resume && playing;
    stop(false);
    setActive(words[target]);
    setProgress(target / Math.max(1, words.length));
    if (scrubbingRef.current) scrubbingRef.current.target = target;
    if (shouldResume) queueMicrotask(() => play(target));
    return target;
  };
  const setPlayerMinimized = (value: boolean) => {
    setMinimized(value);
    localStorage.setItem("margin-player-minimized", String(value));
    if (!value) setSettingsOpen(true);
  };
  const setHighlightColor = (level: keyof HighlightLevels, color: string) => {
    const next = { ...highlightColors, [level]: color };
    setHighlightColors(next);
    localStorage.setItem("margin-highlight-colors", JSON.stringify(next));
  };
  const setTypography = (
    next: Partial<{
      fontSize: number;
      lineHeight: number;
      letterSpacing: number;
    }>,
  ) => {
    const font = next.fontSize ?? fontSize;
    const height = next.lineHeight ?? lineHeight;
    const spacing = next.letterSpacing ?? letterSpacing;
    if (next.fontSize !== undefined) setFontSize(next.fontSize);
    if (next.lineHeight !== undefined) setLineHeight(next.lineHeight);
    if (next.letterSpacing !== undefined) setLetterSpacing(next.letterSpacing);
    localStorage.setItem(
      "margin-typography",
      JSON.stringify({
        fontSize: font,
        lineHeight: height,
        letterSpacing: spacing,
      }),
    );
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
        <a href="/">← Library</a>
        <p>Opening your page…</p>
      </main>
    );

  return (
    <main className="reader-shell">
      <header className="reader-topbar">
        <a href="/" className="back-link">
          ← <span>Library</span>
        </a>
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
                onChange={(e) => {
                  setPreferredVoice(e.target.value);
                  localStorage.setItem(
                    "margin-preferred-voice",
                    e.target.value,
                  );
                }}
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
                onClick={() => (playing ? stop(false) : play(activeIndex()))}
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
            onTogglePlay={() => (playing ? stop(false) : play(activeIndex()))}
          />
        )}
      </div>
    </main>
  );
}
