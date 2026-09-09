import { WebView } from "react-native-webview";

export default function App() {
  return (
    <WebView
      source={{ uri: "https://arunpraba.github.io/reader/" }}
      style={{ flex: 1 }}
    />
  );
}
