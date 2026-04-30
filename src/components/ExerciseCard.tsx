import { useMemo, useState } from "react";
import { Check, Minus, Plus } from "lucide-react";
import type { Exercise } from "@/lib/db";
import { RpeSlider } from "./RpeSlider";
import { useWorkout } from "@/context/WorkoutContext";

interface Props {
  exercise: Exercise;
  completedSets: number;
}

export function ExerciseCard({ exercise, completedSets }: Props) {
  const { sessionId, completeSet, rest } = useWorkout();
  const [reps, setReps] = useState<number>(exercise.targetReps);
  const [rpe, setRpe] = useState<number>(7);

  const dots = useMemo(() => {
    const total = Math.max(exercise.targetSets, completedSets);
    return Array.from({ length: total }, (_, i) => i < completedSets);
  }, [exercise.targetSets, completedSets]);

  const isResting = rest !== null;
  const disabled = !sessionId || isResting;
  const allDone = completedSets >= exercise.targetSets;

  return (
    <div
      className={`relative rounded-2xl border bg-card p-5 transition-all ${
        allDone ? "border-success/40" : "border-border hover:border-primary/40"
      }`}
    >
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-bold leading-tight">
            {exercise.name}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Objetivo: {exercise.targetSets} × {exercise.targetReps} · descanso{" "}
            {exercise.defaultRestSec}s
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {dots.map((done, i) => (
            <span
              key={i}
              className={`h-2.5 w-2.5 rounded-full transition-colors ${
                done ? "bg-primary shadow-[0_0_8px_var(--color-primary)]" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </header>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">
            Repeticiones
          </label>
          <div className="flex items-stretch overflow-hidden rounded-xl border border-border bg-surface-elevated">
            <button
              type="button"
              onClick={() => setReps((r) => Math.max(0, r - 1))}
              className="flex w-12 items-center justify-center text-muted-foreground transition-colors active:bg-muted"
              aria-label="Restar repetición"
            >
              <Minus className="h-4 w-4" />
            </button>
            <input
              inputMode="decimal"
              pattern="[0-9]*"
              value={reps}
              onChange={(e) => {
                const n = Number(e.target.value.replace(/[^0-9]/g, ""));
                setReps(Number.isFinite(n) ? n : 0);
              }}
              className="w-full min-w-0 bg-transparent text-center font-display text-2xl font-bold outline-none"
            />
            <button
              type="button"
              onClick={() => setReps((r) => r + 1)}
              className="flex w-12 items-center justify-center text-muted-foreground transition-colors active:bg-muted"
              aria-label="Sumar repetición"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex flex-col justify-end">
          <RpeSlider value={rpe} onChange={setRpe} />
        </div>
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={() =>
          completeSet({
            exerciseId: exercise.id!,
            setNumber: completedSets + 1,
            reps,
            rpe,
            restSec: exercise.defaultRestSec,
          })
        }
        aria-label="Completar serie"
        className="flex h-16 w-full items-center justify-center gap-2 rounded-xl bg-primary font-display text-lg font-bold uppercase tracking-wide text-primary-foreground shadow-[0_8px_24px_-8px_var(--color-primary)] transition-all duration-75 active:scale-[0.97] active:brightness-110 disabled:pointer-events-none disabled:opacity-40"
      >
        <Check className="h-6 w-6" strokeWidth={3} />
        Completar serie
      </button>
    </div>
  );
}