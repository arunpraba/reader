/** Scripts where space-based / word-prefix fixation is unreliable. */
const SKIP_SCRIPT =
  /[\u3040-\u30FF\u31F0-\u31FF\uAC00-\uD7AF\u1100-\u11FF\u4E00-\u9FFF\u3400-\u4DBF\u0E00-\u0E7F\u0E80-\u0EFF\u1780-\u17FF\u1000-\u109F\u0F00-\u0FFF]/u;

const WORD_FALLBACK = /[\p{L}\p{M}\p{N}'’-]+|[^\p{L}\p{M}\p{N}]+/gu;

export type GuidedFocusParts = {
  prefix: string;
  middle: string;
  end: string;
};

function graphemes(text: string): string[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    return [
      ...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(
        text,
      ),
    ].map((s) => s.segment);
  }
  return Array.from(text);
}

/** Prefix grapheme count; 1 grapheme is always reserved for the end. */
export function guidedFocusPrefixLength(len: number): number {
  if (len <= 1) return len;
  if (len <= 4) return 1;
  if (len <= 6) return 2;
  if (len <= 10) return 3;
  return Math.ceil((len - 1) * 0.4);
}

export function shouldSkipGuidedFocusWord(word: string): boolean {
  if (SKIP_SCRIPT.test(word)) return true;
  // Numbers / digit-only tokens — no guided focus
  if (!/\p{L}/u.test(word)) return true;
  return false;
}

/**
 * Split a word into full-opacity prefix, dimmed middle, full-opacity end.
 * Returns null when there is nothing useful to dim (short words / no middle).
 */
export function splitGuidedFocusWord(word: string): GuidedFocusParts | null {
  if (shouldSkipGuidedFocusWord(word)) return null;

  const g = graphemes(word);
  const len = g.length;
  if (len < 3) return null;

  let prefixLen = guidedFocusPrefixLength(len);
  const endLen = 1;
  if (prefixLen + endLen >= len) {
    prefixLen = Math.max(1, len - endLen - 1);
  }
  if (prefixLen + endLen >= len) return null;

  const middle = g.slice(prefixLen, len - endLen).join("");
  if (!middle) return null;

  return {
    prefix: g.slice(0, prefixLen).join(""),
    middle,
    end: g.slice(len - endLen).join(""),
  };
}

export function segmentGuidedFocusText(
  text: string,
): Array<{ text: string; isWord: boolean }> {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    return [
      ...new Intl.Segmenter(undefined, { granularity: "word" }).segment(text),
    ].map((s) => ({
      text: s.segment,
      isWord: Boolean(s.isWordLike),
    }));
  }

  const parts: Array<{ text: string; isWord: boolean }> = [];
  for (const match of text.matchAll(WORD_FALLBACK)) {
    const segment = match[0];
    parts.push({
      text: segment,
      isWord: /[\p{L}\p{M}\p{N}]/u.test(segment),
    });
  }
  return parts.length > 0 ? parts : [{ text, isWord: false }];
}
