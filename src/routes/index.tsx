import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { useMemo, useState } from "react";
import { Play, Square, Dumbbell } from "lucide-react";
import { db, type Routine } from "@/lib/db";
import { useWorkout } from "@/context/WorkoutContext";
import { ExerciseCard } from "@/components/ExerciseCard";
import { EndSessionDialog } from "@/components/EndSessionDialog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hoy — CalistenIA" },
      {
        name: "description",
        content:
          "Empieza tu sesión de calistenia: registra series, repeticiones y RPE con cronómetro de descanso.",
      },
      { property: "og:title", content: "Hoy — CalistenIA" },
      {
        property: "og:description",
        content: "Empieza tu sesión y registra tu progreso en tiempo real.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { sessionId, routineId, setLogsCount, startSession, endSession } =
    useWorkout();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const routines = useLiveQuery(() => db.routines.toArray(), []) ?? [];
  const exercises = useLiveQuery(
    () =>
      routineId == null
        ? Promise.resolve([])
        : db.exercises.where("routineId").equals(routineId).sortBy("order"),
    [routineId],
  ) ?? [];

  const setLogs = useLiveQuery(
    () =>
      sessionId == null
        ? Promise.resolve([])
        : db.setLogs.where("sessionId").equals(sessionId).toArray(),
    [sessionId],
  ) ?? [];

  const completedByExercise = useMemo(() => {
    const m = new Map<number, number>();
    for (const log of setLogs) m.set(log.exerciseId, (m.get(log.exerciseId) ?? 0) + 1);
    return m;
  }, [setLogs]);

  if (sessionId == null) {
    return (
      <main className="flex flex-1 flex-col gap-6 px-4 pt-10 pb-8">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            CalistenIA
          </p>
          <h1 className="mt-1 font-display text-4xl font-bold leading-tight">
            Listo para entrenar.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Elige una rutina y empieza tu sesión. Tu progreso se guarda en este dispositivo.
          </p>
        </header>

        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Rutinas
          </h2>
          {routines.length === 0 && (
            <p className="text-sm text-muted-foreground">Cargando rutinas…</p>
          )}
          {routines.map((r: Routine) => (
            <RoutineStartCard key={r.id} routine={r} onStart={() => startSession(r.id!)} />
          ))}
        </section>

        <Link
          to="/rutinas"
          className="text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Gestionar rutinas →
        </Link>
      </main>
    );
  }

  const currentRoutine = routines.find((r) => r.id === routineId);

  return (
    <main className="flex flex-1 flex-col gap-4 px-4 pt-8 pb-8">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            En sesión
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold leading-tight">
            {currentRoutine?.name ?? "Entrenamiento"}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {setLogs.length} {setLogs.length === 1 ? "serie" : "series"} completadas
          </p>
        </div>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className="flex h-11 items-center gap-1.5 rounded-xl border border-destructive/40 bg-destructive/10 px-3 text-sm font-semibold text-destructive transition-colors active:bg-destructive/20"
        >
          <Square className="h-4 w-4" />
          Terminar
        </button>
      </header>

      <div className="flex flex-col gap-3">
        {exercises.map((ex) => (
          <ExerciseCard
            key={ex.id}
            exercise={ex}
            completedSets={completedByExercise.get(ex.id!) ?? 0}
          />
        ))}
      </div>

      <EndSessionDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        empty={setLogsCount === 0}
        onConfirm={() => {
          setConfirmOpen(false);
          endSession();
        }}
      />
    </main>
  );
}

function RoutineStartCard({
  routine,
  onStart,
}: {
  routine: Routine;
  onStart: () => void;
}) {
  const exCount = useLiveQuery(
    () => db.exercises.where("routineId").equals(routine.id!).count(),
    [routine.id],
  ) ?? 0;

  return (
    <button
      type="button"
      onClick={onStart}
      className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-all duration-75 hover:border-primary/40 active:scale-[0.98]"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
        <Dumbbell className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-display text-lg font-bold">{routine.name}</h3>
        <p className="text-xs text-muted-foreground">
          {exCount} {exCount === 1 ? "ejercicio" : "ejercicios"} · {routine.split}
        </p>
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-transform duration-75 group-active:scale-95">
        <Play className="h-5 w-5 fill-current" />
      </div>
    </button>
  );
}
