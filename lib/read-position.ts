const WORD_PATTERN = /[\p{L}\p{M}\p{N}'’-]+/gu;

export function wordOrdinalAtOffset(text: string, charOffset: number) {
  const matches = [...text.matchAll(WORD_PATTERN)];
  if (!matches.length) return 0;
  const offset = Math.max(0, charOffset);
  for (let index = 0; index < matches.length; index++) {
    const match = matches[index];
    const start = match.index ?? 0;
    const end = start + match[0].length;
    if (offset <= end) return index;
  }
  return matches.length - 1;
}

export function charOffsetInBlock(block: HTMLElement, x: number, y: number) {
  const doc = document;
  let range: Range | null = null;

  if (doc.caretRangeFromPoint) {
    range = doc.caretRangeFromPoint(x, y);
  } else {
    const caret = (
      doc as Document & {
        caretPositionFromPoint?: (
          x: number,
          y: number,
        ) => { offsetNode: Node; offset: number } | null;
      }
    ).caretPositionFromPoint?.(x, y);
    if (caret) {
      range = doc.createRange();
      range.setStart(caret.offsetNode, caret.offset);
      range.collapse(true);
    }
  }

  if (!range || !block.contains(range.startContainer)) return null;

  const prefix = doc.createRange();
  prefix.selectNodeContents(block);
  prefix.setEnd(range.startContainer, range.startOffset);
  return prefix.toString().length;
}

export function readPositionFromPoint(
  block: HTMLElement,
  x: number,
  y: number,
) {
  const offset = charOffsetInBlock(block, x, y);
  if (offset == null) return null;
  const text = block.textContent ?? "";
  return wordOrdinalAtOffset(text, offset);
}
