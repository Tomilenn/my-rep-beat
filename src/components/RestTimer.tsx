import { useWorkout } from "@/context/WorkoutContext";
import { useCountdown } from "@/hooks/useCountdown";
import { useWakeLock } from "@/hooks/useWakeLock";
import { Plus, Minus, SkipForward, Timer } from "lucide-react";
import { useEffect, useState } from "react";

function fmt(ms: number) {
  const s = Math.ceil(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function RestTimer() {
  const { rest, adjustRest, skipRest } = useWorkout();
  const remaining = useCountdown(rest ? rest.endAt : null);
  const [flash, setFlash] = useState(false);

  useWakeLock(rest !== null);

  useEffect(() => {
    if (rest && remaining <= 0) {
      setFlash(true);
      const t = window.setTimeout(() => skipRest(), 1800);
      return () => clearTimeout(t);
    }
    setFlash(false);
  }, [rest, remaining, skipRest]);

  if (!rest) return null;

  const total = rest.durationSec * 1000;
  const pct = Math.max(0, Math.min(100, ((total - remaining) / total) * 100));
  const done = remaining <= 0;

  return (
    <div
      className="fixed bottom-16 left-1/2 z-30 w-full max-w-md -translate-x-1/2 px-3"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div
        className={`relative overflow-hidden rounded-2xl border bg-surface-elevated p-4 shadow-2xl transition-colors ${
          done ? "border-primary glow-primary animate-pulse-ring" : "border-border"
        } ${flash ? "bg-primary/10" : ""}`}
      >
        <div
          className="absolute inset-x-0 top-0 h-1 bg-primary transition-[width] duration-200"
          style={{ width: `${pct}%` }}
        />

        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <Timer className="h-4 w-4" />
            {done ? "¡A entrenar!" : "Descanso"}
          </div>
          <div
            className={`font-display text-3xl font-bold tabular-nums ${
              done ? "text-primary" : "text-foreground"
            }`}
          >
            {fmt(Math.max(0, remaining))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => adjustRest(-15)}
            className="flex h-12 items-center justify-center gap-1 rounded-xl border border-border bg-surface text-sm font-semibold transition-colors active:bg-muted"
          >
            <Minus className="h-4 w-4" />
            15s
          </button>
          <button
            type="button"
            onClick={skipRest}
            className="flex h-12 items-center justify-center gap-1 rounded-xl bg-primary/15 text-sm font-semibold text-primary transition-all active:scale-[0.97] active:brightness-110"
          >
            <SkipForward className="h-4 w-4" />
            Saltar
          </button>
          <button
            type="button"
            onClick={() => adjustRest(15)}
            className="flex h-12 items-center justify-center gap-1 rounded-xl border border-border bg-surface text-sm font-semibold transition-colors active:bg-muted"
          >
            <Plus className="h-4 w-4" />
            15s
          </button>
        </div>
      </div>
    </div>
  );
}