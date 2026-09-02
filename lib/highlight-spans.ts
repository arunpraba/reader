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

export function scrollRangeIntoView(
  range: Range,
  options: ScrollIntoViewOptions = { behavior: "smooth", block: "center" },
) {
  const rect = range.getBoundingClientRect();
  if (!rect.height && !rect.width) return;
  const block = options.block ?? "center";
  let top = window.scrollY + rect.top;
  if (block === "center") {
    top = top - window.innerHeight / 2 + rect.height / 2;
  } else if (block === "end") {
    top = top - window.innerHeight + rect.height;
  }
  window.scrollTo({
    top: Math.max(0, top),
    behavior: options.behavior ?? "smooth",
  });
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
