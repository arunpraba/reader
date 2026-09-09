"use client";

import { useEffect, useState } from "react";
import { ConfirmModal } from "./components/library/confirm-modal";
import { FileBrowser, type FileView } from "./components/library/file-browser";
import { FolderCreateModal } from "./components/library/folder-create-modal";
import { ImportLinkModal } from "./components/library/import-link-modal";
import { LibrarySidebar } from "./components/library/library-sidebar";
import { LibraryTopbar } from "./components/library/library-topbar";
import { useLibrary } from "./hooks/use-library";
import { useLibrarySearch } from "./hooks/use-library-search";
import { useMobileBreakpoint } from "./hooks/use-mobile-breakpoint";
import { useSidebarState } from "./hooks/use-sidebar-state";

export function LibraryPage() {
  const isMobile = useMobileBreakpoint();
  const [view, setView] = useState<FileView>("list");
  const [importingLinkOpen, setImportingLinkOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<
    | { type: "doc"; id: string; name: string }
    | { type: "folder"; id: string; name: string }
    | null
  >(null);
  const {
    selected,
    setSelected,
    sidebarCollapsed,
    setSidebarCollapsed,
    initFolderSelection,
  } = useSidebarState();

  const library = useLibrary({
    selected,
    setSelected,
    initFolderSelection,
    isMobile,
  });

  const { search, setSearch, visible, visibleFolders } = useLibrarySearch(
    library.docs,
    library.folders,
    selected,
  );

  useEffect(() => {
    const menus =
      "details.file-item-more[open], details.top-more[open], details.create-menu[open]";
    const dismiss = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      document.querySelectorAll(menus).forEach((details) => {
        if (!details.contains(target)) details.removeAttribute("open");
      });
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      document.querySelectorAll(menus).forEach((details) => {
        details.removeAttribute("open");
      });
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const selectedFolder = library.folders.find(
    (folder) => folder.id === selected,
  );
  const requestDeleteFolder = (id: string, name: string) => {
    setPendingDelete({ type: "folder", id, name });
  };
  const pendingFolderCount =
    pendingDelete?.type === "folder"
      ? library.docs.filter((doc) => doc.folderId === pendingDelete.id).length
      : 0;

  return (
    <main
      className={`library-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}
    >
      <LibrarySidebar
        selected={selected}
        folders={library.folders}
        docs={library.docs}
        sidebarCollapsed={sidebarCollapsed}
        onSelect={setSelected}
        onToggleSidebar={() => setSidebarCollapsed((value) => !value)}
        onStartFolderCreate={library.startFolderCreate}
        onDeleteFolder={requestDeleteFolder}
      />
      <section className="library-main">
        <LibraryTopbar
          search={search}
          hasDocs={library.docs.length > 0}
          onSearchChange={setSearch}
          onClearSearch={() => setSearch("")}
          onExport={library.handleExportLibrary}
          onImportFile={library.importFile}
          onCreateDoc={() => void library.createDoc()}
          onCreateFolder={library.startFolderCreate}
          onImportLink={() => {
            library.setImportLink("");
            library.setImportLinkError("");
            setImportingLinkOpen(true);
          }}
        />
        <div className="library-content">
          <FileBrowser
            view={view}
            onViewChange={setView}
            search={search}
            selected={selected}
            folderName={selectedFolder?.name}
            folders={visibleFolders}
            docs={visible}
            onSelect={setSelected}
            onDeleteFolder={requestDeleteFolder}
            onDeleteDoc={(id, title) =>
              setPendingDelete({ type: "doc", id, name: title })
            }
            onCreateDoc={() => void library.createDoc()}
          />
        </div>
      </section>
      <ConfirmModal
        open={pendingDelete !== null}
        title={
          pendingDelete?.type === "folder" ? "Delete folder" : "Delete page"
        }
        message={
          pendingDelete?.type === "folder"
            ? pendingFolderCount
              ? `Delete “${pendingDelete.name}”? ${pendingFolderCount} page${pendingFolderCount === 1 ? "" : "s"} will become unfiled.`
              : `Delete “${pendingDelete.name}”?`
            : `Delete “${pendingDelete?.name ?? ""}”? This cannot be undone.`
        }
        confirmLabel="Delete"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return;
          if (pendingDelete.type === "folder") {
            void library.deleteFolder(pendingDelete.id);
          } else {
            void library.deleteDoc(pendingDelete.id);
          }
          setPendingDelete(null);
        }}
      />
      <FolderCreateModal
        open={library.creatingFolder}
        newFolder={library.newFolder}
        folderInputRef={library.folderInputRef}
        onNewFolderChange={library.setNewFolder}
        onSubmit={() => void library.createFolder()}
        onCancel={library.cancelFolderCreate}
      />
      <ImportLinkModal
        open={importingLinkOpen}
        importLink={library.importLink}
        importingLink={library.importingLink}
        importLinkError={library.importLinkError}
        onImportLinkChange={(value) => {
          library.setImportLink(value);
          if (library.importLinkError) library.setImportLinkError("");
        }}
        onImportLinkPaste={library.handleImportLinkPaste}
        onSubmit={() => void library.importFromLink(library.importLink)}
        onCancel={() => {
          setImportingLinkOpen(false);
          library.setImportLink("");
          library.setImportLinkError("");
        }}
      />
    </main>
  );
}
