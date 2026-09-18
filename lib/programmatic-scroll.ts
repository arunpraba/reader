type Listener = () => void;

let activeCount = 0;
const listeners = new Set<Listener>();

function notify() {
  for (const listener of listeners) listener();
}

export function isAutoScrolling() {
  return activeCount > 0;
}

export function subscribeAutoScroll(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function beginAutoScroll() {
  activeCount += 1;
  if (activeCount === 1) notify();
}

function endAutoScroll() {
  if (activeCount === 0) return;
  activeCount -= 1;
  if (activeCount === 0) notify();
}

/**
 * Run a playback/follow scroll and keep `isAutoScrolling()` true until
 * window scroll events settle (or a max duration elapses).
 */
export function runAutoScroll(fn: () => void, settleMs = 120, maxMs = 3000) {
  beginAutoScroll();

  let done = false;
  let settleTimer: ReturnType<typeof setTimeout> | null = null;

  const finish = () => {
    if (done) return;
    done = true;
    if (settleTimer) clearTimeout(settleTimer);
    clearTimeout(maxTimer);
    window.removeEventListener("scroll", onScroll);
    endAutoScroll();
  };

  const onScroll = () => {
    if (settleTimer) clearTimeout(settleTimer);
    settleTimer = setTimeout(finish, settleMs);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  const maxTimer = setTimeout(finish, maxMs);

  try {
    fn();
  } catch (error) {
    finish();
    throw error;
  }

  // Already in view → no scroll events; clear after settleMs.
  settleTimer = setTimeout(finish, settleMs);
}
