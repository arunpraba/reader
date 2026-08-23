export function locateWordSpans(text: string, words: { text: string }[]) {
  const spans: Array<{ start: number; end: number } | null> = [];
  let cursor = 0;
  for (const word of words) {
    if (!word.text) {
      spans.push(null);
      continue;
    }
    const index = text.indexOf(word.text, cursor);
    if (index === -1) {
      spans.push(null);
      continue;
    }
    spans.push({ start: index, end: index + word.text.length });
    cursor = index + word.text.length;
  }
  return spans;
}

export function expandSentenceSpan(text: string, start: number, end: number) {
  let nextStart = start;
  let nextEnd = end;
  while (nextStart > 0 && /["'«“‘([{]/u.test(text[nextStart - 1] ?? "")) {
    nextStart -= 1;
  }
  while (
    nextEnd < text.length &&
    !/[\s\p{L}\p{M}\p{N}]/u.test(text[nextEnd] ?? "")
  ) {
    nextEnd += 1;
  }
  return { start: nextStart, end: nextEnd };
}
