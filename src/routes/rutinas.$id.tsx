import { createFileRoute, Link } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type Exercise } from "@/lib/db";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/rutinas/$id")({
  head: () => ({
    meta: [
      { title: "Editar rutina — CalistenIA" },
      { name: "description", content: "Edita ejercicios, series y descansos." },
    ],
  }),
  component: RutinaEditor,
});

function RutinaEditor() {
  const { id } = Route.useParams();
  const routineId = Number(id);
  const routine = useLiveQuery(() => db.routines.get(routineId), [routineId]);
  const exercises =
    useLiveQuery<Exercise[]>(
      () => db.exercises.where("routineId").equals(routineId).sortBy("order"),
      [routineId],
    ) ?? [];

  const addExercise = async () => {
    const name = window.prompt("Nombre del ejercicio");
    if (!name) return;
    await db.exercises.add({
      routineId, name, order: exercises.length,
      targetSets: 3, targetReps: 10, defaultRestSec: 90,
    });
  };

  const update = (exId: number, field: "targetSets" | "targetReps" | "defaultRestSec", v: number) =>
    db.exercises.update(exId, { [field]: v });

  const deleteRoutine = async () => {
    if (!window.confirm("¿Eliminar rutina y sus ejercicios?")) return;
    await db.transaction("rw", db.routines, db.exercises, async () => {
      await db.exercises.where("routineId").equals(routineId).delete();
      await db.routines.delete(routineId);
    });
    window.history.back();
  };

  return (
    <main className="flex flex-1 flex-col gap-4 px-4 pt-8 pb-8">
      <header className="flex items-center justify-between">
        <Link to="/rutinas" className="flex h-11 items-center gap-1 rounded-xl px-2 text-sm text-muted-foreground active:bg-muted">
          <ArrowLeft className="h-4 w-4" />Atrás
        </Link>
        <button type="button" onClick={deleteRoutine} aria-label="Eliminar rutina"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-destructive/40 bg-destructive/10 text-destructive active:bg-destructive/20">
          <Trash2 className="h-4 w-4" />
        </button>
      </header>
      <h1 className="font-display text-3xl font-bold">{routine?.name ?? "—"}</h1>

      <ul className="flex flex-col gap-3">
        {exercises.map((ex) => (
          <li key={ex.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-3 flex items-start justify-between gap-2">
              <h3 className="font-display text-base font-bold">{ex.name}</h3>
              <button type="button" onClick={() => db.exercises.delete(ex.id!)}
                className="text-muted-foreground active:text-destructive" aria-label="Eliminar ejercicio">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <NumField label="Series" value={ex.targetSets} onChange={(v) => update(ex.id!, "targetSets", v)} />
              <NumField label="Reps" value={ex.targetReps} onChange={(v) => update(ex.id!, "targetReps", v)} />
              <NumField label="Descanso (s)" value={ex.defaultRestSec} onChange={(v) => update(ex.id!, "defaultRestSec", v)} />
            </div>
          </li>
        ))}
      </ul>

      <button type="button" onClick={addExercise}
        className="flex h-14 items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border text-sm font-semibold text-muted-foreground active:bg-muted">
        <Plus className="h-4 w-4" />Añadir ejercicio
      </button>
    </main>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-muted-foreground">{label}</span>
      <input inputMode="decimal" pattern="[0-9]*" value={value}
        onChange={(e) => { const n = Number(e.target.value.replace(/[^0-9]/g, "")); onChange(Number.isFinite(n) ? n : 0); }}
        className="h-10 w-full rounded-lg border border-border bg-surface-elevated px-2 text-center font-display text-base font-bold outline-none focus:border-primary" />
    </label>
  );
}