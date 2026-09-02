export async function loadEdgeTts() {
  return import("edge-tts-universal/browser");
}

export function isMicrosoftEdge() {
  if (typeof navigator === "undefined") return false;
  return /Edg\//.test(navigator.userAgent);
}
