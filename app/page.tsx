"use client";

import { DocGrid } from "./components/library/doc-grid";
import { FolderRail } from "./components/library/folder-rail";
import { ImportLinkForm } from "./components/library/import-link-form";
import { LibrarySidebar } from "./components/library/library-sidebar";
import { LibraryTopbar } from "./components/library/library-topbar";
import { WelcomeHero } from "./components/library/welcome-hero";
import { useLibrary } from "./hooks/use-library";
import { useLibrarySearch } from "./hooks/use-library-search";
import { useMobileBreakpoint } from "./hooks/use-mobile-breakpoint";
import { useSidebarState } from "./hooks/use-sidebar-state";

export default function Home() {
  const isMobile = useMobileBreakpoint();
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

  const { search, setSearch, visible } = useLibrarySearch(
    library.docs,
    library.folders,
    selected,
  );

  const handleFolderBlur = () => {
    requestAnimationFrame(() => {
      if (!library.folderInputRef.current) return;
      void library.createFolder();
    });
  };

  return (
    <main
      className={`library-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}
    >
      <LibrarySidebar
        selected={selected}
        folders={library.folders}
        docs={library.docs}
        sidebarCollapsed={sidebarCollapsed}
        isMobile={isMobile}
        creatingFolder={library.creatingFolder}
        newFolder={library.newFolder}
        folderInputRef={library.folderInputRef}
        onSelect={setSelected}
        onToggleSidebar={() => setSidebarCollapsed((value) => !value)}
        onStartFolderCreate={library.startFolderCreate}
        onNewFolderChange={library.setNewFolder}
        onCreateFolder={() => void library.createFolder()}
        onFolderBlur={handleFolderBlur}
        onCancelFolderCreate={library.cancelFolderCreate}
        onDeleteFolder={(id, name) => void library.deleteFolder(id, name)}
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
        />
        <div className="library-content">
          <WelcomeHero />
          <FolderRail
            selected={selected}
            folders={library.folders}
            docs={library.docs}
            isMobile={isMobile}
            creatingFolder={library.creatingFolder}
            newFolder={library.newFolder}
            folderInputRef={library.folderInputRef}
            onSelect={setSelected}
            onStartFolderCreate={library.startFolderCreate}
            onNewFolderChange={library.setNewFolder}
            onCreateFolder={() => void library.createFolder()}
            onFolderBlur={handleFolderBlur}
            onCancelFolderCreate={library.cancelFolderCreate}
            onDeleteFolder={(id, name) => void library.deleteFolder(id, name)}
          />
          <div className="section-head">
            <div>
              <h2>
                {search
                  ? `Search results for “${search}”`
                  : selected === "all"
                    ? "Recent pages"
                    : library.folders.find((folder) => folder.id === selected)
                        ?.name}
              </h2>
              <p>
                {visible.length} {visible.length === 1 ? "page" : "pages"}
                {search ? " across titles, text, and folders" : ""}
                {!search && selected === "all"
                  ? " · New pages land here until you file them"
                  : ""}
              </p>
            </div>
            <ImportLinkForm
              importLink={library.importLink}
              importingLink={library.importingLink}
              importLinkError={library.importLinkError}
              onImportLinkChange={(value) => {
                library.setImportLink(value);
                if (library.importLinkError) library.setImportLinkError("");
              }}
              onImportLinkPaste={library.handleImportLinkPaste}
              onSubmit={() => void library.importFromLink(library.importLink)}
              onImportFile={library.importFile}
            />
          </div>
          <DocGrid
            visible={visible}
            folders={library.folders}
            onDeleteDoc={(id, title) => void library.deleteDoc(id, title)}
            onCreateDoc={() => void library.createDoc()}
          />
        </div>
      </section>
    </main>
  );
}
