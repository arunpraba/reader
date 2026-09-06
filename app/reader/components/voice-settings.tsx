import { browserTtsAvailable } from "../../../lib/tts/capabilities";

export function VoiceSettings({
  preferredVoice,
  voices,
  onPreferredVoiceChange,
}: {
  preferredVoice: string;
  voices: SpeechSynthesisVoice[];
  onPreferredVoiceChange: (voice: string) => void;
}) {
  const browserOk = browserTtsAvailable();

  return (
    <label className="voice-control">
      <span>
        <b>Voice</b>
        <small>Used when speaking this page</small>
      </span>
      <select
        value={preferredVoice}
        onChange={(e) => onPreferredVoiceChange(e.target.value)}
        disabled={!browserOk}
      >
        <option value="">Auto — multilingual</option>
        {voices.map((voice) => (
          <option value={voice.voiceURI} key={voice.voiceURI}>
            {voice.name} · {voice.lang}
          </option>
        ))}
      </select>
      {!browserOk ? (
        <small>Listening needs browser speech voices on this device.</small>
      ) : (
        <small>Auto switches language when the text language changes.</small>
      )}
    </label>
  );
}
