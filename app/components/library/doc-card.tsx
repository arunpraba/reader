import Link from "next/link";
import { BookOpen, Trash2 } from "lucide-react";
import type { Doc } from "@/lib/storage";

const COVER_TONES = 6;

function coverTone(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return hash % COVER_TONES;
}

function snippet(content: string) {
  return content
    .replace(/[#*`>_[\]()-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

export function DocCard({
  doc,
  folderName,
  onDelete,
}: {
  doc: Doc;
  folderName: string;
  onDelete: () => void;
}) {
  const progress = Math.min(1, Math.max(0, doc.readingPosition?.progress ?? 0));
  const initial = (doc.title.trim().charAt(0) || "M").toUpperCase();
  const preview = snippet(doc.content);

  return (
    <div className="doc-card-shell">
      <button
        type="button"
        className="item-delete doc-card-delete"
        onClick={onDelete}
        aria-label={`Delete ${doc.title}`}
        title={`Delete ${doc.title}`}
      >
        <Trash2 size={14} aria-hidden="true" />
      </button>
      <Link
        href={`/reader/?id=${doc.id}`}
        className={`doc-card cover-tone-${coverTone(doc.id)}`}
      >
        <div className="doc-cover" aria-hidden="true">
          <span className="doc-cover-spine" />
          <span className="doc-cover-monogram">{initial}</span>
          <span className="doc-cover-title">{doc.title}</span>
          <BookOpen className="doc-cover-icon" size={18} />
        </div>
        <div className="doc-copy">
          <h3>{doc.title}</h3>
          {preview ? (
            <p>{preview}</p>
          ) : (
            <p className="doc-copy-empty">Empty page</p>
          )}
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
        {progress > 0 ? (
          <div
            className="doc-progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
            aria-label="Reading progress"
          >
            <span style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
        ) : null}
      </Link>
    </div>
  );
}
