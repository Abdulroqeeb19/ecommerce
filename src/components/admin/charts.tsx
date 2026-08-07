"use client";

import { cx } from "@/lib/utils";

export interface BarDatum {
  label: string;
  value: number;
  secondary?: string;
  hint?: string;
}

export function TrendBars({ data, height = 160, color = "bg-primary-500" }: { data: BarDatum[]; height?: number; color?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="group relative flex-1 flex flex-col justify-end h-full" title={d.hint}>
          <div
            className={cx("w-full rounded-t transition-colors", color)}
            style={{ height: `${Math.max(d.value > 0 ? 3 : 0, (d.value / max) * 100)}%`, minHeight: d.value > 0 ? 4 : 0 }}
          />
          <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 whitespace-nowrap rounded bg-slateink px-2 py-1 text-[10px] font-semibold text-white opacity-0 shadow group-hover:opacity-100 z-10">
            {d.hint || d.label}: {d.secondary || d.value}
          </div>
        </div>
      ))}
    </div>
  );
}

export function TrendChart({ data }: { data: BarDatum[] }) {
  return (
    <div>
      <TrendBars data={data} />
      <div className="mt-2 flex justify-between text-[10px] font-medium text-slate-400 dark:text-slate-500">
        <span>{data[0]?.label}</span>
        <span>{data[Math.floor((data.length - 1) / 2)]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}

export interface Slice {
  label: string;
  value: number;
  color: string;
}

export function Donut({ slices, size = 180, thickness = 26 }: { slices: Slice[]; size?: number; thickness?: number }) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={thickness} className="text-slate-100 dark:text-slate-800" />
      {total > 0 &&
        slices.map((s, i) => {
          const frac = s.value / total;
          const dash = frac * c;
          const el = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={thickness}
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          );
          offset += dash;
          return el;
        })}
    </svg>
  );
}

export function Legend({ items }: { items: { label: string; value: number; color: string; extra?: string }[] }) {
  const total = items.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <ul className="space-y-2">
      {items.map((it) => (
        <li key={it.label} className="flex items-center gap-2.5 text-sm">
          <span className="h-3 w-3 rounded-sm shrink-0" style={{ background: it.color }} />
          <span className="flex-1 font-medium text-slate-600 dark:text-slate-300 capitalize truncate">{it.label}</span>
          <span className="font-bold text-slateink dark:text-white">{it.value}</span>
          <span className="text-xs text-slate-400 dark:text-slate-500 w-10 text-right">{Math.round((it.value / total) * 100)}%</span>
          {it.extra && <span className="text-xs text-slate-400 dark:text-slate-500">{it.extra}</span>}
        </li>
      ))}
    </ul>
  );
}

export function HBarRow({ label, value, max, color, hint }: { label: string; value: number; max: number; color: string; hint?: string }) {
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="font-semibold text-slateink dark:text-white truncate max-w-[70%]">{label}</span>
        <span className="text-slate-500 dark:text-slate-400">{hint || value}</span>
      </div>
      <div className="mt-1.5 h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${max > 0 ? (value / max) * 100 : 0}%`, background: color }} />
      </div>
    </div>
  );
}

