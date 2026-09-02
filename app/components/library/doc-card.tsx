import Link from "next/link";
import type { Doc } from "../../../lib/storage";

export function DocCard({
  doc,
  folderName,
  onDelete,
}: {
  doc: Doc;
  folderName: string;
  onDelete: () => void;
}) {
  return (
    <div className="doc-card-shell">
      <button
        type="button"
        className="item-delete doc-card-delete"
        onClick={onDelete}
        aria-label={`Delete ${doc.title}`}
        title={`Delete ${doc.title}`}
      >
        ×
      </button>
      <Link href={`/reader?id=${doc.id}`} className="doc-card">
        <span className="page-icon">≡</span>
        <div className="doc-copy">
          <h3>{doc.title}</h3>
          <p>{doc.content.replace(/[#*`>-]/g, "").slice(0, 110)}</p>
        </div>
        <footer>
          <span>{folderName}</span>
          <time>
            {new Date(doc.updatedAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </time>
        </footer>
      </Link>
    </div>
  );
}
