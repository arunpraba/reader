import { useCallback, useEffect, useRef, useState } from "react";

const IDLE_MS = 3000;
const PROGRAMMATIC_SCROLL_MS = 1000;

const SCROLL_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "PageUp",
  "PageDown",
  "Home",
  "End",
  " ",
]);

function isEditableTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}

function isControlsTarget(target: EventTarget | null) {
  return target instanceof Element && !!target.closest(".reader-controls");
}

export function useAutoScrollFollow(
  playing: boolean,
  onResume: () => void,
) {
  const [userPaused, setUserPaused] = useState(false);
  const followScroll = playing && !userPaused;
  const programmaticScrollRef = useRef(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const programmaticTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const onResumeRef = useRef(onResume);

  useEffect(() => {
    onResumeRef.current = onResume;
  }, [onResume]);

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  const pause = useCallback(() => {
    if (!playing) return;
    setUserPaused(true);
    clearIdleTimer();
    idleTimerRef.current = setTimeout(() => {
      setUserPaused(false);
      onResumeRef.current();
    }, IDLE_MS);
  }, [clearIdleTimer, playing]);

  const runProgrammaticScroll = useCallback((fn: () => void) => {
    programmaticScrollRef.current = true;
    if (programmaticTimerRef.current) {
      clearTimeout(programmaticTimerRef.current);
    }
    fn();
    programmaticTimerRef.current = setTimeout(() => {
      programmaticScrollRef.current = false;
      programmaticTimerRef.current = null;
    }, PROGRAMMATIC_SCROLL_MS);
  }, []);

  useEffect(() => {
    if (!playing) {
      clearIdleTimer();
      return;
    }

    setUserPaused(false);
    const onUserIntent = (event: Event) => {
      if (isControlsTarget(event.target)) return;
      pause();
    };

    const onScroll = () => {
      if (programmaticScrollRef.current) return;
      pause();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (!SCROLL_KEYS.has(event.key) || isEditableTarget(event.target)) return;
      pause();
    };

    window.addEventListener("wheel", onUserIntent, { passive: true });
    window.addEventListener("touchstart", onUserIntent, { passive: true });
    window.addEventListener("touchmove", onUserIntent, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("wheel", onUserIntent);
      window.removeEventListener("touchstart", onUserIntent);
      window.removeEventListener("touchmove", onUserIntent);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [pause, playing, clearIdleTimer]);

  useEffect(
    () => () => {
      clearIdleTimer();
      if (programmaticTimerRef.current) {
        clearTimeout(programmaticTimerRef.current);
      }
    },
    [clearIdleTimer],
  );

  return { followScroll, runProgrammaticScroll };
}
