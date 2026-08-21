"use client";

import { useEffect, useMemo, useState } from "react";
import { strToU8, zipSync } from "fflate";
import { Doc, Folder, storage } from "../lib/storage";

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
  const [folders, setFolders] = useState<Folder[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [selected, setSelected] = useState<string | null | "all">("all");
  const [newFolder, setNewFolder] = useState("");
  const [search, setSearch] = useState("");

  const refresh = async () => {
    const library = await loadLibrary();
    setFolders(library.folders);
    setDocs(library.docs);
  };

  useEffect(() => {
    let cancelled = false;
    void loadLibrary().then((library) => {
      if (cancelled) return;
      setFolders(library.folders);
      setDocs(library.docs);
    });
    return () => {
      cancelled = true;
    };
  }, []);

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

  const createFolder = async () => {
    if (!newFolder.trim()) return;
    await storage.folder(newFolder.trim());
    setNewFolder("");
    await refresh();
  };
  const createDoc = async () => {
    const doc: Doc = {
      id: crypto.randomUUID(),
      folderId: selected === "all" ? null : selected,
      title: "Untitled",
      content: "# Untitled\n\nStart writing here…",
      updatedAt: Date.now(),
    };
    await storage.save(doc);
    window.location.href = `/reader?id=${doc.id}&edit=1`;
  };
  const importFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const doc: Doc = {
        id: crypto.randomUUID(),
        folderId: selected === "all" ? null : selected,
        title: file.name.replace(/\.(md|markdown|txt)$/i, ""),
        content: String(reader.result ?? ""),
        updatedAt: Date.now(),
      };
      await storage.save(doc);
      window.location.href = `/reader?id=${doc.id}`;
    };
    reader.readAsText(file);
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
    <main className="library-shell">
      <aside className="library-sidebar">
        <a className="brand" href="/">
          <span className="brand-mark">M</span>
          <span>
            <strong>Margin</strong>
            <small>Reading workspace</small>
          </span>
        </a>
        <button className="nav-item active" onClick={() => setSelected("all")}>
          <span>⌂</span> Home
        </button>
        <div className="nav-label">Folders</div>
        <nav aria-label="Folders">
          {folders.map((folder) => (
            <button
              key={folder.id}
              className={`nav-item ${selected === folder.id ? "active" : ""}`}
              onClick={() => setSelected(folder.id)}
            >
              <span>▰</span>
              {folder.name}
              <small>
                {docs.filter((doc) => doc.folderId === folder.id).length}
              </small>
            </button>
          ))}
        </nav>
        <form
          className="folder-form"
          onSubmit={(event) => {
            event.preventDefault();
            createFolder();
          }}
        >
          <input
            value={newFolder}
            onChange={(e) => setNewFolder(e.target.value)}
            placeholder="New folder"
            aria-label="New folder name"
          />
          <button aria-label="Create folder">＋</button>
        </form>
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
              Where ideas wait
              <br />
              to be heard.
            </h1>
            <p>Organize, write, and listen to every page at your own pace.</p>
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
              </p>
            </div>
            <div className="root-import">
              <label>
                ⇧ Import at this level
                <input
                  type="file"
                  accept=".md,.markdown,.txt"
                  onChange={importFile}
                />
              </label>
            </div>
          </div>
          <div className="doc-grid">
            {visible.map((doc) => (
              <a
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
                      ?.name ?? "Root"}
                  </span>
                  <time>
                    {new Date(doc.updatedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </time>
                </footer>
              </a>
            ))}
            <button className="doc-card new-card" onClick={createDoc}>
              <span>＋</span>
              <strong>New page</strong>
              <small>Start with a blank thought</small>
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
