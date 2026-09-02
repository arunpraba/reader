import { useCallback, useEffect, useRef } from "react";
import type { HighlightLevels } from "../../../lib/reader";
import type { Word } from "../../../lib/reader";
import { scrollRangeIntoView } from "../../../lib/highlight-spans";
import {
  applyReadingHighlights,
  clearDomHighlights,
} from "../../../lib/dom-highlight";
import { useAutoScrollFollow } from "../../../lib/use-auto-scroll-follow";

export function useDomHighlight({
  active,
  levels,
  playing,
  words,
}: {
  active: Word | null;
  levels: HighlightLevels;
  playing: boolean;
  words: Word[];
}) {
  const lastScrollSentenceRef = useRef<{
    blockIndex: number;
    sentenceIndex: number;
  } | null>(null);
  const resetScrollKey = useCallback(() => {
    lastScrollSentenceRef.current = null;
  }, []);
  const { followScroll, runProgrammaticScroll } = useAutoScrollFollow(
    playing,
    resetScrollKey,
  );

  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".markdown-doc");
    clearDomHighlights(root);
    if (!active || !root) return;

    const result = applyReadingHighlights({ root, active, words, levels });
    if (!result) return;

    const { sentenceRange, element } = result;

    if (playing && followScroll) {
      const scrollKey = `${active.blockIndex}:${active.sentenceIndex}`;
      const lastKey = lastScrollSentenceRef.current
        ? `${lastScrollSentenceRef.current.blockIndex}:${lastScrollSentenceRef.current.sentenceIndex}`
        : null;
      if (scrollKey !== lastKey) {
        lastScrollSentenceRef.current = {
          blockIndex: active.blockIndex,
          sentenceIndex: active.sentenceIndex,
        };
        runProgrammaticScroll(() => {
          if (sentenceRange) {
            scrollRangeIntoView(sentenceRange);
          } else {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        });
      }
    } else if (!playing) {
      lastScrollSentenceRef.current = null;
    }
  }, [active, followScroll, levels, playing, runProgrammaticScroll, words]);
}
