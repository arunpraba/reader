import { useMemo, useState } from "react";
import type { Doc, Folder } from "../../lib/storage";

function searchTerms(search: string) {
  return search.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
}

export function useLibrarySearch(
  docs: Doc[],
  folders: Folder[],
  selected: string | null | "all",
) {
  const [search, setSearch] = useState("");
  const atRoot = selected === "all" || selected === null;

  const visibleFolders = useMemo(() => {
    if (!atRoot) return [];
    const terms = searchTerms(search);
    return folders.filter((folder) => {
      if (!terms.length) return true;
      const name = folder.name.toLocaleLowerCase();
      return terms.every((term) => name.includes(term));
    });
  }, [atRoot, folders, search]);

  const visible = useMemo(() => {
    const terms = searchTerms(search);
    return docs
      .filter((doc) => {
        if (atRoot) return terms.length > 0 || doc.folderId === null;
        return doc.folderId === selected;
      })
      .map((doc) => {
        const title = doc.title.toLocaleLowerCase();
        const content = doc.content.toLocaleLowerCase();
        const folder = (
          folders.find((item) => item.id === doc.folderId)?.name ?? "root"
        ).toLocaleLowerCase();
        const matches = terms.every(
          (term) =>
            title.includes(term) ||
            content.includes(term) ||
            folder.includes(term),
        );
        const score = terms.reduce(
          (total, term) =>
            total +
            (title.includes(term) ? 8 : 0) +
            (folder.includes(term) ? 4 : 0) +
            (content.includes(term) ? 1 : 0),
          0,
        );
        return { doc, matches, score };
      })
      .filter((item) => !terms.length || item.matches)
      .sort((a, b) => b.score - a.score || b.doc.updatedAt - a.doc.updatedAt)
      .map((item) => item.doc);
  }, [atRoot, docs, folders, selected, search]);

  return { search, setSearch, visible, visibleFolders };
}
