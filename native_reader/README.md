# Margin — native shell

Expo WebView that loads https://arunpraba.github.io/reader/

## Run

```bash
cd native_reader
npm install
npx expo start
```

Then open in Expo Go (scan QR) or press `i` / `a` for simulator / emulator.

## Local APK (no Expo account)

Needs Android Studio SDK and JDK 17. No EAS login.

```bash
cd native_reader
npm install
npm run build:apk
```

APK path:

`android/app/build/outputs/apk/release/app-release.apk`

This is a local sideload build (debug keystore). It is not a Play Store upload.
