import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  fetchImportFromUrl,
  ImportUrlError,
  isImportUrl,
} from "../../lib/import-url";
import { exportLibrary } from "../../lib/export-library";
import { createId } from "../../lib/id";
import { Doc, Folder, storage } from "../../lib/storage";

async function loadLibrary() {
  await storage.seed();
  const [folderList, docList] = await Promise.all([
    storage.folders(),
    storage.docs(),
  ]);
  return {
    folders: folderList.sort((a, b) => a.name.localeCompare(b.name)),
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
      const folder = await storage.folder(name);
      setFolders((current) =>
        [...current, folder].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setSelected(folder.id);
      cancelFolderCreate();
    } catch {
      savingFolderRef.current = false;
    }
  };

  const deleteDoc = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    await storage.deleteDoc(id);
    setDocs((current) => current.filter((doc) => doc.id !== id));
  };

  const deleteFolder = async (id: string, name: string) => {
    const count = docs.filter((doc) => doc.folderId === id).length;
    const message = count
      ? `Delete folder "${name}"? ${count} page(s) will become unfiled.`
      : `Delete folder "${name}"?`;
    if (!confirm(message)) return;
    await storage.deleteFolder(id);
    setFolders((current) => current.filter((folder) => folder.id !== id));
    setDocs((current) =>
      current.map((doc) =>
        doc.folderId === id ? { ...doc, folderId: null } : doc,
      ),
    );
    if (selected === id) setSelected("all");
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

  const importFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      await saveImportedDoc(
        file.name.replace(/\.(md|markdown|txt)$/i, ""),
        String(reader.result ?? ""),
      );
    };
    reader.readAsText(file);
    event.target.value = "";
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
    deleteFolder,
    createDoc,
    importFile,
    importFromLink,
    handleImportLinkPaste,
    handleExportLibrary,
  };
}
