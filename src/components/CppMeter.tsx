import { Gauge } from "lucide-react";
import { cppBand } from "../lib/cpp";

type Props = {
  /** Best cents-per-point value detected in the reply. */
  value: number;
};

/** Meter spans 0 → 3.0¢; band thresholds sit at 1.0 / 1.5 / 2.0. */
const MAX_CPP = 3.0;

/**
 * A colored "value meter" that turns the model's best CPP into an instant,
 * glanceable verdict (EXCELLENT / GOOD / FAIR / POOR).
 */
export function CppMeter({ value }: Props) {
  const band = cppBand(value);
  const pct = Math.max(4, Math.min(100, (value / MAX_CPP) * 100));

  return (
    <div className="mb-3 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-3.5 shadow-inner shadow-black/20 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${band.chip}`}
        >
          <Gauge className="h-3.5 w-3.5" />
          Best value · {band.label}
        </span>
        <div className="text-right leading-none">
          <span
            className="text-2xl font-extrabold tracking-tight"
            style={{ color: band.color }}
          >
            {value.toFixed(1)}¢
          </span>
          <span className="ml-0.5 text-xs font-medium text-gray-400">/pt</span>
        </div>
      </div>

      {/* Meter track */}
      <div className="relative mt-3 h-2.5 w-full rounded-full bg-gradient-to-r from-red-500/70 via-amber-400/70 to-emerald-400/80">
        {/* Threshold ticks at 1.0 / 1.5 / 2.0 ¢ */}
        {[1.0, 1.5, 2.0].map((t) => (
          <span
            key={t}
            className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-white/40"
            style={{ left: `${(t / MAX_CPP) * 100}%` }}
          />
        ))}
        {/* Filled portion with animated sheen */}
        <div
          className="pp-sheen absolute inset-y-0 left-0 overflow-hidden rounded-full"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${band.color}55, ${band.color})`,
            transition: "width 700ms cubic-bezier(0.22,1,0.36,1)",
          }}
        />
        {/* Marker */}
        <span
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-lg ring-2"
          style={{
            left: `${pct}%`,
            boxShadow: `0 0 10px ${band.color}`,
            // @ts-expect-error CSS custom prop for ring color
            "--tw-ring-color": band.color,
            transition: "left 700ms cubic-bezier(0.22,1,0.36,1)",
          }}
        />
      </div>

      <div className="mt-1.5 flex justify-between text-[10px] font-medium text-gray-500">
        <span>Poor</span>
        <span>Fair</span>
        <span>Good</span>
        <span>Excellent</span>
      </div>
      <p className="mt-2 text-xs text-gray-400">{band.blurb}</p>
    </div>
  );
}
