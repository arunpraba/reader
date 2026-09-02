"use client";

import type { ReactNode } from "react";
import { CapacitorInit } from "./capacitor-init";
import { PlaybackProvider } from "./playback-provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <PlaybackProvider>
      <CapacitorInit />
      {children}
    </PlaybackProvider>
  );
}
