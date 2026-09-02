import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { safeExportName } from "./export-library.ts";

describe("dom-highlight helpers", () => {
  it("safeExportName sanitizes paths used by highlight export paths", () => {
    assert.equal(safeExportName("a/b"), "a-b");
  });
});
