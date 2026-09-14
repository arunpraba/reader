import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { listLibraryItems } from "./folder-tree.ts";

describe("pinned pages", () => {
  it("keeps pinned pages at the top of All files", () => {
    const items = listLibraryItems(
      [
        {
          id: "loose",
          folderId: null,
          title: "Loose",
          content: "",
          updatedAt: 3,
        },
        {
          id: "pinned",
          folderId: "drafts",
          title: "Pinned",
          content: "",
          updatedAt: 1,
          pinned: true,
        },
      ],
      [
        { id: "notes", name: "Notes", createdAt: 1, parentId: null },
        { id: "drafts", name: "drafts", createdAt: 1, parentId: "notes" },
      ],
      "all",
      "",
      "name-asc",
    );
    assert.equal(items[0]?.name, "Pinned");
  });
});
