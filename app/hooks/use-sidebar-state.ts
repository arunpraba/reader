import { useCallback, useEffect, useState } from "react";
import {
  loadSelectedFolder,
  loadSidebarCollapsed,
  saveSelectedFolder,
  saveSidebarCollapsed,
} from "../../lib/reader-settings";

export function useSidebarState() {
  const [selected, setSelected] = useState<string | null | "all">("all");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarReady, setSidebarReady] = useState(false);
  const [folderSelectionReady, setFolderSelectionReady] = useState(false);

  useEffect(() => {
    setSidebarCollapsed(loadSidebarCollapsed());
    setSidebarReady(true);
  }, []);

  useEffect(() => {
    if (!sidebarReady) return;
    saveSidebarCollapsed(sidebarCollapsed);
  }, [sidebarCollapsed, sidebarReady]);

  useEffect(() => {
    if (!folderSelectionReady) return;
    saveSelectedFolder(selected);
  }, [selected, folderSelectionReady]);

  const initFolderSelection = useCallback((folders: { id: string }[]) => {
    const saved = loadSelectedFolder();
    if (
      saved === "all" ||
      saved === null ||
      folders.some((folder) => folder.id === saved)
    ) {
      setSelected(saved);
    }
    setFolderSelectionReady(true);
  }, []);

  return {
    selected,
    setSelected,
    sidebarCollapsed,
    setSidebarCollapsed,
    initFolderSelection,
  };
}
