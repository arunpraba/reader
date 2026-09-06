/** Web Speech API — often missing in Android WebView. */
export function browserTtsAvailable() {
  return typeof window !== "undefined" && !!window.speechSynthesis;
}
