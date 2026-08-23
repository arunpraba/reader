"use client";

import type { ReactNode } from "react";
import { PlaybackProvider } from "./playback-provider";

export function Providers({ children }: { children: ReactNode }) {
  return <PlaybackProvider>{children}</PlaybackProvider>;
}
