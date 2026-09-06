# Margin — Capacitor shell

Thin native wrapper that loads [Margin](https://arunpraba.github.io/reader/) in a WebView.

## Prerequisites

- Node.js 20+
- **iOS:** macOS with Xcode and CocoaPods (`pod`)
- **Android:** Android Studio with an SDK / emulator or device

## Setup

```bash
cd native_reader
npm install
npx cap sync
```

## Run

```bash
# iOS
npm run open:ios
# or
npm run ios

# Android
npm run open:android
# or
npm run android
```

After changing `capacitor.config.ts` or files under `www/`, run `npm run sync` again.

## Android APK

```bash
# One-time: create a release keystore + local signing props (do not commit these)
cd android
keytool -genkeypair -v -storetype PKCS12 \
  -keystore app/margin-release.keystore \
  -alias margin -keyalg RSA -keysize 2048 -validity 10000
cp keystore.properties.example keystore.properties
# edit keystore.properties with the passwords you chose
cd ..

# Production (signed release)
npm run build:apk
# → android/app/build/outputs/apk/release/app-release.apk

# Debug
npm run build:apk:debug
```

Back up `android/app/margin-release.keystore` and `android/keystore.properties`. Losing them means you cannot update the same signed app later.

## Configuration

Remote URL and offline fallback:

- Local `www/index.html` opens `https://arunpraba.github.io/reader/` inside the WebView
- `server.allowNavigation` keeps `arunpraba.github.io` in-app (other hosts open in the system browser)
- `server.errorPath` → local `www/error.html` if the shell cannot load

Do **not** set Capacitor `server.url` to the remote site on Android — it commonly fails with the system “This page couldn’t load” screen after install.

Splash and status bar colors use Margin’s `#eeece6` / dark content style. iOS configures `AVAudioSession` for spoken playback so TTS works with the silent switch.

## Icons

Launcher / App Store icons are generated from the web PWA assets in `../public/`:

- `icon-512.png` → iOS `AppIcon` (1024) and Android `ic_launcher` / round
- `icon-512-maskable.png` → Android adaptive `ic_launcher_foreground`
- Splash screens are solid `#eeece6`

## Known limits

These come from wrapping the live web app unchanged:

- **ZIP export** via blob download is often unreliable in iOS WKWebView.
- **Markdown import** (`<input type="file">`) usually works; verify on device.
- **TTS / audio** quality depends on the OS WebView’s speechSynthesis support; background playback and wake lock may be limited.
- **First launch offline** shows `error.html`. After a successful visit, the site’s service worker may help with later offline loads.
- **App Store / Play** reviewers sometimes reject pure remote WebView shells; fine for local/TestFlight use.
- Capacitor marks production `server.url` as non-ideal; this shell uses it intentionally.

## App identity

- App name: `Margin`
- App ID: `com.arunpraba.margin`
