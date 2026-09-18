import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  segmentGuidedFocusText,
  shouldSkipGuidedFocusWord,
  splitGuidedFocusWord,
} from "./guided-focus.ts";

describe("splitGuidedFocusWord", () => {
  it("dims the middle and keeps the last grapheme", () => {
    const parts = splitGuidedFocusWord("reading");
    assert.deepEqual(parts, { prefix: "rea", middle: "din", end: "g" });
  });

  it("skips short words with no middle to dim", () => {
    assert.equal(splitGuidedFocusWord("a"), null);
    assert.equal(splitGuidedFocusWord("to"), null);
  });

  it("preserves concatenation for transformed words", () => {
    for (const word of ["the", "hello", "reading", "extraordinary"]) {
      const parts = splitGuidedFocusWord(word);
      if (!parts) continue;
      assert.equal(parts.prefix + parts.middle + parts.end, word);
    }
  });

  it("does not transform CJK or Thai words", () => {
    assert.equal(shouldSkipGuidedFocusWord("日本語"), true);
    assert.equal(shouldSkipGuidedFocusWord("ไทย"), true);
    assert.equal(splitGuidedFocusWord("日本語"), null);
  });
});

describe("segmentGuidedFocusText", () => {
  it("preserves the full string when rejoined", () => {
    const text = "Hello world 你好!";
    assert.equal(
      segmentGuidedFocusText(text)
        .map((s) => s.text)
        .join(""),
      text,
    );
  });
});
