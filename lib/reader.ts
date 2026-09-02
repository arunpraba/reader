import { toString } from "mdast-util-to-string";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { splitSentences } from "./split-sentences";

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

const SCRIPT_LANGUAGES: Array<{ pattern: RegExp; language: string }> = [
  { pattern: /[\u3040-\u30FF\u31F0-\u31FF]/u, language: "ja-JP" },
  { pattern: /[\uAC00-\uD7AF\u1100-\u11FF]/u, language: "ko-KR" },
  { pattern: /[\u4E00-\u9FFF\u3400-\u4DBF]/u, language: "zh-CN" },
  { pattern: /[\u0B80-\u0BFF]/u, language: "ta-IN" },
  { pattern: /[\u0C00-\u0C7F]/u, language: "te-IN" },
  { pattern: /[\u0C80-\u0CFF]/u, language: "kn-IN" },
  { pattern: /[\u0D00-\u0D7F]/u, language: "ml-IN" },
  { pattern: /[\u0980-\u09FF]/u, language: "bn-IN" },
  { pattern: /[\u0A00-\u0A7F]/u, language: "pa-IN" },
  { pattern: /[\u0A80-\u0AFF]/u, language: "gu-IN" },
  { pattern: /[\u0B00-\u0B7F]/u, language: "or-IN" },
  { pattern: /[\u0D80-\u0DFF]/u, language: "si-LK" },
  { pattern: /[\u0900-\u097F]/u, language: "hi-IN" },
  { pattern: /[\u0E00-\u0E7F]/u, language: "th-TH" },
  { pattern: /[\u0E80-\u0EFF]/u, language: "lo-LA" },
  { pattern: /[\u1780-\u17FF]/u, language: "km-KH" },
  { pattern: /[\u1000-\u109F]/u, language: "my-MM" },
  { pattern: /[\u0590-\u05FF]/u, language: "he-IL" },
  { pattern: /[\u0600-\u06FF\u0750-\u077F]/u, language: "ar-SA" },
  { pattern: /[\u1200-\u137F]/u, language: "am-ET" },
  { pattern: /[\u0370-\u03FF\u1F00-\u1FFF]/u, language: "el-GR" },
  { pattern: /[\u0530-\u058F]/u, language: "hy-AM" },
  { pattern: /[\u10A0-\u10FF]/u, language: "ka-GE" },
  { pattern: /[\u0400-\u04FF]/u, language: "ru-RU" },
  { pattern: /[\u0F00-\u0FFF]/u, language: "bo-CN" },
  { pattern: /[\u1800-\u18AF]/u, language: "mn-MN" },
];

const LATIN_HINTS: Array<{ pattern: RegExp; language: string }> = [
  {
    pattern:
      /[ăâđêôơưĂÂĐÊÔƠƯ]|[àáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]/u,
    language: "vi-VN",
  },
  { pattern: /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/u, language: "pl-PL" },
  { pattern: /[ğışĞİŞ]/u, language: "tr-TR" },
  { pattern: /[äöüßÄÖÜ]/u, language: "de-DE" },
  { pattern: /[ñÑ¿¡]/u, language: "es-ES" },
  { pattern: /[ãõÃÕ]/u, language: "pt-BR" },
  { pattern: /[æøåÆØÅ]/u, language: "da-DK" },
  { pattern: /[ăâîșțĂÂÎȘȚ]/u, language: "ro-RO" },
  { pattern: /[àâæçéèêëïîôùûüÿœÀÂÆÇÉÈÊËÏÎÔÙÛÜŸŒ]/u, language: "fr-FR" },
  { pattern: /[àèéìíîòóùúÀÈÉÌÍÎÒÓÙÚ]/u, language: "it-IT" },
  { pattern: /[čďěňřšťůžČĎĚŇŘŠŤŮŽ]/u, language: "cs-CZ" },
  { pattern: /[áéíóöőúüűÁÉÍÓÖŐÚÜŰ]/u, language: "hu-HU" },
  { pattern: /[ďľĺňŕšťýžĎĽĹŇŔŠŤÝŽ]/u, language: "sk-SK" },
  { pattern: /[ćčđšžĆČĐŠŽ]/u, language: "hr-HR" },
  { pattern: /[åäöÅÄÖ]/u, language: "sv-SE" },
];

export function detectLanguage(text: string) {
  for (const { pattern, language } of SCRIPT_LANGUAGES) {
    if (pattern.test(text)) return language;
  }
  for (const { pattern, language } of LATIN_HINTS) {
    if (pattern.test(text)) return language;
  }
  return "en-US";
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
    .parse(content) as {
    children: Array<{
      type: string;
      depth?: number;
      children?: Array<{ children?: unknown[] }>;
      value?: string;
    }>;
  };
  return tree.children
    .filter(
      (node) => !["thematicBreak", "definition", "html"].includes(node.type),
    )
    .map((node) => {
      let type: Block["type"] =
        node.type === "heading"
          ? node.depth === 1
            ? "h1"
            : "h2"
          : node.type === "list"
            ? "list"
            : node.type === "table"
              ? "table"
              : node.type === "code"
                ? "code"
                : node.type === "blockquote"
                  ? "quote"
                  : "p";
      const tableText =
        node.type === "table"
          ? (node.children ?? [])
              .map((row) =>
                ((row as { children?: unknown[] }).children ?? [])
                  .map((cell) => toString(cell as never))
                  .join("; "),
              )
              .join(". ")
          : "";
      const text = (tableText || toString(node as never) || node.value || "")
        .replace(/\s+/g, " ")
        .trim();
      const sentenceTexts =
        type === "h1" || type === "h2" || type === "table"
          ? text
            ? [text]
            : []
          : type === "list"
            ? (node.children ?? [])
                .map((item) =>
                  toString(item as never)
                    .replace(/\s+/g, " ")
                    .trim(),
                )
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
  blocks.forEach((block, blockIndex) =>
    block.sentences.forEach((sentence, sentenceIndex) =>
      sentence.forEach((text, wordIndex) => {
        const isWord = /[\p{L}\p{M}\p{N}]/u.test(text);
        if (!isWord) return;
        const nextWordIndex = sentence
          .slice(wordIndex + 1)
          .findIndex((part) => /[\p{L}\p{M}\p{N}]/u.test(part));
        words.push({
          text,
          language: detectLanguage(text),
          blockIndex,
          sentenceIndex,
          wordIndex,
          sentenceEnd: nextWordIndex === -1,
          paragraphEnd:
            sentenceIndex === block.sentences.length - 1 &&
            nextWordIndex === -1,
        });
      }),
    ),
  );
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
