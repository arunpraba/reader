import { Link2, Upload } from "lucide-react";

export function ImportLinkForm({
  hasDocs,
  importLink,
  importingLink,
  importLinkError,
  onImportLinkChange,
  onImportLinkPaste,
  onSubmit,
  onImportFile,
}: {
  hasDocs: boolean;
  importLink: string;
  importingLink: boolean;
  importLinkError: string;
  onImportLinkChange: (value: string) => void;
  onImportLinkPaste: (event: React.ClipboardEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  onImportFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div
      className={`import-actions${hasDocs ? " import-actions-has-docs" : ""}`}
    >
      <form
        className="link-import"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <Link2 size={15} aria-hidden="true" />
        <input
          type="url"
          inputMode="url"
          placeholder="Paste link"
          aria-label="Paste link"
          value={importLink}
          disabled={importingLink}
          onChange={(event) => onImportLinkChange(event.target.value)}
          onPaste={onImportLinkPaste}
        />
        <button type="submit" disabled={importingLink || !importLink.trim()}>
          {importingLink ? "Adding…" : "Add"}
        </button>
      </form>
      {importLinkError && (
        <p className="import-link-error" role="alert">
          {importLinkError}
        </p>
      )}
      <label className="root-import secondary-button">
        <Upload size={15} aria-hidden="true" />
        <span>Import file</span>
        <input
          type="file"
          accept=".md,.markdown,.txt"
          onChange={onImportFile}
        />
      </label>
    </div>
  );
}
