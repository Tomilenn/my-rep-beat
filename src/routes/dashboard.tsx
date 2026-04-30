import { createFileRoute } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";
import { db, deleteAllHistory, type SetLog, type Session } from "@/lib/db";
import { VolumeChart } from "@/components/VolumeChart";
import { startOfWeek, format, subWeeks, isSameMonth } from "date-fns";
import { es } from "date-fns/locale";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Progreso — CalistenIA" },
      { name: "description", content: "Visualiza tu volumen semanal y tu sobrecarga progresiva." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const logs = useLiveQuery<SetLog[]>(() => db.setLogs.toArray(), []) ?? [];
  const sessions = useLiveQuery<Session[]>(() => db.sessions.toArray(), []) ?? [];

  const { chartData, currentVol, prevVol, avgRpe, monthSessions } = useMemo(() => {
    const now = new Date();
    const weeks: { start: Date; label: string; volume: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const start = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
      weeks.push({ start, label: format(start, "d MMM", { locale: es }), volume: 0 });
    }
    for (const l of logs) {
      const ws = startOfWeek(l.completedAt, { weekStartsOn: 1 });
      const w = weeks.find((x) => x.start.getTime() === ws.getTime());
      if (w) w.volume += l.reps;
    }
    const cur = weeks[weeks.length - 1]?.volume ?? 0;
    const prev = weeks[weeks.length - 2]?.volume ?? 0;
    const avg = logs.length === 0 ? 0 : logs.reduce((a, l) => a + l.rpe, 0) / logs.length;
    const monthly = sessions.filter((s) => isSameMonth(s.startedAt, now)).length;
    return {
      chartData: weeks.map((w) => ({ week: w.label, volume: w.volume })),
      currentVol: cur, prevVol: prev, avgRpe: avg, monthSessions: monthly,
    };
  }, [logs, sessions]);

  const delta = prevVol === 0 ? null : Math.round(((currentVol - prevVol) / prevVol) * 100);

  const wipe = async () => {
    if (!window.confirm("¿Borrar todo el historial? Esto no se puede deshacer.")) return;
    await deleteAllHistory();
  };

  return (
    <main className="flex flex-1 flex-col gap-5 px-4 pt-10 pb-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Progreso</p>
        <h1 className="mt-1 font-display text-3xl font-bold">Sobrecarga progresiva</h1>
      </header>

      <section className="grid grid-cols-2 gap-3">
        <KPI label="Volumen semana" value={currentVol.toString()} sub="reps totales" />
        <KPI label="vs sem. anterior" value={delta == null ? "—" : `${delta > 0 ? "+" : ""}${delta}%`}
             sub={prevVol ? `${prevVol} reps` : "sin datos"} accent={delta != null && delta >= 0} />
        <KPI label="RPE medio" value={avgRpe ? avgRpe.toFixed(1) : "—"} sub="esfuerzo" />
        <KPI label="Sesiones del mes" value={monthSessions.toString()} sub="entrenamientos" />
      </section>

      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Volumen últimas 8 semanas
        </h2>
        <VolumeChart data={chartData} />
      </section>

      <button type="button" onClick={wipe}
        className="flex h-12 items-center justify-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 text-sm font-semibold text-destructive active:bg-destructive/20">
        <Trash2 className="h-4 w-4" />Borrar todo el historial
      </button>
    </main>
  );
}

function KPI({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1 font-display text-2xl font-bold ${accent ? "text-primary" : ""}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}