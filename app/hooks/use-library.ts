import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  fetchImportFromUrl,
  ImportUrlError,
  isImportUrl,
} from "@/lib/import-url";
import { exportLibrary } from "@/lib/export-library";
import {
  planFolderChain,
  repairSlashFolders,
  subtreeIds,
} from "@/lib/folder-tree";
import { createId } from "@/lib/id";
import { Doc, Folder, storage } from "@/lib/storage";

const IMPORT_EXT = /\.(md|markdown|txt)$/i;
const SKIP_DIR = new Set(["node_modules", "__MACOSX"]);

function isImportablePath(relativePath: string) {
  const segments = relativePath.split("/").filter(Boolean);
  if (segments.length === 0) return false;
  if (segments.some((part) => part.startsWith(".") || SKIP_DIR.has(part))) {
    return false;
  }
  return IMPORT_EXT.test(segments[segments.length - 1]);
}

async function loadLibrary() {
  await storage.seed();
  const [folderList, docList] = await Promise.all([
    storage.folders(),
    storage.docs(),
  ]);
  const repaired = repairSlashFolders(folderList, createId);
  if (repaired.upserts.length) {
    await Promise.all(repaired.upserts.map((folder) => storage.saveFolder(folder)));
  }
  return {
    folders: repaired.folders.sort((a, b) => a.name.localeCompare(b.name)),
    docs: docList.sort((a, b) => b.updatedAt - a.updatedAt),
  };
}

