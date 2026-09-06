"use client";

import { useEffect } from "react";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Registers the service worker so the app is installable as a PWA. */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      void navigator.serviceWorker
        .register(`${basePath}/sw.js`, { scope: `${basePath}/` })
        .catch((error) => {
          console.warn("Service worker registration failed:", error);
        });
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}
