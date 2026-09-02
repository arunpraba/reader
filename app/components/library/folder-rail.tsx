import type { RefObject } from "react";
import type { Doc, Folder } from "../../../lib/storage";
import { FolderCompose } from "./folder-compose";

export function FolderRail({
  selected,
  folders,
  docs,
  isMobile,
  creatingFolder,
  newFolder,
  folderInputRef,
  onSelect,
  onStartFolderCreate,
  onNewFolderChange,
  onCreateFolder,
  onFolderBlur,
  onCancelFolderCreate,
  onDeleteFolder,
}: {
  selected: string | null | "all";
  folders: Folder[];
  docs: Doc[];
  isMobile: boolean;
  creatingFolder: boolean;
  newFolder: string;
  folderInputRef: RefObject<HTMLInputElement | null>;
  onSelect: (id: string | null | "all") => void;
  onStartFolderCreate: () => void;
  onNewFolderChange: (value: string) => void;
  onCreateFolder: () => void;
  onFolderBlur: () => void;
  onCancelFolderCreate: () => void;
  onDeleteFolder: (id: string, name: string) => void;
}) {
  return (
    <div className="folder-rail" aria-label="Folders">
      <div className="folder-rail-head">
        <strong>Folders</strong>
        <button
          type="button"
          className="folder-rail-add"
          onClick={onStartFolderCreate}
        >
          ＋ New folder
        </button>
      </div>
      <div className="folder-chips">
        <button
          type="button"
          className={`folder-chip ${selected === "all" ? "active" : ""}`}
          onClick={() => onSelect("all")}
        >
          All pages
        </button>
        {folders.map((folder) => (
          <div className="folder-chip-wrap" key={folder.id}>
            <button
              type="button"
              className={`folder-chip ${selected === folder.id ? "active" : ""}`}
              onClick={() => onSelect(folder.id)}
            >
              {folder.name}
              <small>
                {docs.filter((doc) => doc.folderId === folder.id).length}
              </small>
            </button>
            <button
              type="button"
              className="item-delete folder-chip-delete"
              onClick={() => onDeleteFolder(folder.id, folder.name)}
              aria-label={`Delete folder ${folder.name}`}
              title={`Delete folder ${folder.name}`}
            >
              ×
            </button>
          </div>
        ))}
        {isMobile && creatingFolder && (
          <FolderCompose
            isMobile={isMobile}
            newFolder={newFolder}
            folderInputRef={folderInputRef}
            onNewFolderChange={onNewFolderChange}
            onSubmit={onCreateFolder}
            onBlur={onFolderBlur}
            onCancel={onCancelFolderCreate}
          />
        )}
      </div>
    </div>
  );
}
