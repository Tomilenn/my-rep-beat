import { useEffect, useState } from "react";

/**
 * High-precision countdown derived from an absolute end timestamp
 * (performance.now()-based). Uses requestAnimationFrame plus an
 * interval fallback so seconds never "jump" even if rAF is throttled.
 */
export function useCountdown(endAt: number | null): number {
  const [remaining, setRemaining] = useState<number>(() =>
    endAt == null ? 0 : Math.max(0, endAt - performance.now()),
  );

  useEffect(() => {
    if (endAt == null) {
      setRemaining(0);
      return;
    }

    let raf = 0;
    let stopped = false;

    const tick = () => {
      if (stopped) return;
      const r = Math.max(0, endAt - performance.now());
      setRemaining(r);
      if (r > 0) raf = requestAnimationFrame(tick);
    };

    const interval = window.setInterval(() => {
      const r = Math.max(0, endAt - performance.now());
      setRemaining(r);
    }, 250);

    raf = requestAnimationFrame(tick);

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      clearInterval(interval);
    };
  }, [endAt]);

  return remaining;
}