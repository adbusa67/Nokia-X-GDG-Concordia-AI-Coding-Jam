import { ReactNode } from "react";
import { Card } from "./Card";

type StatCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  icon?: ReactNode;
  /** Accent color used for the left border and icon (e.g. "#006FCF"). */
  accent?: string;
};

export function StatCard({ title, value, subtitle, icon, accent = "#7C5CFF" }: StatCardProps) {
  return (
    <Card
      className="relative overflow-hidden p-5"
      style={{ borderLeft: `4px solid ${accent}` }}
    >
      {/* Soft accent glow */}
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-20 blur-2xl"
        style={{ backgroundColor: accent }}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-400">{title}</p>
          <p className="mt-1 text-3xl font-extrabold tracking-tight text-white">
            {value}
          </p>
          {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}
        </div>
        {icon && (
          <div
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${accent}22`, color: accent }}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
