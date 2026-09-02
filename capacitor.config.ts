import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.arun.margin",
  appName: "Margin",
  webDir: "out",
  server: {
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: { launchAutoHide: true },
    StatusBar: { style: "DARK" },
  },
};

export default config;
