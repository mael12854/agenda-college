import { useEffect, useState } from "react";

/**
 * A ticking "now", refreshed periodically and immediately when the tab
 * becomes visible again — a plain `new Date()` computed once at mount
 * would freeze forever, so live-course highlighting and countdowns would
 * silently go stale the longer the app stays open.
 */
export function useNow(intervalMs = 30000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const tick = () => setNow(new Date());
    const id = setInterval(tick, intervalMs);
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [intervalMs]);

  return now;
}
