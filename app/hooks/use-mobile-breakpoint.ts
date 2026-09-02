import { useEffect, useState } from "react";

/** Portrait phones, or any short landscape (phone landscape). */
export const MOBILE_MEDIA_QUERY =
  "(max-width: 720px), (orientation: landscape) and (max-height: 540px)";

export function useMobileBreakpoint() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia(MOBILE_MEDIA_QUERY).matches
      : false,
  );

  useEffect(() => {
    const media = window.matchMedia(MOBILE_MEDIA_QUERY);
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return isMobile;
}
