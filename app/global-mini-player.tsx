"use client";

import { usePathname, useRouter } from "next/navigation";
import { MiniPlayer } from "./reader/mini-player";

export function GlobalMiniPlayer({
  docId,
  playing,
  progress,
  onTogglePlay,
}: {
  docId: string | null;
  playing: boolean;
  progress: number;
  onTogglePlay: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const onReader = pathname.startsWith("/reader");
  if (!docId || onReader) return null;
  if (!playing && progress <= 0) return null;

  return (
    <MiniPlayer
      progress={progress}
      playing={playing}
      onExpand={() => {
        router.push(`/reader?id=${docId}`);
      }}
      onTogglePlay={onTogglePlay}
    />
  );
}
