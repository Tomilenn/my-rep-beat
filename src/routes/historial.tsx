import { createFileRoute } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type Session, type Routine, type SetLog } from "@/lib/db";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const Route = createFileRoute("/historial")({
  head: () => ({
    meta: [
      { title: "Historial — CalistenIA" },
      { name: "description", content: "Tus sesiones de entrenamiento pasadas." },
    ],
  }),
  component: HistorialPage,
});

function HistorialPage() {
  const sessions = useLiveQuery<Session[]>(() => db.sessions.orderBy("startedAt").reverse().toArray(), []) ?? [];
  const routines = useLiveQuery<Routine[]>(() => db.routines.toArray(), []) ?? [];
  const allLogs = useLiveQuery<SetLog[]>(() => db.setLogs.toArray(), []) ?? [];

  const routineMap = new Map(routines.map((r) => [r.id!, r.name]));
  const logsBySession = new Map<number, SetLog[]>();
  for (const l of allLogs) {
    const arr = logsBySession.get(l.sessionId) ?? [];
    arr.push(l);
    logsBySession.set(l.sessionId, arr);
  }

  return (
    <main className="flex flex-1 flex-col gap-4 px-4 pt-10 pb-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Registro</p>
        <h1 className="mt-1 font-display text-3xl font-bold">Historial</h1>
      </header>

      {sessions.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Aún no hay sesiones. Empieza tu primer entrenamiento.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {sessions.map((s) => {
            const logs = logsBySession.get(s.id!) ?? [];
            const volume = logs.reduce((acc, l) => acc + l.reps, 0);
            const avgRpe = logs.length ? (logs.reduce((a, l) => a + l.rpe, 0) / logs.length).toFixed(1) : "—";
            return (
              <li key={s.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display text-base font-bold">{routineMap.get(s.routineId) ?? "Rutina"}</h3>
                    <p className="text-xs text-muted-foreground">{format(s.startedAt, "EEE d MMM, HH:mm", { locale: es })}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-lg font-bold text-primary">{volume}</p>
                    <p className="text-xs text-muted-foreground">reps · RPE {avgRpe}</p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {logs.length} {logs.length === 1 ? "serie" : "series"} completadas
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}