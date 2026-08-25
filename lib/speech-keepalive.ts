export type SpeechKeepAliveHandlers = {
  title: string;
  onPlay: () => void;
  onPause: () => void;
};

let audio: HTMLAudioElement | null = null;
let src = "";
let listening = false;
let active: SpeechKeepAliveHandlers | null = null;
let wakeLock: WakeLockSentinel | null = null;

function writeString(view: DataView, offset: number, value: string) {
  for (let i = 0; i < value.length; i++)
    view.setUint8(offset + i, value.charCodeAt(i));
}

function createKeepAliveSrc() {
  const sampleRate = 22050;
  const frames = sampleRate * 2;
  const dataSize = frames * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);
  for (let i = 0; i < frames; i++)
    view.setInt16(44 + i * 2, i & 1 ? 1 : -1, true);
  return URL.createObjectURL(new Blob([buffer], { type: "audio/wav" }));
}

function resumeSpeech() {
  if (typeof speechSynthesis !== "undefined" && speechSynthesis.paused)
    speechSynthesis.resume();
}

function ensureAudio() {
  if (audio) return audio;
  src = createKeepAliveSrc();
  audio = new Audio(src);
  audio.loop = true;
  audio.preload = "auto";
  audio.setAttribute("playsinline", "");
  audio.setAttribute("webkit-playsinline", "");
  audio.setAttribute("aria-hidden", "true");
  audio.style.position = "absolute";
  audio.style.width = "0";
  audio.style.height = "0";
  audio.style.opacity = "0";
  audio.style.pointerEvents = "none";
  document.body.appendChild(audio);
  audio.addEventListener("timeupdate", resumeSpeech);
  return audio;
}

async function requestWakeLock() {
  if (!active || document.hidden || !navigator.wakeLock) return;
  try {
    wakeLock = await navigator.wakeLock.request("screen");
    wakeLock.addEventListener("release", () => {
      wakeLock = null;
    });
  } catch {
    wakeLock = null;
  }
}

function releaseWakeLock() {
  const lock = wakeLock;
  wakeLock = null;
  void lock?.release();
}

function bindMediaSession(handlers: SpeechKeepAliveHandlers) {
  if (!navigator.mediaSession) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title: handlers.title,
    artist: "Margin",
  });
  navigator.mediaSession.playbackState = "playing";
  navigator.mediaSession.setActionHandler("play", () => handlers.onPlay());
  navigator.mediaSession.setActionHandler("pause", () => handlers.onPause());
}

function clearMediaSession() {
  if (!navigator.mediaSession) return;
  navigator.mediaSession.playbackState = "none";
  navigator.mediaSession.setActionHandler("play", null);
  navigator.mediaSession.setActionHandler("pause", null);
  navigator.mediaSession.metadata = null;
}

function onVisibility() {
  if (!active) return;
  resumeSpeech();
  if (document.hidden) return;
  void audio?.play().catch(() => undefined);
  void requestWakeLock();
}

function bindListeners() {
  if (listening) return;
  listening = true;
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pageshow", onVisibility);
}

export function startSpeechKeepAlive(handlers: SpeechKeepAliveHandlers) {
  if (typeof window === "undefined") return;
  active = handlers;
  bindListeners();
  bindMediaSession(handlers);
  const el = ensureAudio();
  resumeSpeech();
  void el.play().then(requestWakeLock).catch(requestWakeLock);
}

export function stopSpeechKeepAlive() {
  active = null;
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }
  releaseWakeLock();
  clearMediaSession();
}
