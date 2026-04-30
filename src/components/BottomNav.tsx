import { Link, useLocation } from "@tanstack/react-router";
import { Dumbbell, ListChecks, History, BarChart3 } from "lucide-react";

const items = [
  { to: "/", label: "Hoy", Icon: Dumbbell },
  { to: "/rutinas", label: "Rutinas", Icon: ListChecks },
  { to: "/historial", label: "Historial", Icon: History },
  { to: "/dashboard", label: "Progreso", Icon: BarChart3 },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav
      className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 border-t border-border bg-surface/95 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-4">
        {items.map(({ to, label, Icon }) => {
          const active =
            to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <li key={to}>
              <Link
                to={to}
                className={`flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors ${
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${active ? "drop-shadow-[0_0_6px_var(--color-primary)]" : ""}`}
                  strokeWidth={active ? 2.5 : 2}
                />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}