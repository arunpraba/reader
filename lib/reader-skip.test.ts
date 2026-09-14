import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { stripParentheticals } from "./strip-parentheticals.ts";

describe("stripParentheticals", () => {
  it("removes a parenthetical from spoken text", () => {
    assert.equal(
      stripParentheticals("The cat (felis catus) sat"),
      "The cat sat",
    );
  });

  it("peels nested groups inside-out", () => {
    assert.equal(stripParentheticals("See (a (b) c) now"), "See now");
  });

  it("leaves an unbalanced parenthesis", () => {
    assert.equal(stripParentheticals("Wait (oops"), "Wait (oops");
  });
});
