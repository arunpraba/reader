"use client";

import { useCallback, useEffect, useState } from "react";

type FullscreenCapable = HTMLElement & {
  webkitRequestFullscreen?: (
    options?: FullscreenOptions,
  ) => Promise<void> | void;
  webkitRequestFullScreen?: (
    options?: FullscreenOptions,
  ) => Promise<void> | void;
};

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
  webkitCancelFullScreen?: () => Promise<void> | void;
};

function getFullscreenElement() {
  const doc = document as FullscreenDocument;
  return document.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

function isOsFullscreen() {
  return (
    Boolean(getFullscreenElement()) ||
    window.matchMedia("(display-mode: fullscreen)").matches
  );
}

async function requestOn(element: HTMLElement) {
  const el = element as FullscreenCapable;
  // Android Chrome: navigationUI "hide" removes status bar + system nav bar.
  const immersive: FullscreenOptions = { navigationUI: "hide" };

  if (typeof el.requestFullscreen === "function") {
    try {
      await el.requestFullscreen(immersive);
      return;
    } catch {
      // Older Android WebViews may reject options — retry plain request.
      await el.requestFullscreen();
      return;
    }
  }
  if (typeof el.webkitRequestFullscreen === "function") {
    await el.webkitRequestFullscreen(immersive);
    return;
  }
  if (typeof el.webkitRequestFullScreen === "function") {
    await el.webkitRequestFullScreen(immersive);
    return;
  }
  throw new Error("Fullscreen API unavailable");
}

async function requestImmersiveFullscreen() {
  // Prefer <html>, then <body> — both work on Android Chrome; body helps some WebViews.
  try {
    await requestOn(document.documentElement);
  } catch {
    await requestOn(document.body);
  }
}

async function exitImmersiveFullscreen() {
  const doc = document as FullscreenDocument;

  if (
    typeof document.exitFullscreen === "function" &&
    document.fullscreenElement
  ) {
    await document.exitFullscreen();
    return;
  }
  if (
    typeof doc.webkitExitFullscreen === "function" &&
    doc.webkitFullscreenElement
  ) {
    await doc.webkitExitFullscreen();
    return;
  }
  if (
    typeof doc.webkitCancelFullScreen === "function" &&
    doc.webkitFullscreenElement
  ) {
    await doc.webkitCancelFullScreen();
  }
}

export function useFullscreen() {
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const sync = () => {
      const active = isOsFullscreen();
      setFullscreen(active);
      document.documentElement.classList.toggle("is-fullscreen", active);
    };
    sync();

    const displayQuery = window.matchMedia("(display-mode: fullscreen)");
    displayQuery.addEventListener("change", sync);
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);

    return () => {
      displayQuery.removeEventListener("change", sync);
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
      document.documentElement.classList.remove("is-fullscreen");
    };
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      // Installed Android PWA already in manifest fullscreen — API exit only if element fullscreen is active.
      if (
        window.matchMedia("(display-mode: fullscreen)").matches &&
        !getFullscreenElement()
      ) {
        return;
      }
      if (getFullscreenElement()) {
        await exitImmersiveFullscreen();
      } else {
        await requestImmersiveFullscreen();
      }
    } catch {
      // Gesture required, policy blocked, or unsupported WebView.
    }
  }, []);

  return { fullscreen, toggleFullscreen };
}
