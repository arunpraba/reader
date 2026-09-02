import type { Doc, Folder } from "../../../lib/storage";
import { DocCard } from "./doc-card";

export function DocGrid({
  visible,
  folders,
  onDeleteDoc,
  onCreateDoc,
}: {
  visible: Doc[];
  folders: Folder[];
  onDeleteDoc: (id: string, title: string) => void;
  onCreateDoc: () => void;
}) {
  return (
    <div className="doc-grid">
      {visible.map((doc) => (
        <DocCard
          key={doc.id}
          doc={doc}
          folderName={
            folders.find((folder) => folder.id === doc.folderId)?.name ??
            "Unfiled"
          }
          onDelete={() => onDeleteDoc(doc.id, doc.title)}
        />
      ))}
      <button className="doc-card new-card" onClick={onCreateDoc}>
        <span>＋</span>
        <strong>New page</strong>
        <small>Opens the editor so you can write, then listen</small>
      </button>
    </div>
  );
}
