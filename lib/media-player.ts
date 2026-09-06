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

const SAMPLE_RATE = 8000;
/** Cap WAV length so long docs stay memory-safe; position maps into this window. */
const MAX_WAV_SECONDS = 15 * 60;
const SILENT_VOLUME = 0.01;

let audio: HTMLAudioElement | null = null;
let silentSrc = "";
let silentWavSeconds = 0;
let listening = false;
let activeHandlers: MediaPlayerHandlers | null = null;
let silentLoop = false;
let wakeLock: WakeLockSentinel | null = null;
let holdSpeechResume = false;
let syncingClock = false;
/** Invalidates in-flight audio.play() so a later pause isn't undone. */
let playGeneration = 0;
let artworkObjectUrls: string[] = [];

function writeString(view: DataView, offset: number, value: string) {
  for (let i = 0; i < value.length; i++)
    view.setUint8(offset + i, value.charCodeAt(i));
}

function createSilentSrc(durationSec: number) {
  const seconds = Math.max(
    1,
    Math.min(MAX_WAV_SECONDS, Math.ceil(durationSec || 1)),
  );
  const frames = SAMPLE_RATE * seconds;
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
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);
  for (let i = 0; i < frames; i++)
    view.setInt16(44 + i * 2, i & 1 ? 1 : -1, true);
  silentWavSeconds = seconds;
  return URL.createObjectURL(new Blob([buffer], { type: "audio/wav" }));
}

function revokeSilentSrc() {
  if (silentSrc) {
    URL.revokeObjectURL(silentSrc);
    silentSrc = "";
    silentWavSeconds = 0;
  }
}

function revokeArtworkUrls() {
  artworkObjectUrls.forEach((url) => URL.revokeObjectURL(url));
  artworkObjectUrls = [];
}

function resumeSpeech() {
  // Keep speech alive for iOS silent track, but never override a user pause.
  if (holdSpeechResume) return;
  const synthesis =
    typeof window !== "undefined" ? window.speechSynthesis : undefined;
  if (synthesis?.paused) synthesis.resume();
}

function ensureAudio() {
  if (audio) return audio;
  audio = new Audio();
  audio.preload = "auto";
  audio.volume = SILENT_VOLUME;
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
  audio.addEventListener("ended", () => {
    if (!silentLoop || !activeHandlers || holdSpeechResume)
      return;
    // Keep the empty stream alive if the capped WAV ends before reading does.
    const { position, duration } = activeHandlers.getProgress();
    syncSilentClock({ position, duration }, true);
  });
  return audio;
}

function basePath() {
  return process.env.NEXT_PUBLIC_BASE_PATH ?? "";
}

/** Absolute artwork URLs — relative paths make macOS fall back to the site favicon. */
function artworkSrc(path: string) {
  const root = basePath();
  const rel = `${root}${path.startsWith("/") ? path : `/${path}`}`;
  if (typeof window === "undefined") return rel;
  return new URL(rel, window.location.origin).href;
}

function safePlay(el: HTMLAudioElement) {
  const generation = ++playGeneration;
  return el
    .play()
    .then(() => {
      if (generation !== playGeneration || holdSpeechResume) el.pause();
    })
    .catch(() => undefined);
}

function safePause(el: HTMLAudioElement | null) {
  playGeneration += 1;
  el?.pause();
}

function startSilentPlayback(durationSec: number) {
  const el = ensureAudio();
  revokeSilentSrc();
  silentSrc = createSilentSrc(durationSec);
  el.loop = durationSec > MAX_WAV_SECONDS;
  el.volume = SILENT_VOLUME;
  el.src = silentSrc;
  if (holdSpeechResume) {
    safePause(el);
    return;
  }
  void safePlay(el);
}

function mediaTimeForPlayhead(position: number, duration: number) {
  if (silentWavSeconds <= 0) return 0;
  if (duration <= silentWavSeconds) {
    return Math.min(Math.max(0, position), silentWavSeconds - 0.05);
  }
  const ratio = duration > 0 ? position / duration : 0;
  return Math.min(
    Math.max(0, ratio * silentWavSeconds),
    silentWavSeconds - 0.05,
  );
}

