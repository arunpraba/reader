import { isMicrosoftEdge } from "../../../lib/tts/load-edge";
import type { TtsVoiceOption } from "../../../lib/tts/types";

export function VoiceSettings({
  ttsEngine,
  preferredVoice,
  preferredEdgeVoice,
  voices,
  edgeVoices,
  onTtsEngineChange,
  onPreferredVoiceChange,
  onPreferredEdgeVoiceChange,
}: {
  ttsEngine: "browser" | "edge";
  preferredVoice: string;
  preferredEdgeVoice: string;
  voices: SpeechSynthesisVoice[];
  edgeVoices: TtsVoiceOption[];
  onTtsEngineChange: (engine: "browser" | "edge") => void;
  onPreferredVoiceChange: (voice: string) => void;
  onPreferredEdgeVoiceChange: (voice: string) => void;
}) {
  return (
    <>
      <label className="voice-control">
        <span>
          <b>Speech engine</b>
          <small>Choose how this page is spoken</small>
        </span>
        <select
          value={ttsEngine}
          onChange={(e) =>
            onTtsEngineChange(e.target.value as "browser" | "edge")
          }
        >
          <option value="browser">Browser voices (default)</option>
          <option value="edge">Edge neural (Microsoft Edge only)</option>
        </select>
        {ttsEngine === "edge" && !isMicrosoftEdge() && (
          <small>Edge neural voices require Microsoft Edge browser.</small>
        )}
      </label>
      <label className="voice-control">
        <span>
          <b>Voice</b>
          <small>Used when speaking this page</small>
        </span>
        {ttsEngine === "browser" ? (
          <select
            value={preferredVoice}
            onChange={(e) => onPreferredVoiceChange(e.target.value)}
          >
            <option value="">Auto — multilingual</option>
            {voices.map((voice) => (
              <option value={voice.voiceURI} key={voice.voiceURI}>
                {voice.name} · {voice.lang}
              </option>
            ))}
          </select>
        ) : (
          <select
            value={preferredEdgeVoice}
            onChange={(e) => onPreferredEdgeVoiceChange(e.target.value)}
          >
            <option value="">Auto — multilingual</option>
            {edgeVoices.map((voice) => (
              <option value={voice.id} key={voice.id}>
                {voice.label} · {voice.lang}
              </option>
            ))}
          </select>
        )}
        <small>Auto switches language when the text language changes.</small>
      </label>
    </>
  );
}
