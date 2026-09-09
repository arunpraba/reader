import Link from "next/link";

export function ReaderLoading() {
  return (
    <main className="reader-loading">
      <Link href="/">All files</Link>
      <p>Opening your page…</p>
    </main>
  );
}
