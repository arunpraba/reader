export function ImportLinkForm({
  importLink,
  importingLink,
  importLinkError,
  onImportLinkChange,
  onImportLinkPaste,
  onSubmit,
  onImportFile,
}: {
  importLink: string;
  importingLink: boolean;
  importLinkError: string;
  onImportLinkChange: (value: string) => void;
  onImportLinkPaste: (event: React.ClipboardEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  onImportFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="import-actions">
      <form
        className="link-import"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <input
          type="url"
          inputMode="url"
          placeholder="Paste a link to add a page…"
          aria-label="Paste a link to add a page"
          value={importLink}
          disabled={importingLink}
          onChange={(event) => onImportLinkChange(event.target.value)}
          onPaste={onImportLinkPaste}
        />
        <button type="submit" disabled={importingLink || !importLink.trim()}>
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
            onChange={onImportFile}
          />
        </label>
      </div>
    </div>
  );
}