export function useLibrary({
  selected,
  setSelected,
  initFolderSelection,
  isMobile,
}: {
  selected: string | null | "all";
  setSelected: (value: string | null | "all") => void;
  initFolderSelection: (folders: Folder[]) => void;
  isMobile: boolean;
}) {
  const router = useRouter();
  const folderInputRef = useRef<HTMLInputElement>(null);
  const savingFolderRef = useRef(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolder, setNewFolder] = useState("");
  const [importLink, setImportLink] = useState("");
  const [importingLink, setImportingLink] = useState(false);
  const [importLinkError, setImportLinkError] = useState("");
  const [importNotice, setImportNotice] = useState("");

  useEffect(() => {
    let cancelled = false;
    void loadLibrary().then((library) => {
      if (cancelled) return;
      setFolders(library.folders);
      setDocs(library.docs);
      initFolderSelection(library.folders);
    });
    return () => {
      cancelled = true;
    };
  }, [initFolderSelection]);

  useEffect(() => {
    if (!creatingFolder) return;
    folderInputRef.current?.focus();
    folderInputRef.current?.select();
  }, [creatingFolder, isMobile]);

  const cancelFolderCreate = () => {
    savingFolderRef.current = false;
    setCreatingFolder(false);
    setNewFolder("");
  };

  const startFolderCreate = () => {
    savingFolderRef.current = false;
    setNewFolder("");
    setCreatingFolder(true);
  };

  const createFolder = async () => {
    const name = newFolder.trim();
    if (!name) {
      cancelFolderCreate();
      return;
    }
    if (savingFolderRef.current) return;
    savingFolderRef.current = true;
    try {
      const folder = await storage.folder(
        name,
        selected === "all" || selected === null ? null : selected,
      );
      setFolders((current) =>
        [...current, folder].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setSelected(folder.id);
      cancelFolderCreate();
    } catch {
      savingFolderRef.current = false;
    }
  };

  const deleteDoc = async (id: string) => {
    await storage.deleteDoc(id);
    setDocs((current) => current.filter((doc) => doc.id !== id));
  };

  const moveDoc = async (id: string, folderId: string | null) => {
    const doc = docs.find((item) => item.id === id);
    if (!doc || doc.folderId === folderId) return;
    const next = { ...doc, folderId };
    await storage.save(next);
    setDocs((current) =>
      current.map((item) => (item.id === id ? next : item)),
    );
  };

  const deleteFolder = async (id: string) => {
    const ids = subtreeIds(folders, id);
    await storage.deleteFolder(id);
    setFolders((current) => current.filter((folder) => !ids.has(folder.id)));
    setDocs((current) =>
      current.map((doc) =>
        doc.folderId && ids.has(doc.folderId)
          ? { ...doc, folderId: null }
          : doc,
      ),
    );
    if (selected !== "all" && selected !== null && ids.has(selected)) {
      setSelected("all");
    }
  };

  const createDoc = async () => {
    const doc: Doc = {
      id: createId(),
      folderId: selected === "all" ? null : selected,
      title: "Untitled",
      content: "# Untitled\n\nStart writing here…",
      updatedAt: Date.now(),
    };
    await storage.save(doc);
    router.push(`/reader/?id=${doc.id}&edit=1`);
  };

  const saveImportedDoc = async (title: string, content: string) => {
    const doc: Doc = {
      id: createId(),
      folderId: selected === "all" ? null : selected,
      title: title.trim() || "Untitled",
      content,
      updatedAt: Date.now(),
    };
    await storage.save(doc);
    router.push(`/reader/?id=${doc.id}`);
  };

  const importFolder = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = [...(event.target.files ?? [])];
    event.target.value = "";
    event.currentTarget.closest("details")?.removeAttribute("open");
    if (files.length === 0) return;

    const usable = files.filter((file) =>
      isImportablePath(file.webkitRelativePath || file.name),
    );
    if (usable.length === 0) {
      setImportNotice("No Markdown or text files in that folder.");
      return;
    }
    setImportNotice("");

    const createdFolders: Folder[] = [];
    const createdDocs: Doc[] = [];
    const importedRoots = new Set<string>();
    let working = [...folders];
    let stamp = Date.now() + usable.length;

    for (const file of usable) {
      const relative = file.webkitRelativePath || file.name;
      const segments = relative.split("/").slice(0, -1).filter(Boolean);
      const planned = segments.length
        ? planFolderChain(working, segments, createId, stamp)
        : null;
      if (planned) {
        working = planned.folders;
        for (const folder of planned.created) {
          await storage.saveFolder(folder);
          createdFolders.push(folder);
        }
        importedRoots.add(planned.rootId);
      }
      stamp -= 1;
      const doc: Doc = {
        id: createId(),
        folderId: planned?.leafId ?? (selected === "all" ? null : selected),
        title: file.name.replace(/\.(md|markdown|txt)$/i, "") || "Untitled",
        content: await file.text(),
        updatedAt: stamp,
      };
      await storage.save(doc);
      createdDocs.push(doc);
    }

    setFolders((current) =>
      [...current, ...createdFolders].sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    );
    setDocs((current) =>
      [...createdDocs, ...current].sort((a, b) => b.updatedAt - a.updatedAt),
    );
    setSelected(importedRoots.size === 1 ? [...importedRoots][0] : "all");
  };

  const importFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = [...(event.target.files ?? [])];
    event.target.value = "";
    setImportNotice("");
    if (files.length === 0) return;

    const imported = await Promise.all(
      files.map(async (file, index) => {
        const content = await file.text();
        const doc: Doc = {
          id: createId(),
          folderId: selected === "all" ? null : selected,
          title: file.name.replace(/\.(md|markdown|txt)$/i, "") || "Untitled",
          content,
          updatedAt: Date.now() + (files.length - index),
        };
        await storage.save(doc);
        return doc;
      }),
    );

    setDocs((current) =>
      [...imported, ...current].sort((a, b) => b.updatedAt - a.updatedAt),
    );
    if (imported.length === 1) {
      router.push(`/reader/?id=${imported[0].id}`);
    }
  };

  const importFromLink = async (rawLink: string) => {
    const link = rawLink.trim();
    if (!link) return;
    setImportLinkError("");
    setImportingLink(true);
    try {
      const imported = await fetchImportFromUrl(link);
      setImportLink("");
      await saveImportedDoc(imported.title, imported.content);
    } catch (error) {
      setImportLinkError(
        error instanceof ImportUrlError
          ? error.message
          : "Could not import this link",
      );
    } finally {
      setImportingLink(false);
    }
  };

  const handleImportLinkPaste = (
    event: React.ClipboardEvent<HTMLInputElement>,
  ) => {
    const pasted = event.clipboardData.getData("text").trim();
    if (!isImportUrl(pasted)) return;
    event.preventDefault();
    setImportLink(pasted);
    void importFromLink(pasted);
  };

  const handleExportLibrary = () => exportLibrary(folders, docs);

  return {
    folders,
    docs,
    creatingFolder,
    newFolder,
    setNewFolder,
    folderInputRef,
    importLink,
    setImportLink,
    importingLink,
    importLinkError,
    setImportLinkError,
    cancelFolderCreate,
    startFolderCreate,
    createFolder,
    deleteDoc,
    moveDoc,
    deleteFolder,
    createDoc,
    importNotice,
    setImportNotice,
    importFile,
    importFolder,
    importFromLink,
    handleImportLinkPaste,
    handleExportLibrary,
  };
}
