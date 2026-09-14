import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { folderAncestors } from "@/lib/folder-tree";
import { Doc, storage } from "@/lib/storage";

export function useReaderDocument() {
  const [doc, setDoc] = useState<Doc | null>(null);
  const [folderTrail, setFolderTrail] = useState<
    { id: string; name: string }[]
  >([]);
  const [editing, setEditing] = useState(false);
  const [saveState, setSaveState] = useState<"saved" | "saving">("saved");
  const searchParams = useSearchParams();
  const positionRef = useRef<Doc["readingPosition"]>(undefined);
  const docId = searchParams.get("id");
  const initialEditing = searchParams.get("edit") === "1";

  useEffect(() => {
    setEditing(initialEditing);
    if (!docId) return;
    void Promise.all([storage.doc(docId), storage.folders()]).then(
      ([value, folders]) => {
        positionRef.current = value?.readingPosition;
        setDoc(value ?? null);
        setFolderTrail(
          value?.folderId ? folderAncestors(folders, value.folderId) : [],
        );
      },
    );
  }, [docId, initialEditing]);

  useEffect(() => {
    if (!doc) return;
    setSaveState("saving");
    const timer = window.setTimeout(async () => {
      await storage.save({
        ...doc,
        readingPosition: positionRef.current,
        updatedAt: Date.now(),
      });
      setSaveState("saved");
    }, 650);
    return () => window.clearTimeout(timer);
  }, [doc?.title, doc?.content]);

  return {
    doc,
    setDoc,
    folderTrail,
    editing,
    setEditing,
    saveState,
    positionRef,
  };
}
