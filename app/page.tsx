"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { strToU8, zipSync } from "fflate";
import { Doc, Folder, storage } from "../lib/storage";
import {
  fetchImportFromUrl,
  ImportUrlError,
  isImportUrl,
} from "../lib/import-url";
import {
  loadSelectedFolder,
  loadSidebarCollapsed,
  saveSelectedFolder,
  saveSidebarCollapsed,
} from "../lib/reader-settings";

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

export default function Home() {
  const router = useRouter();
  const folderInputRef = useRef<HTMLInputElement>(null);
  const savingFolderRef = useRef(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [selected, setSelected] = useState<string | null | "all">("all");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolder, setNewFolder] = useState("");
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(max-width: 720px)").matches
      : false,
  );
  const [search, setSearch] = useState("");
  const [importLink, setImportLink] = useState("");
  const [importingLink, setImportingLink] = useState(false);
  const [importLinkError, setImportLinkError] = useState("");
  const [folderSelectionReady, setFolderSelectionReady] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarReady, setSidebarReady] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 720px)");
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    setSidebarCollapsed(loadSidebarCollapsed());
    setSidebarReady(true);
  }, []);

  useEffect(() => {
    if (!sidebarReady) return;
    saveSidebarCollapsed(sidebarCollapsed);
  }, [sidebarCollapsed, sidebarReady]);

  useEffect(() => {
    let cancelled = false;
    void loadLibrary().then((library) => {
      if (cancelled) return;
      setFolders(library.folders);
      setDocs(library.docs);
      const saved = loadSelectedFolder();
      if (
        saved === "all" ||
        saved === null ||
        library.folders.some((folder) => folder.id === saved)
      ) {
        setSelected(saved);
      }
      setFolderSelectionReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!folderSelectionReady) return;
    saveSelectedFolder(selected);
  }, [selected, folderSelectionReady]);

  useEffect(() => {
    if (!creatingFolder) return;
    folderInputRef.current?.focus();
    folderInputRef.current?.select();
  }, [creatingFolder, isMobile]);

  const visible = useMemo(() => {
    const terms = search
      .toLocaleLowerCase()
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    return docs
      .filter((doc) => selected === "all" || doc.folderId === selected)
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
  }, [docs, folders, selected, search]);

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
  const folderCompose = creatingFolder ? (
    <form
      className={isMobile ? "folder-chip-compose" : "folder-compose"}
      onSubmit={(event) => {
        event.preventDefault();
        void createFolder();
      }}
    >
      {!isMobile && <span>▰</span>}
      <input
        ref={folderInputRef}
        value={newFolder}
        onChange={(event) => setNewFolder(event.target.value)}
        onBlur={() => {
          requestAnimationFrame(() => {
            if (!folderInputRef.current) return;
            void createFolder();
          });
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            cancelFolderCreate();
          }
        }}
        placeholder="Folder name"
        aria-label="New folder name"
      />
    </form>
  ) : null;
  const createDoc = async () => {
    const doc: Doc = {
      id: crypto.randomUUID(),
      folderId: selected === "all" ? null : selected,
      title: "Untitled",
      content: "# Untitled\n\nStart writing here…",
      updatedAt: Date.now(),
    };
    await storage.save(doc);
    router.push(`/reader?id=${doc.id}&edit=1`);
  };
  const saveImportedDoc = async (title: string, content: string) => {
    const doc: Doc = {
      id: crypto.randomUUID(),
      folderId: selected === "all" ? null : selected,
      title: title.trim() || "Untitled",
      content,
      updatedAt: Date.now(),
    };
    await storage.save(doc);
    router.push(`/reader?id=${doc.id}`);
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
  const exportLibrary = () => {
    const safe = (name: string) =>
      name
        .replace(/[\\/:*?"<>|]/g, "-")
        .replace(/\s+/g, " ")
        .trim() || "Untitled";
    const files: Record<string, Uint8Array> = {};
    folders.forEach((folder) => {
      files[`${safe(folder.name)}/.keep`] = strToU8("");
    });
    docs.forEach((doc) => {
      const folder = folders.find((item) => item.id === doc.folderId);
      const path = `${folder ? safe(folder.name) : "Root"}/${safe(doc.title)}-${doc.id.slice(0, 6)}.md`;
      files[path] = strToU8(doc.content);
    });
    files["margin-library.json"] = strToU8(
      JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          folders,
          documents: docs.map(({ content: _content, ...doc }) => doc),
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
  };

  return (
    <main
      className={`library-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}
    >
      <aside className="library-sidebar" aria-label="Library sidebar">
        <div className="sidebar-top">
          <Link className="brand" href="/">
            <span className="brand-mark">M</span>
            <span className="brand-copy">
              <strong>Margin</strong>
              <small>Reading workspace</small>
            </span>
          </Link>
          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed((value) => !value)}
            aria-label={
              sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
            }
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!sidebarCollapsed}
          >
            {sidebarCollapsed ? "›" : "‹"}
          </button>
        </div>
        <button
          className={`nav-item ${selected === "all" ? "active" : ""}`}
          onClick={() => setSelected("all")}
          title="All pages"
        >
          <span>⌂</span> <span className="nav-item-label">All pages</span>
        </button>
        <div className="nav-label">
          <span className="nav-label-text">Folders</span>
          <button
            type="button"
            className="folder-add"
            onClick={startFolderCreate}
            aria-label="Create folder"
            title="Create folder"
          >
            ＋
          </button>
        </div>
        <nav aria-label="Folders">
          {folders.map((folder) => (
            <button
              key={folder.id}
              className={`nav-item ${selected === folder.id ? "active" : ""}`}
              onClick={() => setSelected(folder.id)}
              title={folder.name}
            >
              <span>▰</span>
              <span className="nav-item-label">{folder.name}</span>
              <small>
                {docs.filter((doc) => doc.folderId === folder.id).length}
              </small>
            </button>
          ))}
          {!isMobile && folderCompose}
        </nav>
        <div className="local-note">
          <span>●</span>
          <div>
            <strong>Private on this device</strong>
            <small>Files are stored in your browser.</small>
          </div>
        </div>
      </aside>
      <section className="library-main">
        <header className="library-topbar">
          <div className="mobile-brand">Margin</div>
          <div className="search" role="search">
            <span>⌕</span>
            <input
              aria-label="Search library"
              type="search"
              placeholder="Search titles, text, or folders"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch("")} aria-label="Clear search">
                ×
              </button>
            )}
          </div>
          <div className="top-actions">
            <button
              className="secondary-button export-zip-button"
              onClick={exportLibrary}
              disabled={!docs.length}
            >
              ↓ Export ZIP
            </button>
            <label className="secondary-button library-import-button">
              Import
              <input
                type="file"
                accept=".md,.markdown,.txt"
                onChange={importFile}
              />
            </label>
            <button className="primary-button" onClick={createDoc}>
              ＋ New page
            </button>
          </div>
        </header>
        <div className="library-content">
          <div className="welcome">
            <span className="eyebrow">Your reading space</span>
            <h1>
              Write, organize,
              <br />
              and listen.
            </h1>
            <p>
              Create a page, drop it in a folder, then tap play to hear it read
              aloud.
            </p>
          </div>
          <div className="folder-rail" aria-label="Folders">
            <div className="folder-rail-head">
              <strong>Folders</strong>
              <button
                type="button"
                className="folder-rail-add"
                onClick={startFolderCreate}
              >
                ＋ New folder
              </button>
            </div>
            <div className="folder-chips">
              <button
                type="button"
                className={`folder-chip ${selected === "all" ? "active" : ""}`}
                onClick={() => setSelected("all")}
              >
                All pages
              </button>
              {folders.map((folder) => (
                <button
                  type="button"
                  key={folder.id}
                  className={`folder-chip ${selected === folder.id ? "active" : ""}`}
                  onClick={() => setSelected(folder.id)}
                >
                  {folder.name}
                  <small>
                    {docs.filter((doc) => doc.folderId === folder.id).length}
                  </small>
                </button>
              ))}
              {isMobile && folderCompose}
            </div>
          </div>
          <div className="section-head">
            <div>
              <h2>
                {search
                  ? `Search results for “${search}”`
                  : selected === "all"
                    ? "Recent pages"
                    : folders.find((folder) => folder.id === selected)?.name}
              </h2>
              <p>
                {visible.length} {visible.length === 1 ? "page" : "pages"}
                {search ? " across titles, text, and folders" : ""}
                {!search && selected === "all"
                  ? " · New pages land here until you file them"
                  : ""}
              </p>
            </div>
            <div className="import-actions">
              <form
                className="link-import"
                onSubmit={(event) => {
                  event.preventDefault();
                  void importFromLink(importLink);
                }}
              >
                <input
                  type="url"
                  inputMode="url"
                  placeholder="Paste a link to add a page…"
                  aria-label="Paste a link to add a page"
                  value={importLink}
                  disabled={importingLink}
                  onChange={(event) => {
                    setImportLink(event.target.value);
                    if (importLinkError) setImportLinkError("");
                  }}
                  onPaste={handleImportLinkPaste}
                />
                <button
                  type="submit"
                  disabled={importingLink || !importLink.trim()}
                >
                  {importingLink ? "Adding…" : "Add link"}
                </button>
              </form>
              {importLinkError && (
                <p className="import-link-error" role="alert">
                  {importLinkError}
                </p>
              )}
              <div className="root-import">
                <label>
                  ⇧ Import a markdown file
                  <input
                    type="file"
                    accept=".md,.markdown,.txt"
                    onChange={importFile}
                  />
                </label>
              </div>
            </div>
          </div>
          <div className="doc-grid">
            {visible.map((doc) => (
              <Link
                href={`/reader?id=${doc.id}`}
                className="doc-card"
                key={doc.id}
              >
                <span className="page-icon">≡</span>
                <div className="doc-copy">
                  <h3>{doc.title}</h3>
                  <p>{doc.content.replace(/[#*`>-]/g, "").slice(0, 110)}</p>
                </div>
                <footer>
                  <span>
                    {folders.find((folder) => folder.id === doc.folderId)
                      ?.name ?? "Unfiled"}
                  </span>
                  <time>
                    {new Date(doc.updatedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </time>
                </footer>
              </Link>
            ))}
            <button className="doc-card new-card" onClick={createDoc}>
              <span>＋</span>
              <strong>New page</strong>
              <small>Opens the editor so you can write, then listen</small>
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
