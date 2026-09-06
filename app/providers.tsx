"use client";

import type { ReactNode } from "react";
import { PlaybackProvider } from "./playback-provider";
import { RegisterServiceWorker } from "./register-sw";
import { ThemeProvider } from "./theme-provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <PlaybackProvider>
        <RegisterServiceWorker />
        {children}
      </PlaybackProvider>
    </ThemeProvider>
  );
}
