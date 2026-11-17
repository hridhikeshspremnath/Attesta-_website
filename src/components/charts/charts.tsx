// Small SVG charts in the dashboard's own look (glass, glow, theme colours). No chart library:
// each chart is a few dozen lines and takes colours from the CSS tokens, so it follows the theme.
// Animation is CSS only (see globals.css) and is shortened by prefers-reduced-motion.

export type ChartTone = "ok" | "warn" | "crit" | "info" | "accent" | "muted";

export const TONE_COLOR: Record<ChartTone, string> = {
  ok: "var(--success)", warn: "var(--warning)", crit: "var(--critical)",
  info: "var(--info)", accent: "var(--accent)", muted: "var(--text-secondary)",
};

/* ------------------------------- donut ------------------------------- */

export type Slice = { label: string; value: number; tone: ChartTone };

/** Share of each category, with the total in the middle and a legend that works without colour. */
export function Donut({ slices, center, caption }: { slices: Slice[]; center: string; caption: string }) {
  const total = slices.reduce((a, s) => a + s.value, 0);
  const R = 46, C = 2 * Math.PI * R, GAP = total > slices.filter((s) => s.value).length ? 3 : 0;
  let offset = 0;
  return (
    <div className="flex flex-wrap items-center gap-5">
      <svg width="140" height="140" viewBox="0 0 120 120" role="img" aria-label={`${caption}: ${slices.map((s) => `${s.label} ${s.value}`).join(", ")}`} className="shrink-0">
        <circle cx="60" cy="60" r={R} fill="none" stroke="var(--border)" strokeWidth="12" />
        {total > 0 && slices.filter((s) => s.value > 0).map((s) => {
          const len = Math.max(0, (s.value / total) * C - GAP);
          const el = (
            <circle key={s.label} cx="60" cy="60" r={R} fill="none" stroke={TONE_COLOR[s.tone]} strokeWidth="12" strokeLinecap="round"
              strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset} transform="rotate(-90 60 60)"
              className="arc-in" style={{ ["--c" as string]: C, filter: `drop-shadow(0 0 4px ${TONE_COLOR[s.tone]})` }} />
          );
          offset += (s.value / total) * C;
          return el;
        })}
        <text x="60" y="58" textAnchor="middle" fontSize="22" fontWeight="600" fill="var(--text-primary)">{center}</text>
        <text x="60" y="74" textAnchor="middle" fontSize="8" fill="var(--text-secondary)">{caption}</text>
      </svg>
      <ul className="min-w-0 flex-1 space-y-1.5 text-xs">
        {slices.map((s) => (
          <li key={s.label} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-fg"><span aria-hidden className="h-2 w-2 rounded-full" style={{ background: TONE_COLOR[s.tone] }} />{s.label}</span>
            <span className="tabnum font-mono text-muted">{s.value}{total > 0 && <span className="ml-1.5 text-2xs">{Math.round((s.value / total) * 100)}%</span>}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------------------- horizontal bars ---------------------------- */

export type BarRow = { label: string; value: number; tone: ChartTone };

export function HBars({ rows, unit = "" }: { rows: BarRow[]; unit?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label} className="text-xs">
          <div className="mb-1 flex items-center justify-between gap-3">
            <span className="text-fg">{r.label}</span>
            <span className="tabnum font-mono text-muted">{r.value}{unit}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-raised/60" role="img" aria-label={`${r.label}: ${r.value}${unit}`}>
            <div className="bar-grow h-full rounded-full" style={{ width: `${(r.value / max) * 100}%`, background: `linear-gradient(90deg, ${TONE_COLOR[r.tone]}, color-mix(in srgb, ${TONE_COLOR[r.tone]} 55%, transparent))`, boxShadow: `0 0 10px color-mix(in srgb, ${TONE_COLOR[r.tone]} 45%, transparent)` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------- histogram ------------------------------- */

/** Risk scores (0-1000) in ten bins, coloured by policy band so the thresholds are visible. */
export function RiskHistogram({ scores }: { scores: number[] }) {
  const bins = Array.from({ length: 10 }, (_, i) => scores.filter((s) => Math.min(9, Math.floor(s / 100)) === i).length);
  const max = Math.max(1, ...bins);
  const tone = (i: number): ChartTone => (i < 4 ? "ok" : i < 7 ? "warn" : i < 9 ? "info" : "crit"); // LOW <400, MEDIUM <700, HIGH <900, CRITICAL
  const W = 300, H = 120, BW = 24, STEP = 30;
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H + 22}`} className="w-full" role="img" aria-label={`Risk score distribution: ${bins.map((n, i) => `${i * 100}-${i * 100 + 99}: ${n}`).join(", ")}`}>
        {[0.5, 1].map((f) => <line key={f} x1="0" x2={W} y1={H - f * H * 0.9} y2={H - f * H * 0.9} stroke="var(--border)" strokeDasharray="2 4" />)}
        {bins.map((n, i) => {
          const h = (n / max) * H * 0.9;
          return (
            <g key={i}>
              <rect x={i * STEP + 3} y={H - h} width={BW} height={Math.max(h, 1.5)} rx="4" fill={TONE_COLOR[tone(i)]} opacity={n ? 0.9 : 0.25}
                className="bar-rise" style={{ filter: n ? `drop-shadow(0 0 4px ${TONE_COLOR[tone(i)]})` : undefined, animationDelay: `${i * 40}ms` }}>
                <title>{`${i * 100}-${i * 100 + 99}: ${n} artifact${n === 1 ? "" : "s"}`}</title>
              </rect>
              {n > 0 && <text x={i * STEP + 3 + BW / 2} y={H - h - 4} textAnchor="middle" fontSize="9" fill="var(--text-primary)">{n}</text>}
            </g>
          );
        })}
        {[0, 4, 7, 9].map((i) => <text key={i} x={i * STEP + 3} y={H + 14} fontSize="8" fill="var(--text-secondary)">{i * 100}</text>)}
        <text x={W} y={H + 14} textAnchor="end" fontSize="8" fill="var(--text-secondary)">1000</text>
      </svg>
      <p className="mt-1 flex flex-wrap gap-x-3 text-2xs text-muted">
        <span><span style={{ color: TONE_COLOR.ok }}>●</span> Low &lt;400</span><span><span style={{ color: TONE_COLOR.warn }}>●</span> Medium &lt;700</span>
        <span><span style={{ color: TONE_COLOR.info }}>●</span> High &lt;900</span><span><span style={{ color: TONE_COLOR.crit }}>●</span> Critical</span>
      </p>
    </div>
  );
}
