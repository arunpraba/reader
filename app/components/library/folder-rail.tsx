import { FolderPlus, LayoutGrid, Trash2 } from "lucide-react";
import type { Doc, Folder } from "../../../lib/storage";

export function FolderRail({
  selected,
  folders,
  docs,
  onSelect,
  onStartFolderCreate,
  onDeleteFolder,
}: {
  selected: string | null | "all";
  folders: Folder[];
  docs: Doc[];
  onSelect: (id: string | null | "all") => void;
  onStartFolderCreate: () => void;
  onDeleteFolder: (id: string, name: string) => void;
}) {
  return (
    <div className="folder-rail" aria-label="Folders">
      <div className="folder-chips">
        <button
          type="button"
          className={`folder-chip ${selected === "all" ? "active" : ""}`}
          onClick={() => onSelect("all")}
        >
          <LayoutGrid size={14} aria-hidden="true" />
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
              <Trash2 size={14} aria-hidden="true" />
            </button>
          </div>
        ))}
        <button
          type="button"
          className="folder-rail-add"
          onClick={onStartFolderCreate}
          aria-label="New folder"
          title="New folder"
        >
          <FolderPlus size={15} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
