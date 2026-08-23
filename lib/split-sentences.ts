const DOTTED_ABBREVIATIONS = [
  "mr",
  "mrs",
  "ms",
  "dr",
  "prof",
  "sr",
  "jr",
  "st",
  "ave",
  "blvd",
  "inc",
  "ltd",
  "co",
  "corp",
  "vs",
  "etc",
  "eg",
  "e.g",
  "ie",
  "i.e",
  "cf",
  "al",
  "approx",
  "fig",
  "no",
  "vol",
  "pp",
  "gen",
  "gov",
  "hon",
  "pres",
  "sen",
  "rep",
  "rev",
  "sgt",
  "capt",
  "col",
  "lt",
  "jan",
  "feb",
  "mar",
  "apr",
  "jun",
  "jul",
  "aug",
  "sep",
  "sept",
  "oct",
  "nov",
  "dec",
  "a.m",
  "p.m",
  "u.s",
  "u.k",
  "u.n",
  "e.u",
  "ph.d",
  "m.d",
  "b.a",
  "m.a",
  "b.s",
  "m.s",
];

const ABBREVIATION_SET = new Set(
  DOTTED_ABBREVIATIONS.map((item) => item.toLowerCase().replace(/\./g, "")),
);

const SENTENCE_END = /[.!?…。！？؟۔।॥]/u;
const CLOSING_WRAP = /["'»”’)\]}」』】〉》]/u;

function segmentWithIntl(text: string, locale: string) {
  const segmenter = new Intl.Segmenter(locale, { granularity: "sentence" });
  return [...segmenter.segment(text)]
    .map((part) => part.segment.trim())
    .filter(Boolean);
}

function mergeFalseSplits(parts: string[]) {
  if (parts.length <= 1) return parts;
  const merged: string[] = [];

  for (const part of parts) {
    const previous = merged.at(-1);
    if (!previous) {
      merged.push(part);
      continue;
    }

    const prevTrimmed = previous.trim();
    const prevCore = prevTrimmed
      .replace(/["'»”’)\]]+$/u, "")
      .replace(/[.!?…。！？؟۔।॥]+$/u, "");
    const lastToken = prevCore.split(/\s+/).at(-1) ?? "";
    const lastTokenCore = lastToken.replace(/\./g, "").toLowerCase();
    const nextTrimmed = part.trim();
    const nextStartsLetter = /^[\p{L}]/u.test(nextTrimmed);
    const isAbbrev = ABBREVIATION_SET.has(lastTokenCore);
    const isInitial = /^[A-Za-z]\.?$/.test(lastToken);

    if ((isAbbrev || isInitial) && nextStartsLetter) {
      merged[merged.length - 1] = `${prevTrimmed} ${nextTrimmed}`.replace(
        /\s+/g,
        " ",
      );
      continue;
    }

    if (/\d$/.test(prevTrimmed) && /^\d/.test(nextTrimmed)) {
      merged[merged.length - 1] = `${prevTrimmed}${nextTrimmed}`;
      continue;
    }

    merged.push(part);
  }

  return merged;
}

function splitFallback(text: string) {
  const sentences: string[] = [];
  let start = 0;

  for (let i = 0; i < text.length; i++) {
    if (!SENTENCE_END.test(text[i] ?? "")) continue;

    let end = i + 1;
    while (
      end < text.length &&
      (SENTENCE_END.test(text[end] ?? "") || CLOSING_WRAP.test(text[end] ?? ""))
    ) {
      end += 1;
    }

    const next = text.slice(end);
    const terminator = text.slice(i, end);
    const cjkOrIndic = /[。！？؟۔।॥]/.test(terminator);
    if (
      next &&
      !/^\s/.test(next) &&
      /^[\p{L}\p{N}]/u.test(next) &&
      !cjkOrIndic
    ) {
      continue;
    }
    if (/^[\p{Ll}]/u.test(next.trimStart())) continue;

    const chunk = text.slice(start, end).trim();
    if (chunk) sentences.push(chunk);
    start = end;
    i = end - 1;
  }

  const tail = text.slice(start).trim();
  if (tail) sentences.push(tail);
  return sentences;
}

export function splitSentences(text: string, locale = "en") {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  try {
    return mergeFalseSplits(segmentWithIntl(normalized, locale));
  } catch {
    return splitFallback(normalized);
  }
}
