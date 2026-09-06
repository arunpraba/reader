"use client";

import { useCallback, useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true;
}

function detectIosSafari(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const isIos =
    /iPad|iPhone|iPod/.test(ua) ||
    (window.navigator.platform === "MacIntel" &&
      window.navigator.maxTouchPoints > 1);
  const isWebkit = /WebKit/.test(ua);
  const isOtherBrowser = /CriOS|FxiOS|EdgiOS|OPiOS|Chrome|Firefox|Edg/.test(ua);
  return isIos && isWebkit && !isOtherBrowser;
}

export function usePwaInstall() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIosSafari, setIsIosSafari] = useState(false);
  const [showIosTip, setShowIosTip] = useState(false);

  useEffect(() => {
    setIsInstalled(isStandaloneDisplay());
    setIsIosSafari(detectIosSafari());

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferred(null);
      setIsInstalled(true);
      setShowIosTip(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") {
        setDeferred(null);
        setIsInstalled(true);
      }
      return outcome;
    }
    if (isIosSafari && !isInstalled) {
      setShowIosTip(true);
      return "ios-tip" as const;
    }
    return null;
  }, [deferred, isIosSafari, isInstalled]);

  const dismissTip = useCallback(() => setShowIosTip(false), []);

  return {
    canPrompt: deferred !== null && !isInstalled,
    isInstalled,
    isIosSafari: isIosSafari && !isInstalled,
    showIosTip,
    install,
    dismissTip,
  };
}
