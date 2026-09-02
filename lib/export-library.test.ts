import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildExportPaths, safeExportName } from "./export-library.ts";

describe("safeExportName", () => {
  it("replaces invalid filename characters", () => {
    assert.equal(safeExportName('bad/name:test'), "bad-name-test");
  });

  it("returns Untitled for empty names", () => {
    assert.equal(safeExportName("   "), "Untitled");
  });
});

describe("buildExportPaths", () => {
  it("builds paths with folder names and doc ids", () => {
    const paths = buildExportPaths(
      [{ id: "f1", name: "Notes" }],
      [{ id: "abc12345", folderId: "f1", title: "Hello" }],
    );
    assert.deepEqual(paths, ["Notes/Hello-abc123.md"]);
  });

  it("uses Root for unfiled docs", () => {
    const paths = buildExportPaths(
      [],
      [{ id: "abc12345", folderId: null, title: "Draft" }],
    );
    assert.deepEqual(paths, ["Root/Draft-abc123.md"]);
  });
});
