import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { wordOrdinalAtOffset } from "./read-position.ts";

describe("read-position", () => {
  it("wordOrdinalAtOffset maps character offsets to word ordinals", () => {
    const text = "Hello world again";
    assert.equal(wordOrdinalAtOffset(text, 0), 0);
    assert.equal(wordOrdinalAtOffset(text, 4), 0);
    assert.equal(wordOrdinalAtOffset(text, 6), 1);
    assert.equal(wordOrdinalAtOffset(text, 12), 2);
    assert.equal(wordOrdinalAtOffset(text, 99), 2);
  });
});
