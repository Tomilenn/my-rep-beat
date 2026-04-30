import { createFileRoute, Link } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type Routine } from "@/lib/db";
import { ChevronRight, Plus } from "lucide-react";

export const Route = createFileRoute("/rutinas")({
  head: () => ({
    meta: [
      { title: "Rutinas — CalistenIA" },
      { name: "description", content: "Gestiona tus rutinas de calistenia." },
      { property: "og:title", content: "Rutinas — CalistenIA" },
      { property: "og:description", content: "Crea y edita tus rutinas." },
    ],
  }),
  component: RutinasPage,
});

function RutinasPage() {
  const routines = useLiveQuery<Routine[]>(() => db.routines.toArray(), []) ?? [];

  const addRoutine = async () => {
    const name = window.prompt("Nombre de la rutina");
    if (!name) return;
    await db.routines.add({ name, split: "Custom", createdAt: Date.now() });
  };

  return (
    <main className="flex flex-1 flex-col gap-5 px-4 pt-10 pb-8">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Biblioteca
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold">Rutinas</h1>
        </div>
        <button
          type="button"
          onClick={addRoutine}
          className="flex h-11 items-center gap-1.5 rounded-xl bg-primary px-3 text-sm font-bold text-primary-foreground active:scale-[0.97] active:brightness-110"
        >
          <Plus className="h-4 w-4" />
          Nueva
        </button>
      </header>

      <ul className="flex flex-col gap-2">
        {routines.map((r) => (
          <li key={r.id}>
            <Link
              to="/rutinas/$id"
              params={{ id: String(r.id) }}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
            >
              <div>
                <h3 className="font-display text-lg font-bold">{r.name}</h3>
                <p className="text-xs text-muted-foreground">{r.split}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}