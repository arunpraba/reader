import { useEffect, useState } from "react";
import { createEdgeProvider } from "../../../lib/tts/edge-provider";
import type { TtsVoiceOption } from "../../../lib/tts/types";

export function useTtsVoices(ttsEngine: "browser" | "edge") {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [edgeVoices, setEdgeVoices] = useState<TtsVoiceOption[]>([]);

  useEffect(() => {
    const refreshVoices = () => setVoices(speechSynthesis.getVoices());
    refreshVoices();
    speechSynthesis.addEventListener("voiceschanged", refreshVoices);
    return () =>
      speechSynthesis.removeEventListener("voiceschanged", refreshVoices);
  }, []);

  useEffect(() => {
    if (ttsEngine !== "edge") return;
    let cancelled = false;
    void createEdgeProvider()
      .listVoices?.()
      .then((loaded) => {
        if (!cancelled) setEdgeVoices(loaded ?? []);
      })
      .catch(() => {
        if (!cancelled) setEdgeVoices([]);
      });
    return () => {
      cancelled = true;
    };
  }, [ttsEngine]);

  return { voices, edgeVoices };
}
