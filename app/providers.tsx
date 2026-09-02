"use client";

import type { ReactNode } from "react";
import { PlaybackProvider } from "./playback-provider";
import { ThemeProvider } from "./theme-provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <PlaybackProvider>{children}</PlaybackProvider>
    </ThemeProvider>
  );
}
