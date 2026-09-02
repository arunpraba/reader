export type MediaPlayerHandlers = {
  title: string;
  onPlay: () => void;
  onPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSeek: (ratio: number) => void;
  getProgress: () => {
    position: number;
    duration: number;
    playbackRate: number;
  };
};

export type MediaPlayerOptions = {
  silentLoop?: boolean;
  resumeSpeech?: boolean;
};

let audio: HTMLAudioElement | null = null;
let silentSrc = "";
let listening = false;
let activeHandlers: MediaPlayerHandlers | null = null;
let silentLoop = false;
let wakeLock: WakeLockSentinel | null = null;
let blobPlayFinish: (() => void) | null = null;
let currentBlobUrl = "";

function writeString(view: DataView, offset: number, value: string) {
  for (let i = 0; i < value.length; i++)
    view.setUint8(offset + i, value.charCodeAt(i));
}

function createSilentSrc() {
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
  silentSrc = createSilentSrc();
  audio = new Audio();
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

function startSilentLoopPlayback() {
  const el = ensureAudio();
  el.loop = true;
  el.src = silentSrc;
  void el.play().catch(() => undefined);
}

async function requestWakeLock() {
  if (!activeHandlers || document.hidden || !navigator.wakeLock) return;
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

function bindMediaSession(handlers: MediaPlayerHandlers) {
  if (!navigator.mediaSession) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title: handlers.title,
    artist: "Margin",
    artwork: [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml" }],
  });
  navigator.mediaSession.playbackState = "playing";
  navigator.mediaSession.setActionHandler("play", () => handlers.onPlay());
  navigator.mediaSession.setActionHandler("pause", () => handlers.onPause());
  navigator.mediaSession.setActionHandler("previoustrack", () =>
    handlers.onPrevious(),
  );
  navigator.mediaSession.setActionHandler("nexttrack", () => handlers.onNext());
  navigator.mediaSession.setActionHandler("seekbackward", (details) => {
    const { duration, position } = handlers.getProgress();
    if (duration <= 0) return;
    const skip = details.seekOffset ?? 10;
    handlers.onSeek(Math.max(0, (position - skip) / duration));
  });
  navigator.mediaSession.setActionHandler("seekforward", (details) => {
    const { duration, position } = handlers.getProgress();
    if (duration <= 0) return;
    const skip = details.seekOffset ?? 10;
    handlers.onSeek(Math.min(1, (position + skip) / duration));
  });
  navigator.mediaSession.setActionHandler("seekto", (details) => {
    const { duration } = handlers.getProgress();
    if (duration <= 0 || details.seekTime == null) return;
    handlers.onSeek(details.seekTime / duration);
  });
}

function clearMediaSession() {
  if (!navigator.mediaSession) return;
  navigator.mediaSession.playbackState = "none";
  const actions = [
    "play",
    "pause",
    "previoustrack",
    "nexttrack",
    "seekbackward",
    "seekforward",
    "seekto",
  ] as const;
  actions.forEach((action) => {
    navigator.mediaSession.setActionHandler(action, null);
  });
  navigator.mediaSession.metadata = null;
}

function onVisibility() {
  if (!activeHandlers) return;
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

function finishBlobPlayback() {
  const finish = blobPlayFinish;
  blobPlayFinish = null;
  if (currentBlobUrl) {
    URL.revokeObjectURL(currentBlobUrl);
    currentBlobUrl = "";
  }
  finish?.();
  if (silentLoop && activeHandlers) startSilentLoopPlayback();
}

export function playBlob(blob: Blob): Promise<void> {
  return new Promise((resolve) => {
    const el = ensureAudio();
    if (blobPlayFinish) finishBlobPlayback();
    const url = URL.createObjectURL(blob);
    currentBlobUrl = url;
    el.loop = false;
    el.src = url;

    const onEnded = () => {
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("error", onEnded);
      finishBlobPlayback();
      resolve();
    };

    blobPlayFinish = () => {
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("error", onEnded);
      resolve();
    };

    el.addEventListener("ended", onEnded);
    el.addEventListener("error", onEnded);
    void el.play().catch(onEnded);
  });
}

export function stopAudio() {
  if (!audio) return;
  audio.pause();
  audio.removeAttribute("src");
  audio.load();
  finishBlobPlayback();
}

export function pauseAudio() {
  audio?.pause();
}

export function resumeAudio() {
  void audio?.play().catch(() => undefined);
}

export function isAudioPlaying() {
  return audio ? !audio.paused : false;
}

export function updatePosition(state: {
  duration: number;
  position: number;
  playbackRate: number;
}) {
  if (!navigator.mediaSession?.setPositionState) return;
  if (state.duration <= 0) return;
  try {
    navigator.mediaSession.setPositionState({
      duration: state.duration,
      position: Math.min(Math.max(0, state.position), state.duration),
      playbackRate: state.playbackRate,
    });
  } catch {
    // Some browsers reject invalid position state.
  }
}

export function setPlaybackState(state: MediaSessionPlaybackState) {
  if (navigator.mediaSession) navigator.mediaSession.playbackState = state;
}

export function activate(
  handlers: MediaPlayerHandlers,
  options?: MediaPlayerOptions,
) {
  if (typeof window === "undefined") return;
  activeHandlers = handlers;
  silentLoop = options?.silentLoop ?? false;
  bindListeners();
  bindMediaSession(handlers);
  updatePosition(handlers.getProgress());
  if (silentLoop) {
    if (options?.resumeSpeech !== false) resumeSpeech();
    startSilentLoopPlayback();
  }
  void requestWakeLock();
}

export function deactivate() {
  activeHandlers = null;
  silentLoop = false;
  stopAudio();
  if (audio) {
    audio.pause();
    audio.loop = false;
    audio.removeAttribute("src");
    audio.load();
  }
  releaseWakeLock();
  clearMediaSession();
}
