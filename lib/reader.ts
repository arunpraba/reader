import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { detectParagraphLanguage } from "./detect-language";
import { splitSentences } from "./split-sentences";

export { detectLanguage, detectParagraphLanguage } from "./detect-language";

export type HighlightLevels = {
  word: boolean;
  sentence: boolean;
  paragraph: boolean;
};
export type Word = {
  text: string;
  language: string;
  blockIndex: number;
  sentenceIndex: number;
  wordIndex: number;
  sentenceEnd: boolean;
  paragraphEnd: boolean;
};
export type Block = {
  type: "h1" | "h2" | "p" | "list" | "table" | "code" | "quote";
  text: string;
  sentences: string[][];
};

type MdastNode = {
  type?: string;
  depth?: number;
  value?: string;
  alt?: string;
  children?: MdastNode[];
};

/** Containers of block children — join with spaces so nested lists/quotes stay separable. */
const BLOCK_CONTAINER = new Set([
  "list",
  "listItem",
  "blockquote",
  "table",
  "tableRow",
  "root",
]);

/**
 * Extract speakable text from mdast.
 * Skips images (alt would desync from DOM) and fenced code (not read aloud).
 */
export function nodeReadableText(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const n = node as MdastNode;
  if (n.type === "image" || n.type === "imageReference" || n.type === "code") {
    return "";
  }
  if (n.type === "text" || n.type === "inlineCode") {
    return n.value ?? "";
  }
  const children = n.children ?? [];
  if (!children.length) return "";
  const parts = children.map(nodeReadableText).filter(Boolean);
  if (!parts.length) return "";
  const joined = BLOCK_CONTAINER.has(n.type ?? "")
    ? parts.join(" ")
    : parts.join("");
  return joined.replace(/\s+/g, " ").trim();
}

function isNumericToken(text: string) {
  return /^[\p{N}]+([.,][\p{N}]+)*%?$/u.test(text);
}

function resolveNumericLanguage(prev?: Word, next?: Word) {
  const prevLang = prev?.language;
  const nextLang = next?.language;
  if (prevLang && prevLang === nextLang) return prevLang;
  if (prevLang && prevLang !== "en-US") return prevLang;
  if (nextLang && nextLang !== "en-US") return nextLang;
  return prevLang ?? nextLang ?? "en-US";
}

export function parseMarkdown(content: string): Block[] {
  const tree = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .parse(content) as { children: MdastNode[] };

  return tree.children
    .filter(
      (node) =>
        ![
          "thematicBreak",
          "definition",
          "html",
          "code", // fenced code / mermaid — shown, not spoken
        ].includes(node.type ?? ""),
    )
    .map((node) => {
      const type: Block["type"] =
        node.type === "heading"
          ? node.depth === 1
            ? "h1"
            : "h2"
          : node.type === "list"
            ? "list"
            : node.type === "table"
              ? "table"
              : node.type === "blockquote"
                ? "quote"
                : "p";
      const tableText =
        node.type === "table"
          ? (node.children ?? [])
              .map((row) =>
                (row.children ?? [])
                  .map((cell) => nodeReadableText(cell))
                  .filter(Boolean)
                  .join("; "),
              )
              .filter(Boolean)
              .join(". ")
          : "";
      const text = (tableText || nodeReadableText(node))
        .replace(/\s+/g, " ")
        .trim();
      const sentenceTexts =
        type === "h1" || type === "h2" || type === "table"
          ? text
            ? [text]
            : []
          : type === "list"
            ? (node.children ?? [])
                .map((item) => nodeReadableText(item))
                .filter(Boolean)
                .flatMap((item) => splitSentences(item))
            : splitSentences(text);
      return {
        type,
        text: type === "list" ? sentenceTexts.join(" ") : text,
        sentences: sentenceTexts.map(
          (sentence) =>
            sentence.match(/[\p{L}\p{M}\p{N}'’-]+|[^\s\p{L}\p{M}\p{N}]/gu) ??
            [],
        ),
      };
    })
    .filter((block) => block.text);
}

export function flattenWords(blocks: Block[]): Word[] {
  const words: Word[] = [];
  blocks.forEach((block, blockIndex) => {
    const language = detectParagraphLanguage(block.text);
    block.sentences.forEach((sentence, sentenceIndex) =>
      sentence.forEach((text, wordIndex) => {
        const isWord = /[\p{L}\p{M}\p{N}]/u.test(text);
        if (!isWord) return;
        const nextWordIndex = sentence
          .slice(wordIndex + 1)
          .findIndex((part) => /[\p{L}\p{M}\p{N}]/u.test(part));
        words.push({
          text,
          language,
          blockIndex,
          sentenceIndex,
          wordIndex,
          sentenceEnd: nextWordIndex === -1,
          paragraphEnd:
            sentenceIndex === block.sentences.length - 1 &&
            nextWordIndex === -1,
        });
      }),
    );
  });
  words.forEach((word, index) => {
    if (!isNumericToken(word.text)) return;
    word.language = resolveNumericLanguage(words[index - 1], words[index + 1]);
  });
  return words;
}

export function estimateSeconds(
  words: Word[],
  wpm: number,
  wordGap: number,
  sentenceGap: number,
  paragraphGap: number,
  wordRepeats: number,
  sentenceRepeats: number,
  paragraphRepeats: number,
) {
  const multiplier = wordRepeats * sentenceRepeats * paragraphRepeats;
  const speech = (words.length / wpm) * 60 * multiplier;
  const wordPauseCount =
    words.length * (wordRepeats - 1) +
    words.filter((word) => !word.sentenceEnd).length;
  const sentenceCount = words.filter((word) => word.sentenceEnd).length;
  const sentencePauseCount =
    sentenceCount * (sentenceRepeats - 1) +
    words.filter((word) => word.sentenceEnd && !word.paragraphEnd).length;
  const wordPauses =
    wordPauseCount * wordGap * sentenceRepeats * paragraphRepeats;
  const sentencePauses = sentencePauseCount * sentenceGap * paragraphRepeats;
  const paragraphPauses =
    words.filter((word) => word.paragraphEnd).length *
    paragraphGap *
    paragraphRepeats;
  return speech + wordPauses + sentencePauses + paragraphPauses;
}

export function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds)) return "—";
  const rounded = Math.max(1, Math.round(seconds));
  const minutes = Math.floor(rounded / 60);
  const rest = rounded % 60;
  return minutes ? `${minutes}m ${rest}s` : `${rest}s`;
}

/** Media-style clock for playhead scrubbers (allows 0:00). */
export function formatClock(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const rounded = Math.floor(seconds);
  const minutes = Math.floor(rounded / 60);
  const rest = rounded % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}