export function Pie({ slices, size = 200, showLabels = false }: { slices: Slice[]; size?: number; showLabels?: boolean }) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  const r = size / 2;
  const cx = r;
  const cy = r;

  const bounds = slices.reduce<number[]>((acc, s) => [...acc, (acc.length ? acc[acc.length - 1] : 0) + s.value], []);
  const arcs = slices.map((s, i) => {
    const cumulative = i > 0 ? bounds[i - 1] : 0;
    const startAngle = (cumulative / Math.max(total, 1)) * 2 * Math.PI - Math.PI / 2;
    const endAngle = (bounds[i] / Math.max(total, 1)) * 2 * Math.PI - Math.PI / 2;
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    const startX = cx + r * Math.cos(startAngle);
    const startY = cy + r * Math.sin(startAngle);
    const endX = cx + r * Math.cos(endAngle);
    const endY = cy + r * Math.sin(endAngle);
    return { s, startX, startY, endX, endY, largeArc, startAngle, endAngle };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      {total === 0 && <circle cx={cx} cy={cy} r={r} fill="#e2e8f0" />}
      {arcs.map(({ s, startX, startY, endX, endY, largeArc, endAngle }, i) => {
        const label = showLabels && total > 0 && s.value / total > 0.06;
        const midAngle = endAngle - (s.value / Math.max(total, 1)) * Math.PI;
        const lx = cx + r * 0.62 * Math.cos(midAngle);
        const ly = cy + r * 0.62 * Math.sin(midAngle);
        return (
          <g key={i}>
            <path
              d={`M ${cx} ${cy} L ${startX} ${startY} A ${r} ${r} 0 ${largeArc} 1 ${endX} ${endY} Z`}
              fill={s.color}
              stroke="white"
              strokeWidth="1.5"
              className="dark:opacity-90"
            />
            {label && (
              <text x={lx} y={ly + 3} textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff" pointerEvents="none">
                {Math.round((s.value / total) * 100)}%
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function RevenueDayChart({
  points,
  height = 240,
  format = (n: number) => String(n)
}: {
  points: { label: string; value: number }[];
  height?: number;
  format?: (n: number) => string;
}) {
  const W = 640;
  const H = height;
  const PAD = { top: 18, right: 16, bottom: 30, left: 52 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const max = Math.max(1, ...points.map((p) => p.value));
  const n = Math.max(1, points.length);
  const step = innerW / n;
  const barW = Math.min(step * 0.55, 46);

  const bars = points.map((p, i) => {
    const x = PAD.left + i * step;
    const h = (p.value / max) * innerH;
    return { ...p, x, barH: h, barY: PAD.top + innerH - h, centerX: x + step / 2, i };
  });

  const trendY = (v: number) => PAD.top + innerH - (v / max) * innerH;
  const linePath = bars.map((b, i) => `${i === 0 ? "M" : "L"} ${b.centerX} ${trendY(b.value)}`).join(" ");
  const areaPath = `${linePath} L ${bars[bars.length - 1].centerX} ${PAD.top + innerH} L ${bars[0].centerX} ${PAD.top + innerH} Z`;

  const grid = [0, 0.25, 0.5, 0.75, 1].map((f) => ({ y: PAD.top + innerH - f * innerH, v: max * f }));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Revenue by day of week">
      {grid.map((g, i) => (
        <g key={i}>
          <line x1={PAD.left} x2={W - PAD.right} y1={g.y} y2={g.y} stroke="#e2e8f0" strokeWidth="1" className="dark:stroke-slate-700" />
          <text x={PAD.left - 8} y={g.y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">
            {format(Math.round(g.v))}
          </text>
        </g>
      ))}
      <path d={areaPath} fill="#3b82f6" opacity="0.12" />
      {bars.map((b) => (
        <rect
          key={b.i}
          x={b.x + (step - barW) / 2}
          y={b.barY}
          width={barW}
          height={b.barH}
          rx={4}
          fill={b.value > 0 ? "#3b82f6" : "#cbd5e1"}
          className={b.value > 0 ? "dark:fill-primary-500" : "dark:fill-slate-700"}
        >
          <title>{`${b.label}: ${format(b.value)}`}</title>
        </rect>
      ))}
      <path d={linePath} fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {bars.map((b) => (
        <circle key={b.i} cx={b.centerX} cy={trendY(b.value)} r="3.5" fill="#ef4444" stroke="#fff" strokeWidth="1.5" />
      ))}
      {bars.map((b) => (
        <text key={b.i} x={b.centerX} y={H - 10} textAnchor="middle" fontSize="10.5" fontWeight="600" fill="#94a3b8">
          {b.label}
        </text>
      ))}
    </svg>
  );
}
