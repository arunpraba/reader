/** Docs above this size enable reader virtualization and TTS hot-path opts. */
export const LARGE_DOC_WORD_THRESHOLD = 5_000;

export type WordPauseStats = {
  midSentence: number;
  sentenceEnds: number;
  midParagraphSentenceEnds: number;
  paragraphEnds: number;
};

type PauseWord = {
  sentenceEnd: boolean;
  paragraphEnd: boolean;
};

type BlockWord = PauseWord & {
  blockIndex: number;
};

/** Single pass — avoid re-scanning the full word list on every React render. */
export function wordPauseStats(words: PauseWord[]): WordPauseStats {
  let midSentence = 0;
  let sentenceEnds = 0;
  let midParagraphSentenceEnds = 0;
  let paragraphEnds = 0;
  for (const word of words) {
    if (word.sentenceEnd) {
      sentenceEnds += 1;
      if (word.paragraphEnd) paragraphEnds += 1;
      else midParagraphSentenceEnds += 1;
    } else {
      midSentence += 1;
    }
  }
  return {
    midSentence,
    sentenceEnds,
    midParagraphSentenceEnds,
    paragraphEnds,
  };
}

export function estimateSeconds(
  words: PauseWord[],
  wpm: number,
  wordGap: number,
  sentenceGap: number,
  paragraphGap: number,
  wordRepeats: number,
  sentenceRepeats: number,
  paragraphRepeats: number,
  stats?: WordPauseStats,
) {
  const counts = stats ?? wordPauseStats(words);
  const multiplier = wordRepeats * sentenceRepeats * paragraphRepeats;
  const speech = (words.length / wpm) * 60 * multiplier;
  const wordPauseCount = words.length * (wordRepeats - 1) + counts.midSentence;
  const sentencePauseCount =
    counts.sentenceEnds * (sentenceRepeats - 1) +
    counts.midParagraphSentenceEnds;
  const wordPauses =
    wordPauseCount * wordGap * sentenceRepeats * paragraphRepeats;
  const sentencePauses = sentencePauseCount * sentenceGap * paragraphRepeats;
  const paragraphPauses =
    counts.paragraphEnds * paragraphGap * paragraphRepeats;
  return speech + wordPauses + sentencePauses + paragraphPauses;
}

export function wordsByBlockIndex<T extends BlockWord>(
  words: T[],
): Map<number, T[]> {
  const map = new Map<number, T[]>();
  for (const word of words) {
    const list = map.get(word.blockIndex);
    if (list) list.push(word);
    else map.set(word.blockIndex, [word]);
  }
  return map;
}
