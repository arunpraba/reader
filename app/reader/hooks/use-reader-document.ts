import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Doc, storage } from "../../../lib/storage";

export function useReaderDocument() {
  const [doc, setDoc] = useState<Doc | null>(null);
  const [editing, setEditing] = useState(false);
  const [saveState, setSaveState] = useState<"saved" | "saving">("saved");
  const searchParams = useSearchParams();
  const positionRef = useRef<Doc["readingPosition"]>(undefined);
  const docId = searchParams.get("id");
  const initialEditing = searchParams.get("edit") === "1";

  useEffect(() => {
    setEditing(initialEditing);
    if (docId)
      storage.doc(docId).then((value) => {
        positionRef.current = value?.readingPosition;
        setDoc(value ?? null);
      });
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

  const save = async () => {
    if (!doc) return;
    setSaveState("saving");
    const next = { ...doc, updatedAt: Date.now() };
    await storage.save(next);
    setDoc(next);
    setSaveState("saved");
    setEditing(false);
  };

  return {
    doc,
    setDoc,
    editing,
    setEditing,
    saveState,
    save,
    positionRef,
  };
}