function syncSilentClock(
  state: { position: number; duration: number },
  forcePlay = false,
) {
  if (!silentLoop || !audio) return;
  if (state.duration <= 0) return;

  const needsRebuild =
    !silentSrc ||
    Math.abs(Math.min(state.duration, MAX_WAV_SECONDS) - silentWavSeconds) > 1;

  if (needsRebuild) {
    const wasPaused = (audio.paused || holdSpeechResume) && !forcePlay;
    startSilentPlayback(state.duration);
    if (wasPaused && !forcePlay) safePause(audio);
  }

  const target = mediaTimeForPlayhead(state.position, state.duration);
  if (Math.abs(audio.currentTime - target) > 0.35) {
    syncingClock = true;
    try {
      audio.currentTime = target;
    } catch {
      // Ignore seeks before metadata is ready.
    }
    syncingClock = false;
  }

  if (holdSpeechResume) {
    safePause(audio);
  } else if (audio.paused || forcePlay) {
    void safePlay(audio);
  }
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

async function loadArtwork() {
  revokeArtworkUrls();
  const candidates: { path: string; sizes: string }[] = [
    { path: "/now-playing.png", sizes: "512x512" },
    { path: "/icon-512.png", sizes: "512x512" },
    { path: "/icon-192.png", sizes: "192x192" },
  ];
  const artwork: MediaImage[] = [];
  for (const candidate of candidates) {
    try {
      const response = await fetch(artworkSrc(candidate.path), {
        cache: "no-cache",
      });
      if (!response.ok) continue;
      const blob = await response.blob();
      if (!blob.type.startsWith("image/")) continue;
      const url = URL.createObjectURL(blob);
      artworkObjectUrls.push(url);
      artwork.push({
        src: url,
        sizes: candidate.sizes,
        type: blob.type || "image/png",
      });
    } catch {
      // Try the next candidate.
    }
  }
  return artwork;
}

function bindMediaSession(handlers: MediaPlayerHandlers) {
  if (!navigator.mediaSession) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title: handlers.title,
    artist: "Margin",
    artwork: [
      {
        src: artworkSrc("/now-playing.png"),
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: artworkSrc("/icon-512.png"),
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: artworkSrc("/icon-192.png"),
        sizes: "192x192",
        type: "image/png",
      },
    ],
  });
  void loadArtwork().then((artwork) => {
    if (!navigator.mediaSession || activeHandlers !== handlers) return;
    if (!artwork.length) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: handlers.title,
      artist: "Margin",
      artwork,
    });
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
  revokeArtworkUrls();
}

function onVisibility() {
  if (!activeHandlers) return;
  resumeSpeech();
  if (document.hidden) return;
  if (silentLoop && !holdSpeechResume && audio) {
    void safePlay(audio);
  }
  void requestWakeLock();
}

function bindListeners() {
  if (listening) return;
  listening = true;
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pageshow", onVisibility);
}

function stopAudio() {
  if (!audio) return;
  safePause(audio);
  audio.removeAttribute("src");
  audio.load();
}

export function updatePosition(state: {
  duration: number;
  position: number;
  playbackRate: number;
}) {
  if (!syncingClock) {
    if (holdSpeechResume) {
      // Keep the silent track frozen while paused — never restart play().
      if (silentLoop && audio) {
        safePause(audio);
        const target = mediaTimeForPlayhead(state.position, state.duration);
        if (
          silentWavSeconds > 0 &&
          Math.abs(audio.currentTime - target) > 0.35
        ) {
          syncingClock = true;
          try {
            audio.currentTime = target;
          } catch {
            // Ignore seeks before metadata is ready.
          }
          syncingClock = false;
        }
      }
    } else {
      syncSilentClock(state);
    }
  }
  if (!navigator.mediaSession?.setPositionState) return;
  if (state.duration <= 0) return;
  const position = Math.min(Math.max(0, state.position), state.duration);
  const playbackRate = Math.max(0, state.playbackRate);
  try {
    navigator.mediaSession.setPositionState({
      duration: state.duration,
      position,
      playbackRate,
    });
  } catch {
    // Some browsers reject invalid position state.
  }
}

export function setPlaybackState(state: MediaSessionPlaybackState) {
  holdSpeechResume = state === "paused";
  if (navigator.mediaSession) navigator.mediaSession.playbackState = state;
  if (silentLoop && audio) {
    if (state === "paused") {
      safePause(audio);
      // Freeze the OS scrubber at the current playhead.
      if (activeHandlers) updatePosition(activeHandlers.getProgress());
    } else {
      void safePlay(audio);
      if (activeHandlers) updatePosition(activeHandlers.getProgress());
    }
  }
}

export function activate(
  handlers: MediaPlayerHandlers,
  options?: MediaPlayerOptions,
) {
  if (typeof window === "undefined") return;
  activeHandlers = handlers;
  silentLoop = options?.silentLoop ?? false;
  holdSpeechResume = false;
  bindListeners();
  bindMediaSession(handlers);
  const progress = handlers.getProgress();
  if (silentLoop) {
    if (options?.resumeSpeech !== false) resumeSpeech();
    const needsTrack =
      !silentSrc ||
      !audio ||
      Math.abs(
        Math.min(progress.duration, MAX_WAV_SECONDS) - silentWavSeconds,
      ) > 1;
    if (needsTrack) startSilentPlayback(progress.duration);
    syncSilentClock(progress, true);
  }
  updatePosition(progress);
  if (navigator.mediaSession) navigator.mediaSession.playbackState = "playing";
  void requestWakeLock();
}

export function deactivate() {
  activeHandlers = null;
  silentLoop = false;
  holdSpeechResume = false;
  stopAudio();
  revokeSilentSrc();
  if (audio) {
    safePause(audio);
    audio.loop = false;
    audio.volume = SILENT_VOLUME;
    audio.removeAttribute("src");
    audio.load();
  }
  releaseWakeLock();
  clearMediaSession();
}
