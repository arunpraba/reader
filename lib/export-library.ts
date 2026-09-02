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

export function buildExportPaths(
  folders: { id: string; name: string }[],
  docs: { id: string; folderId: string | null; title: string }[],
) {
  return docs.map((doc) => {
    const folder = folders.find((item) => item.id === doc.folderId);
    return `${folder ? safeExportName(folder.name) : "Root"}/${safeExportName(doc.title)}-${doc.id.slice(0, 6)}.md`;
  });
}

export function exportLibrary(folders: Folder[], docs: Doc[]) {
  const files: Record<string, Uint8Array> = {};
  folders.forEach((folder) => {
    files[`${safeExportName(folder.name)}/.keep`] = strToU8("");
  });
  docs.forEach((doc) => {
    const folder = folders.find((item) => item.id === doc.folderId);
    const path = `${folder ? safeExportName(folder.name) : "Root"}/${safeExportName(doc.title)}-${doc.id.slice(0, 6)}.md`;
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
