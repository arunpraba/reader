import type { HighlightLevels } from "./reader";
import type { Word } from "./reader";
import { expandSentenceSpan, locateWordSpans } from "./highlight-spans";

type HighlightRegistry = {
  delete: (name: string) => void;
  set: (name: string, highlight: unknown) => void;
};

type HighlightConstructor = (new (
  ...ranges: Range[]
) => {
  priority: number;
}) & { prototype: { priority: number } };

export function getHighlightRegistry(): HighlightRegistry | undefined {
  return (
    CSS as unknown as { highlights?: HighlightRegistry }
  ).highlights;
}

export function getHighlightConstructor(): HighlightConstructor | undefined {
  return (
    window as unknown as { Highlight?: HighlightConstructor }
  ).Highlight;
}

export function clearDomHighlights(root: HTMLElement | null) {
  root
    ?.querySelectorAll(".dom-paragraph-highlight")
    .forEach((element) =>
      element.classList.remove("dom-paragraph-highlight"),
    );
  const highlightRegistry = getHighlightRegistry();
  highlightRegistry?.delete("margin-word");
  highlightRegistry?.delete("margin-sentence");
  highlightRegistry?.delete("margin-paragraph");
}

export function makeRangeFromOffsets(
  element: HTMLElement,
  start: number,
  end: number,
): Range | null {
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
}

export type ApplyReadingHighlightsResult = {
  sentenceRange: Range | null;
  element: HTMLElement;
};

export function applyReadingHighlights({
  root,
  active,
  words,
  levels,
}: {
  root: HTMLElement;
  active: Word;
  words: Word[];
  levels: HighlightLevels;
}): ApplyReadingHighlightsResult | null {
  const element = root.querySelector<HTMLElement>(
    `[data-read-block='${active.blockIndex}']`,
  );
  if (!element) return null;

  const HighlightConstructor = getHighlightConstructor();
  const highlightRegistry = getHighlightRegistry();

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

  let sentenceRange: Range | null = null;
  if (activeOrdinal >= 0) {
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
      sentenceRange = makeRangeFromOffsets(element, expanded.start, expanded.end);
    }

    if (HighlightConstructor) {
      if (levels.sentence && sentenceRange) {
        setHighlight("margin-sentence", sentenceRange, 1);
      }
      if (levels.word) {
        const span = spans[activeOrdinal];
        if (span) {
          const range = makeRangeFromOffsets(element, span.start, span.end);
          if (range) setHighlight("margin-word", range, 2);
        }
      }
    }
  }

  return { sentenceRange, element };
}
