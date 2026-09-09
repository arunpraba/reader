import { createId } from "./id";
import { article } from "./article";

export type Folder = { id: string; name: string; createdAt: number };
export type ReadingPosition = {
  blockIndex: number;
  sentenceIndex: number;
  wordIndex: number;
  progress: number;
  savedAt: number;
};
export type Doc = {
  id: string;
  folderId: string | null;
  title: string;
  content: string;
  updatedAt: number;
  readingPosition?: ReadingPosition;
};

const DB_NAME = "margin-reader";
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("folders"))
        db.createObjectStore("folders", { keyPath: "id" });
      if (!db.objectStoreNames.contains("docs")) {
        const store = db.createObjectStore("docs", { keyPath: "id" });
        store.createIndex("folderId", "folderId", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function all<T>(storeName: "folders" | "docs") {
  const db = await openDb();
  return new Promise<T[]>((resolve, reject) => {
    const request = db
      .transaction(storeName, "readonly")
      .objectStore(storeName)
      .getAll();
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
}

async function put<T>(storeName: "folders" | "docs", value: T) {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const request = db
      .transaction(storeName, "readwrite")
      .objectStore(storeName)
      .put(value);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function remove(storeName: "folders" | "docs", id: string) {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const request = db
      .transaction(storeName, "readwrite")
      .objectStore(storeName)
      .delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export const storage = {
  folders: () => all<Folder>("folders"),
  docs: () => all<Doc>("docs"),
  async folder(name: string) {
    const folder: Folder = {
      id: createId(),
      name,
      createdAt: Date.now(),
    };
    await put("folders", folder);
    return folder;
  },
  save: (doc: Doc) => put("docs", doc),
  deleteDoc: (id: string) => remove("docs", id),
  async deleteFolder(id: string) {
    const docs = await all<Doc>("docs");
    await Promise.all(
      docs
        .filter((doc) => doc.folderId === id)
        .map((doc) => put("docs", { ...doc, folderId: null })),
    );
    await remove("folders", id);
  },
  async doc(id: string) {
    return (await all<Doc>("docs")).find((doc) => doc.id === id);
  },
  async seed() {
    if ((await all<Doc>("docs")).length) return;
    await put("folders", {
      id: "welcome",
      name: "Reading notes",
      createdAt: Date.now(),
    } satisfies Folder);
    await put("docs", {
      id: "welcome-doc",
      folderId: "welcome",
      title: "The quiet power of attention",
      content: article,
      updatedAt: Date.now(),
    } satisfies Doc);
  },
};
