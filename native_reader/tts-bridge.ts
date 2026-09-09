import type { WebViewMessageEvent } from "react-native-webview";
import * as Speech from "expo-speech";

/** Runs before the page boots so `window.speechSynthesis` exists for the play button. */
export const TTS_BRIDGE_JS = `
(function () {
  if (window.__marginTtsBridge) return;
  window.__marginTtsBridge = true;
  var pending = {};
  var seq = 0;
  function Utterance(text) {
    this.text = text || "";
    this.lang = "en-US";
    this.rate = 1;
    this.voice = null;
    this.onstart = null;
    this.onend = null;
    this.onerror = null;
    this.onboundary = null;
  }
  function Synthesis() {
    this.speaking = false;
    this.pending = false;
    this.paused = false;
  }
  Synthesis.prototype.getVoices = function () {
    return [];
  };
  Synthesis.prototype.speak = function (utterance) {
    var token = String(++seq);
    pending[token] = utterance;
    this.speaking = true;
    this.paused = false;
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          type: "tts-speak",
          token: token,
          text: String(utterance.text || ""),
          lang: utterance.lang || "en-US",
          rate: utterance.rate || 1,
        }),
      );
    }
  };
  Synthesis.prototype.cancel = function () {
    pending = {};
    this.speaking = false;
    this.paused = false;
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: "tts-cancel" }));
    }
  };
  Synthesis.prototype.pause = function () {
    this.paused = true;
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: "tts-pause" }));
    }
  };
  Synthesis.prototype.resume = function () {
    this.paused = false;
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: "tts-resume" }));
    }
  };
  window.__marginTtsEvent = function (msg) {
    var utterance = pending[msg.token];
    if (msg.type === "start" && utterance && utterance.onstart) utterance.onstart();
    if (msg.type === "end") {
      if (utterance && utterance.onend) utterance.onend();
      delete pending[msg.token];
      window.speechSynthesis.speaking = Object.keys(pending).length > 0;
    }
    if (msg.type === "error") {
      if (utterance && utterance.onerror)
        utterance.onerror({ error: msg.error || "synthesis-failed" });
      delete pending[msg.token];
      window.speechSynthesis.speaking = Object.keys(pending).length > 0;
    }
  };
  window.SpeechSynthesisUtterance = Utterance;
  window.speechSynthesis = new Synthesis();
})();
true;
`;

export function handleTtsMessage(
  event: WebViewMessageEvent,
  inject: (js: string) => void,
) {
  let msg: {
    type?: string;
    token?: string;
    text?: string;
    lang?: string;
    rate?: number;
  };
  try {
    msg = JSON.parse(event.nativeEvent.data);
  } catch {
    return;
  }

  const notify = (payload: {
    type: string;
    token?: string;
    error?: string;
  }) => {
    inject(
      `window.__marginTtsEvent && window.__marginTtsEvent(${JSON.stringify(payload)}); true;`,
    );
  };

  if (msg.type === "tts-speak" && msg.token) {
    const token = msg.token;
    Speech.stop();
    Speech.speak(msg.text || "", {
      language: msg.lang || "en-US",
      rate: Math.min(2, Math.max(0.1, Number(msg.rate) || 1)),
      onStart: () => notify({ type: "start", token }),
      onDone: () => notify({ type: "end", token }),
      onStopped: () => notify({ type: "end", token }),
      onError: () =>
        notify({ type: "error", token, error: "synthesis-failed" }),
    });
    return;
  }
  if (msg.type === "tts-cancel") {
    void Speech.stop();
    return;
  }
  if (msg.type === "tts-pause") {
    void Speech.pause().catch(() => undefined);
    return;
  }
  if (msg.type === "tts-resume") {
    void Speech.resume().catch(() => undefined);
  }
}
