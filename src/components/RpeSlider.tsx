import { Slider } from "@/components/ui/slider";

const labels: Record<number, string> = {
  1: "Muy fácil",
  2: "Fácil",
  3: "Cómodo",
  4: "Moderado",
  5: "Algo duro",
  6: "Duro",
  7: "Muy duro",
  8: "Casi al fallo",
  9: "Al fallo",
  10: "Máximo",
};

function rpeColor(rpe: number) {
  if (rpe <= 4) return "text-success";
  if (rpe <= 7) return "text-chart-3";
  return "text-destructive";
}

export function RpeSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">RPE</span>
        <span className={`font-display text-base font-bold ${rpeColor(value)}`}>
          {value} · {labels[value]}
        </span>
      </div>
      <Slider
        min={1}
        max={10}
        step={1}
        value={[value]}
        onValueChange={(v) => onChange(v[0] ?? value)}
      />
    </div>
  );
}