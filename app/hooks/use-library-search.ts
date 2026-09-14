import { useMemo, useState } from "react";
import { folderAncestors, listLibraryItems } from "@/lib/folder-tree";
import {
  loadLibrarySort,
  saveLibrarySort,
  type LibrarySort,
} from "@/lib/reader-settings";
import type { Doc, Folder } from "@/lib/storage";

export type LibraryItem = ReturnType<typeof listLibraryItems<Folder, Doc>>[number];

export function useLibrarySearch(
  docs: Doc[],
  folders: Folder[],
  selected: string | null | "all",
) {
  const [search, setSearch] = useState("");
  const [sort, setSortState] = useState<LibrarySort>(loadLibrarySort);

  const setSort = (next: LibrarySort) => {
    setSortState(next);
    saveLibrarySort(next);
  };

  const trail = useMemo(
    () =>
      selected === "all" || selected === null
        ? []
        : folderAncestors(folders, selected),
    [folders, selected],
  );

  const items = useMemo(
    () => listLibraryItems(docs, folders, selected, search, sort),
    [docs, folders, selected, search, sort],
  );

  return { search, setSearch, items, trail, sort, setSort };
}
