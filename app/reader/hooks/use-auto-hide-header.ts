"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isAutoScrolling } from "@/lib/programmatic-scroll";

const HIDE_AFTER_MS = 5000;
const TOP_REVEAL_PX = 64;

function isTopbarTarget(target: EventTarget | null) {
  return target instanceof Element && !!target.closest(".reader-topbar");
}

export function useAutoHideHeader(pauseHide: boolean) {
  const [headerVisible, setHeaderVisible] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pauseHideRef = useRef(pauseHide);
  const headerVisibleRef = useRef(headerVisible);

  useEffect(() => {
    pauseHideRef.current = pauseHide;
  }, [pauseHide]);

  useEffect(() => {
    headerVisibleRef.current = headerVisible;
  }, [headerVisible]);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const scheduleHide = useCallback(() => {
    clearHideTimer();
    if (pauseHideRef.current) return;
    hideTimerRef.current = setTimeout(() => {
      if (!pauseHideRef.current) setHeaderVisible(false);
    }, HIDE_AFTER_MS);
  }, [clearHideTimer]);

  const showHeader = useCallback(() => {
    setHeaderVisible(true);
    scheduleHide();
  }, [scheduleHide]);

  useEffect(() => {
    if (pauseHide) {
      clearHideTimer();
      setHeaderVisible(true);
      return;
    }
    scheduleHide();
  }, [pauseHide, clearHideTimer, scheduleHide]);

  useEffect(() => {
    const holdOnTopbar = () => {
      setHeaderVisible(true);
      clearHideTimer();
    };

    const onPointerMove = (event: PointerEvent) => {
      // Finger drags fire many move events; only treat top-edge peeks as reveal
      // so scrolling the page doesn't keep yanking the header back.
      if (event.pointerType === "touch") {
        if (isTopbarTarget(event.target)) {
          holdOnTopbar();
          return;
        }
        if (event.clientY <= TOP_REVEAL_PX) showHeader();
        return;
      }
      if (isTopbarTarget(event.target)) {
        holdOnTopbar();
        return;
      }
      if (event.clientY <= TOP_REVEAL_PX) {
        showHeader();
        return;
      }
      if (!headerVisibleRef.current) return;
      scheduleHide();
    };

    const onActivity = (event: Event) => {
      if (isTopbarTarget(event.target)) {
        holdOnTopbar();
        return;
      }
      showHeader();
    };

    const onScroll = () => {
      // Controlled by auto-scroll tracker — ignore playback follow scrolls.
      if (isAutoScrolling()) return;
      showHeader();
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onActivity, { passive: true });
    window.addEventListener("wheel", onActivity, { passive: true });
    window.addEventListener("keydown", onActivity);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onActivity);
      window.removeEventListener("wheel", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("scroll", onScroll);
    };
  }, [showHeader, scheduleHide, clearHideTimer]);

  useEffect(() => () => clearHideTimer(), [clearHideTimer]);

  return { headerVisible };
}
