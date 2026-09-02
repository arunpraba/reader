import type { RefObject } from "react";

export function FolderCompose({
  isMobile,
  newFolder,
  folderInputRef,
  onNewFolderChange,
  onSubmit,
  onBlur,
  onCancel,
}: {
  isMobile: boolean;
  newFolder: string;
  folderInputRef: RefObject<HTMLInputElement | null>;
  onNewFolderChange: (value: string) => void;
  onSubmit: () => void;
  onBlur: () => void;
  onCancel: () => void;
}) {
  return (
    <form
      className={isMobile ? "folder-chip-compose" : "folder-compose"}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      {!isMobile && <span>▰</span>}
      <input
        ref={folderInputRef}
        value={newFolder}
        onChange={(event) => onNewFolderChange(event.target.value)}
        onBlur={onBlur}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            onCancel();
          }
        }}
        placeholder="Folder name"
        aria-label="New folder name"
      />
    </form>
  );
}
