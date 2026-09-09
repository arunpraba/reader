import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { detectParagraphLanguage } from "./detect-language.ts";

describe("detectParagraphLanguage", () => {
  it("uses the regional language when a paragraph mixes English and Tamil", () => {
    assert.equal(detectParagraphLanguage("Hello world. தமிழ் உரை."), "ta-IN");
  });

  it("uses Tamil for the whole paragraph when any Tamil is present", () => {
    assert.equal(
      detectParagraphLanguage(
        "Reading across languages should feel natural. நல்லது.",
      ),
      "ta-IN",
    );
  });

  it("keeps English when the paragraph has no regional script", () => {
    assert.equal(
      detectParagraphLanguage("Read one paragraph slowly."),
      "en-US",
    );
  });

  it("keeps Tamil for a fully Tamil paragraph", () => {
    assert.equal(
      detectParagraphLanguage("ஒரு நல்ல வாசிப்பு மனதை அமைதியாக்கும்."),
      "ta-IN",
    );
  });
});
