import { strToU8, zipSync } from "fflate";
import type { Doc, Folder } from "./storage";

export function safeExportName(name: string) {
  return (
    name
      .replace(/[\\/:*?"<>|]/g, "-")
      .replace(/\s+/g, " ")
      .trim() || "Untitled"
  );
}

function folderExportPath(
  folders: { id: string; name: string; parentId?: string | null }[],
  folderId: string | null,
) {
  if (!folderId) return "Root";
  const byId = new Map(folders.map((folder) => [folder.id, folder]));
  const names: string[] = [];
  const seen = new Set<string>();
  let current = byId.get(folderId);
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    names.push(safeExportName(current.name));
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  if (!names.length) return "Root";
  return names.reverse().join("/");
}

export function buildExportPaths(
  folders: { id: string; name: string; parentId?: string | null }[],
  docs: { id: string; folderId: string | null; title: string }[],
) {
  return docs.map(
    (doc) =>
      `${folderExportPath(folders, doc.folderId)}/${safeExportName(doc.title)}-${doc.id.slice(0, 6)}.md`,
  );
}

export function exportLibrary(folders: Folder[], docs: Doc[]) {
  const files: Record<string, Uint8Array> = {};
  folders.forEach((folder) => {
    files[`${folderExportPath(folders, folder.id)}/.keep`] = strToU8("");
  });
  docs.forEach((doc) => {
    const path = `${folderExportPath(folders, doc.folderId)}/${safeExportName(doc.title)}-${doc.id.slice(0, 6)}.md`;
    files[path] = strToU8(doc.content);
  });
  files["margin-library.json"] = strToU8(
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        folders,
        documents: docs.map((doc) => ({
          id: doc.id,
          folderId: doc.folderId,
          title: doc.title,
          updatedAt: doc.updatedAt,
          readingPosition: doc.readingPosition,
        })),
      },
      null,
      2,
    ),
  );
  const blob = new Blob([zipSync(files, { level: 6 })], {
    type: "application/zip",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `margin-library-${new Date().toISOString().slice(0, 10)}.zip`;
  anchor.click();
  URL.revokeObjectURL(url);
}
