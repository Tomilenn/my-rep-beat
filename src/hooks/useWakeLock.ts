import { useEffect, useRef } from "react";

type Sentinel = {
  released: boolean;
  release: () => Promise<void>;
  addEventListener: (type: "release", cb: () => void) => void;
};

export function useWakeLock(active: boolean) {
  const sentinelRef = useRef<Sentinel | null>(null);

  useEffect(() => {
    if (!active) return;
    if (typeof navigator === "undefined") return;
    const wl = (navigator as unknown as { wakeLock?: { request: (t: string) => Promise<Sentinel> } })
      .wakeLock;
    if (!wl) return;

    let cancelled = false;

    const acquire = async () => {
      try {
        const s = await wl.request("screen");
        if (cancelled) {
          await s.release().catch(() => undefined);
          return;
        }
        sentinelRef.current = s;
      } catch {
        // not supported / denied
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible" && active) {
        acquire();
      }
    };

    acquire();
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      sentinelRef.current?.release().catch(() => undefined);
      sentinelRef.current = null;
    };
  }, [active]);
}