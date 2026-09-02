"use client";

import { useEffect } from "react";

export function CapacitorInit() {
  useEffect(() => {
    void import("@capacitor/core").then(({ Capacitor }) => {
      if (!Capacitor.isNativePlatform()) return;
      document.body.classList.add("capacitor-native");
      void import("@capacitor/status-bar").then(({ StatusBar, Style }) =>
        StatusBar.setStyle({ style: Style.Dark }),
      );
      void import("@capacitor/splash-screen").then(({ SplashScreen }) =>
        SplashScreen.hide(),
      );
    });
  }, []);
  return null;
}
