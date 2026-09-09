import { useRef } from "react";
import { WebView } from "react-native-webview";
import { handleTtsMessage, TTS_BRIDGE_JS } from "./tts-bridge";

export default function App() {
  const webRef = useRef<WebView>(null);

  return (
    <WebView
      ref={webRef}
      source={{ uri: "https://arunpraba.github.io/reader/" }}
      style={{ flex: 1 }}
      scalesPageToFit={false}
      setBuiltInZoomControls={false}
      setDisplayZoomControls={false}
      mediaPlaybackRequiresUserAction={false}
      allowsInlineMediaPlayback
      javaScriptEnabled
      injectedJavaScriptBeforeContentLoaded={TTS_BRIDGE_JS}
      onMessage={(event) =>
        handleTtsMessage(event, (js) => webRef.current?.injectJavaScript(js))
      }
    />
  );
}
