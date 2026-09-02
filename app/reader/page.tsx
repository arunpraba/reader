import { Suspense } from "react";
import { ReaderPage } from "./reader-page";

export default function Page() {
  return (
    <Suspense
      fallback={<main className="reader-loading">Opening your page…</main>}
    >
      <ReaderPage />
    </Suspense>
  );
}
