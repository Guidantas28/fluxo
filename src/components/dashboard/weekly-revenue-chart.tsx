"use client";

type Point = { label: string; value: number };

function buildPath(values: number[], w: number, h: number, padY: number) {
  const max = Math.max(...values, 1);
  const n = values.length;
  const step = n > 1 ? w / (n - 1) : 0;
  const pts = values.map((v, i) => {
    const x = n > 1 ? i * step : w / 2;
    const y = padY + (1 - v / max) * (h - padY * 2);
    return { x, y };
  });
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    d += ` L ${pts[i].x} ${pts[i].y}`;
  }
  return { d, pts, fillD: `${d} L ${w} ${h} L 0 ${h} Z` };
}

export function WeeklyRevenueChart({ points }: { points: Point[] }) {
  const values = points.map((p) => p.value);
  const w = 800;
  const h = 200;
  const padY = 24;
  const { d, pts, fillD } = buildPath(values, w, h, padY);

  const total = values.reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Receita semanal</h3>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">
              {total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>
            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-sm font-medium text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              Últimos 7 dias
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Vendas concluídas por dia</p>
        </div>
      </div>
      <div className="relative h-[240px] w-full">
        <svg
          className="h-full w-full overflow-visible text-slate-200 dark:text-slate-700"
          viewBox={`0 0 ${w} ${h}`}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="fluxoChartGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#03487c" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#03487c" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="fluxoChartGradDark" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 50, 100, 150].map((y) => (
            <line
              key={y}
              x1="0"
              x2={w}
              y1={y}
              y2={y}
              className="stroke-current"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          ))}
          <path d={fillD} fill="url(#fluxoChartGrad)" className="dark:hidden" />
          <path d={fillD} fill="url(#fluxoChartGradDark)" className="hidden dark:block" />
          <path
            d={d}
            fill="none"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="stroke-primary dark:stroke-sky-400"
          />
          {pts.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="4" className="fill-primary dark:fill-sky-400" />
          ))}
        </svg>
      </div>
      <div className="mt-4 flex justify-between text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {points.map((p) => (
          <span key={p.label}>{p.label}</span>
        ))}
      </div>
    </div>
  );
}
