import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.arunpraba.margin",
  appName: "Margin",
  webDir: "www",
  server: {
    // Keep content local so Android serves www/ reliably, then navigate into
    // the remote site inside the WebView (see www/index.html).
    androidScheme: "https",
    allowNavigation: [
      "arunpraba.github.io",
      "10.0.2.2",
      "localhost",
      "127.0.0.1",
    ],
    cleartext: true,
    errorPath: "error.html",
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: "#eeece6",
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#eeece6",
    },
  },
};

export default config;
