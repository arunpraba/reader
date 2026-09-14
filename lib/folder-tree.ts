export type TreeFolder = {
  id: string;
  name: string;
  createdAt: number;
  parentId?: string | null;
};

export const FOLDER_PATH_SEP = " / ";

export function parentIdOf(folder: { parentId?: string | null }) {
  return folder.parentId || null;
}

export function isRootFolder(folder: { parentId?: string | null }) {
  return !parentIdOf(folder);
}

export function folderAncestors<T extends TreeFolder>(
  folders: T[],
  folderId: string | null,
) {
  const byId = new Map(folders.map((folder) => [folder.id, folder]));
  const chain: T[] = [];
  const seen = new Set<string>();
  let current = folderId ? byId.get(folderId) : undefined;
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    chain.push(current);
    const parentId = parentIdOf(current);
    current = parentId ? byId.get(parentId) : undefined;
  }
  return chain.reverse();
}

export function folderPathLabel<T extends TreeFolder>(
  folders: T[],
  folderId: string | null,
) {
  return folderAncestors(folders, folderId)
    .map((folder) => folder.name)
    .join(FOLDER_PATH_SEP);
}

export function subtreeIds<T extends TreeFolder>(folders: T[], rootId: string) {
  const ids = new Set<string>([rootId]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const folder of folders) {
      const parentId = parentIdOf(folder);
      if (parentId && ids.has(parentId) && !ids.has(folder.id)) {
        ids.add(folder.id);
        grew = true;
      }
    }
  }
  return ids;
}

export function slashSegments(name: string) {
  if (!name.includes(FOLDER_PATH_SEP)) return null;
  const parts = name
    .split(FOLDER_PATH_SEP)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length > 1 ? parts : null;
}

function siblingName(
  name: string,
  folders: TreeFolder[],
  parentId: string | null,
  ignoreId?: string,
) {
  const taken = new Set(
    folders
      .filter(
        (folder) => folder.id !== ignoreId && parentIdOf(folder) === parentId,
      )
      .map((folder) => folder.name.toLocaleLowerCase()),
  );
  if (!taken.has(name.toLocaleLowerCase())) return name;
  let n = 2;
  while (taken.has(`${name} (${n})`.toLocaleLowerCase())) n += 1;
  return `${name} (${n})`;
}

function findSibling(
  folders: TreeFolder[],
  parentId: string | null,
  name: string,
) {
  const key = name.toLocaleLowerCase();
  return folders.find(
    (folder) =>
      parentIdOf(folder) === parentId &&
      folder.name.toLocaleLowerCase() === key &&
      !slashSegments(folder.name),
  );
}

/** Split imported `Name / Child` folders into a real chain. Docs stay on the leaf id. */
export function repairSlashFolders(
  folders: TreeFolder[],
  nextId: () => string,
): { folders: TreeFolder[]; upserts: TreeFolder[] } {
  const working = folders.map((folder) => ({ ...folder }));
  const upserts = new Map<string, TreeFolder>();
  const slashed = working
    .filter((folder) => slashSegments(folder.name))
    .sort(
      (a, b) =>
        (slashSegments(a.name)?.length ?? 0) -
        (slashSegments(b.name)?.length ?? 0),
    );

  for (const folder of slashed) {
    const segments = slashSegments(folder.name);
    if (!segments) continue;
    let parentId = parentIdOf(folder);
    for (const segment of segments.slice(0, -1)) {
      let match = findSibling(working, parentId, segment);
      if (!match) {
        match = {
          ...folder,
          id: nextId(),
          name: segment,
          parentId,
        };
        working.push(match);
        upserts.set(match.id, match);
      }
      parentId = match.id;
    }
    const leafName = siblingName(
      segments[segments.length - 1],
      working,
      parentId,
      folder.id,
    );
    const next = { ...folder, name: leafName, parentId };
    const index = working.findIndex((item) => item.id === folder.id);
    working[index] = next;
    upserts.set(next.id, next);
  }

  return { folders: working, upserts: [...upserts.values()] };
}

export function listLibraryItems<
  TFolder extends TreeFolder,
  TDoc extends {
    id: string;
    folderId: string | null;
    title: string;
    content: string;
    updatedAt: number;
    pinned?: boolean;
  },
>(
  docs: TDoc[],
  folders: TFolder[],
  selected: string | null | "all",
  search: string,
  sort: "name-asc" | "name-desc" | "modified-desc" | "modified-asc",
) {
  const atRoot = selected === "all" || selected === null;
  const terms = search.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  const searching = terms.length > 0;
  const scope = atRoot || !selected ? null : subtreeIds(folders, selected);

  const folderItems = folders
    .filter((folder) => {
      if (atRoot) return searching || isRootFolder(folder);
      return parentIdOf(folder) === selected;
    })
    .filter(
      (folder) =>
        !searching ||
        terms.every((term) => folder.name.toLocaleLowerCase().includes(term)),
    )
    .map((folder) => ({
      kind: "folder" as const,
      folder,
      name: folder.name,
      date: folder.createdAt,
    }));

  const docItems = docs
    .filter((doc) => {
      if (atRoot) return searching || doc.folderId === null || Boolean(doc.pinned);
      if (!searching) return doc.folderId === selected;
      return doc.folderId !== null && scope?.has(doc.folderId) === true;
    })
    .filter((doc) => {
      if (!searching) return true;
      const title = doc.title.toLocaleLowerCase();
      const content = doc.content.toLocaleLowerCase();
      const folder = (
        folders.find((item) => item.id === doc.folderId)?.name ?? ""
      ).toLocaleLowerCase();
      return terms.every(
        (term) =>
          title.includes(term) ||
          content.includes(term) ||
          folder.includes(term),
      );
    })
    .map((doc) => ({
      kind: "doc" as const,
      doc,
      name: doc.title,
      date: doc.updatedAt,
    }));

  return [...folderItems, ...docItems].sort((a, b) => {
    const pin =
      Number(b.kind === "doc" && Boolean(b.doc.pinned)) -
      Number(a.kind === "doc" && Boolean(a.doc.pinned));
    if (pin) return pin;
    if (sort === "name-asc" || sort === "name-desc") {
      const cmp = a.name.localeCompare(b.name, undefined, {
        sensitivity: "base",
      });
      return sort === "name-asc" ? cmp : -cmp;
    }
    const cmp = a.date - b.date;
    return sort === "modified-asc" ? cmp : -cmp;
  });
}

export function planFolderChain(
  folders: TreeFolder[],
  segments: string[],
  nextId: () => string,
  createdAt: number,
): {
  folders: TreeFolder[];
  created: TreeFolder[];
  leafId: string;
  rootId: string;
} {
  const working = [...folders];
  const created: TreeFolder[] = [];
  let parentId: string | null = null;
  let rootId = "";
  let leafId = "";

  for (const segment of segments) {
    let match = findSibling(working, parentId, segment);
    if (!match) {
      match = {
        id: nextId(),
        name: segment,
        parentId,
        createdAt,
      };
      working.push(match);
      created.push(match);
    }
    if (!rootId) rootId = match.id;
    leafId = match.id;
    parentId = match.id;
  }

  return { folders: working, created, leafId, rootId };
}
