"use client";
// src/app/runtime-monitoring/page.tsx
// Attesta — Runtime Monitoring (runtime agent audit events), matched to the reference image.
// Black canvas, navy panel, filter rail + pie charts + event table. Tailwind only; no new dependencies.

import { useMemo, useState, type ReactNode } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";

/* ------------------------- types + tokens ------------------------- */

type Severity = "High" | "Medium" | "Low";

type AuditEvent = {
  id: number; time: string; action: string; severity: Severity;
  user: string; details: string; comm: string; status: string;
};

type Template = Omit<AuditEvent, "id" | "time" | "details"> & { detail: (h: string) => string };
type Slice = { label: string; value: number; color: string };

const SEVERITIES: Severity[] = ["High", "Medium", "Low"];
const SEVERITY_COLOR: Record<Severity, string> = { High: "#ef4444", Medium: "#f59e0b", Low: "#10b981" };
const LIMITS = [25, 50, 100, 500];

const FOCUS = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400";
const FONT = 'Inter, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", system-ui, sans-serif';
const CARD = "rounded-md border border-white/10 bg-[#0d1a33]";

/* ----------------------------- sample data ----------------------------- */

const T = (
  action: string, severity: Severity, comm: string, detail: (h: string) => string, status = "Success",
): Template => ({ action, severity, user: "runner", comm, status, detail });

const TEMPLATES: Template[] = [
  T("mkdir", "Medium", "git", (h) => `Folder created: /home/runner/work/_temp/${h}`),
  T("create", "Low", "npm", (h) => `New file created: /home/runner/work/org/repo/node_modules/.cache/${h}.tmp`),
  T("delete", "High", "node", (h) => `File deleted: /home/runner/work/_temp/_runner_file_commands/${h}`, "errno -21"),
  T("delete", "High", "node", (h) => `File deleted: /home/runner/work/org/repo/.git/objects/${h.slice(0, 2)}/${h}`),
  T("exec", "High", "curl", () => "Process executed: curl -sSf https://[registry]/install.sh"),
  T("connect", "Medium", "node", () => "Outbound connection to [ip]:443 (destination not on allow-list)"),
  T("read", "High", "node", () => "Credential file read: /home/runner/.npmrc"),
  T("read", "High", "node", (h) => `Read of protected path denied: /var/run/secrets/${h}`, "errno -13"),
  T("write", "Medium", "npm", () => "File modified: /home/runner/work/org/repo/package-lock.json"),
  T("rename", "Low", "git", (h) => `File renamed: /home/runner/work/org/repo/.git/${h}.lock`),
  T("symlink", "Low", "npm", (h) => `Symlink created: /home/runner/work/org/repo/node_modules/.bin/${h.slice(0, 8)}`),
  T("start", "Low", "runner", () => "Process started: Runner.Worker"),
  T("stop", "Low", "runner", () => "Process stopped: Runner.Worker"),
  T("rmdir", "Low", "git", (h) => `Folder removed: /home/runner/work/_temp/${h}`),
];

// Weighted pick order (indexes into TEMPLATES) so the mix resembles a real runner.
const PICK_ORDER = [1,1,1,1,1,1,1,0,0,0,0,2,2,3,3,8,8,4,4,5,5,6,6,7,7,9,9,10,11,11,12,13,13];

function lcg(seed: number): () => number {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
}

function buildEvents(count: number): AuditEvent[] {
  const rand = lcg(1842);
  const hex = () => Array.from({ length: 16 }, () => Math.floor(rand() * 16).toString(16)).join("");
  let seconds = 14 * 3600 + 8 * 60 + 22;
  const clock = (s: number) => {
    const p = (n: number) => String(n).padStart(2, "0");
    return `2026-02-26 ${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`;
  };
  return Array.from({ length: count }, (_, i) => {
    if (i > 0 && i % 3 === 0) seconds -= 1;
    const t = TEMPLATES[PICK_ORDER[Math.floor(rand() * PICK_ORDER.length)]];
    return { id: i, time: clock(seconds), action: t.action, severity: t.severity, user: t.user, details: t.detail(hex()), comm: t.comm, status: t.status };
  });
}

const EVENTS: AuditEvent[] = buildEvents(88);
const AGENTS = [
  { id: "agent-build-1842", active: true },
  { id: "agent-deploy-1841", active: true },
  { id: "agent-test-1840", active: false },
];

/* --------------------------- derived data --------------------------- */

function countBy<K extends string>(rows: AuditEvent[], key: (e: AuditEvent) => K): Map<K, number> {
  const m = new Map<K, number>();
  for (const e of rows) m.set(key(e), (m.get(key(e)) ?? 0) + 1);
  return m;
}

type Filters = { limit: number; severity: "All" | Severity; activity: string; query: string };

function applyFilters(rows: AuditEvent[], f: Filters): AuditEvent[] {
  const q = f.query.trim().toLowerCase();
  return rows.filter((e) => {
    if (f.severity !== "All" && e.severity !== f.severity) return false;
    if (f.activity !== "All" && e.action !== f.activity) return false;
    if (!q) return true;
    return `${e.time} ${e.action} ${e.severity} ${e.user} ${e.details} ${e.comm} ${e.status}`.toLowerCase().includes(q);
  });
}

/* ------------------------------ export ------------------------------ */

function download(name: string, mime: string, text: string) {
  try {
    const url = URL.createObjectURL(new Blob([text], { type: mime }));
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  } catch {
    /* download unavailable in this environment */
  }
}

function toCsv(rows: AuditEvent[]): string {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const head = ["Time", "Action", "Severity", "User", "Details", "Comm", "Status"].join(",");
  return [head, ...rows.map((e) => [e.time, e.action, e.severity, e.user, e.details, e.comm, e.status].map(esc).join(","))].join("\n");
}

/* --------------------------- primitives --------------------------- */

function IconButton({ label, children }: { label: string; children: ReactNode }) {
  return (
    <button aria-label={label} className={`grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/5 text-zinc-300 transition hover:bg-white/10 motion-reduce:transition-none ${FOCUS}`}>
      {children}
    </button>
  );
}

function WhiteButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`h-8 rounded-md bg-zinc-100 px-3 text-[11px] font-medium text-slate-900 transition hover:bg-white motion-reduce:transition-none ${FOCUS}`}>
      {children}
    </button>
  );
}

/* ----------------------------- header ----------------------------- */

function TopBar() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/5 bg-[#0a0d14] px-4 py-3">
      <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-100">
        <span className="font-medium">Company health overview</span>
        <span className="text-xs text-zinc-500">· Thu, 26 Feb 2026</span>
        <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-zinc-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> synced 3 min ago
        </span>
      </div>
      <div className="flex items-center gap-2">
        <IconButton label="Security status">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" /></svg>
        </IconButton>
        <IconButton label="Notifications">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 8a6 6 0 1112 0c0 7 3 8 3 8H3s3-1 3-8M10 21h4" /></svg>
        </IconButton>
        <button className={`flex h-8 items-center gap-2 rounded-lg bg-zinc-100 px-3 text-xs font-medium text-zinc-900 transition hover:bg-white motion-reduce:transition-none ${FOCUS}`}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16" /></svg>
          Export
        </button>
      </div>
    </header>
  );
}

/* ------------------------------ filter rail ------------------------------ */

function FilterButton({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`w-full rounded-md border px-3 py-2 text-left text-[11px] transition motion-reduce:transition-none ${FOCUS} ${
        active ? "border-white bg-white font-medium text-slate-900" : "border-white/10 bg-[#1a2845] text-slate-200 hover:bg-[#22345a]"
      }`}
    >
      {label} ({count})
    </button>
  );
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-[10px] text-slate-400">{title}</h3>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">{children}</div>
    </div>
  );
}

function FilterRail({ base, filters, onChange }: { base: AuditEvent[]; filters: Filters; onChange: (f: Filters) => void }) {
  const severityCounts = useMemo(() => countBy(base, (e) => e.severity), [base]);
  const activityCounts = useMemo(
    () => Array.from(countBy(base, (e) => e.action).entries()).sort((a, b) => b[1] - a[1]),
    [base],
  );
  return (
    <aside aria-label="Filters" className="space-y-5 border-b border-white/10 bg-[#0d1730] p-4 lg:max-h-[780px] lg:overflow-y-auto lg:border-b-0 lg:border-r">
      <h2 className="text-xs font-bold text-white">Filters</h2>
      <div>
        <label htmlFor="event-limit" className="mb-1 block text-[10px] text-slate-400">Number of events</label>
        <select
          id="event-limit"
          value={filters.limit}
          onChange={(e) => onChange({ ...filters, limit: Number(e.target.value) })}
          className={`h-8 w-full rounded-md border border-white/10 bg-[#1a2845] px-2 text-[11px] text-slate-200 ${FOCUS}`}
        >
          {LIMITS.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <p className="mt-1 text-[9px] text-slate-500">Server fetch limit</p>
      </div>
      <FilterGroup title="Severity">
        <FilterButton label="All" count={base.length} active={filters.severity === "All"} onClick={() => onChange({ ...filters, severity: "All" })} />
        {SEVERITIES.map((s) => (
          <FilterButton key={s} label={s} count={severityCounts.get(s) ?? 0} active={filters.severity === s} onClick={() => onChange({ ...filters, severity: s })} />
        ))}
      </FilterGroup>
      <FilterGroup title="Activity">
        <FilterButton label="All" count={base.length} active={filters.activity === "All"} onClick={() => onChange({ ...filters, activity: "All" })} />
        {activityCounts.map(([a, n]) => (
          <FilterButton key={a} label={a} count={n} active={filters.activity === a} onClick={() => onChange({ ...filters, activity: a })} />
        ))}
      </FilterGroup>
    </aside>
  );
}

/* ------------------------------ charts ------------------------------ */

function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function PieSlice({ slice, start, end }: { slice: Slice; start: number; end: number }) {
  const [x1, y1] = polar(100, 100, 100, start);
  const [x2, y2] = polar(100, 100, 100, end);
  const large = end - start > 180 ? 1 : 0;
  return <path d={`M100 100 L${x1} ${y1} A100 100 0 ${large} 1 ${x2} ${y2} Z`} fill={slice.color} />;
}

function Pie({ slices, label }: { slices: Slice[]; label: string }) {
  const live = slices.filter((s) => s.value > 0);
  const total = live.reduce((n, s) => n + s.value, 0);
  let angle = 0;
  return (
    <svg viewBox="0 0 200 200" role="img" aria-label={label} className="mx-auto h-[130px] w-[130px]">
      {total === 0 && <circle cx="100" cy="100" r="100" fill="#1a2845" />}
      {live.length === 1 && <circle cx="100" cy="100" r="100" fill={live[0].color} />}
      {live.length > 1 && live.map((s) => {
        const start = angle;
        angle += (s.value / total) * 360;
        return <PieSlice key={s.label} slice={s} start={start} end={angle} />;
      })}
    </svg>
  );
}

function Legend({ slices }: { slices: Slice[] }) {
  return (
    <ul className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[10px] text-slate-200">
      {slices.map((s) => (
        <li key={s.label} className="flex items-center gap-1.5">
          <span aria-hidden className="h-1.5 w-6 rounded-sm" style={{ background: s.color }} />
          {s.label} ({s.value})
        </li>
      ))}
    </ul>
  );
}

function ChartCard({ title, slices }: { title: string; slices: Slice[] }) {
  return (
    <section className={`${CARD} p-3`}>
      <h3 className="mb-2 text-[10px] text-slate-300">{title}</h3>
      <Pie slices={slices} label={`${title} ${slices.map((s) => `${s.label} ${s.value}`).join(", ")}`} />
      <Legend slices={slices} />
    </section>
  );
}

function Charts({ rows }: { rows: AuditEvent[] }) {
  const sev = countBy(rows, (e) => e.severity);
  const severitySlices: Slice[] = SEVERITIES.map((s) => ({ label: s, value: sev.get(s) ?? 0, color: SEVERITY_COLOR[s] }));
  const active = AGENTS.filter((a) => a.active).length;
  const agentSlices: Slice[] = [
    { label: "Active", value: active, color: "#10b981" },
    { label: "Inactive", value: AGENTS.length - active, color: "#ef4444" },
  ];
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <ChartCard title="Events by Severity:" slices={severitySlices} />
      <ChartCard title="Agents:" slices={agentSlices} />
    </div>
  );
}

/* ------------------------------- table ------------------------------- */

const ACTION_BADGE: Record<string, string> = {
  create: "bg-emerald-900/50 text-emerald-300",
  delete: "bg-red-900/40 text-red-300",
  exec: "bg-red-900/40 text-red-300",
  connect: "bg-amber-900/40 text-amber-300",
  read: "bg-amber-900/40 text-amber-300",
};

function EventRow({ e }: { e: AuditEvent }) {
  return (
    <tr className="border-t border-white/[0.06] text-[11px] text-slate-200 hover:bg-white/[0.03]">
      <td className="whitespace-nowrap px-3 py-2.5 font-mono">{e.time}</td>
      <td className="px-3 py-2.5">
        <span className={`rounded-full px-2 py-0.5 text-[9px] font-medium ${ACTION_BADGE[e.action] ?? "bg-slate-700/60 text-slate-300"}`}>{e.action}</span>
      </td>
      <td className="px-3 py-2.5">{e.severity}</td>
      <td className="px-3 py-2.5">{e.user}</td>
      <td className="max-w-[460px] px-3 py-2.5"><span className="block truncate" title={e.details}>{e.details}</span></td>
      <td className="px-3 py-2.5">{e.comm}</td>
      <td className="whitespace-nowrap px-3 py-2.5">{e.status}</td>
    </tr>
  );
}

function EventTable({ rows }: { rows: AuditEvent[] }) {
  return (
    <div className={`${CARD} overflow-hidden`}>
      <div className="max-h-[520px] overflow-auto">
        <table className="w-full min-w-[820px] text-left">
          <thead className="sticky top-0 bg-[#16264a]">
            <tr className="text-[10px] font-bold text-white">
              {["Time", "Action", "Severity", "User", "Details", "Comm", "Status"].map((h) => (
                <th key={h} scope="col" className="px-3 py-2.5">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>{rows.map((e) => <EventRow key={e.id} e={e} />)}</tbody>
        </table>
        {rows.length === 0 && <p className="px-4 py-8 text-center text-xs text-slate-400">No events match these filters.</p>}
      </div>
    </div>
  );
}

/* ------------------------------ toolbar ------------------------------ */

function Toolbar({
  query, onQuery, onRefresh, onCsv, onJson, updated,
}: { query: string; onQuery: (v: string) => void; onRefresh: () => void; onCsv: () => void; onJson: () => void; updated: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <h2 className="text-xs font-bold text-white">Audit Events</h2>
      <input
        type="search"
        value={query}
        onChange={(e) => onQuery(e.target.value)}
        placeholder="Search visible rows"
        aria-label="Search visible rows"
        className={`h-8 min-w-[180px] flex-1 rounded-md border border-white/10 bg-[#0d1a33] px-3 text-[11px] text-slate-200 placeholder:text-slate-500 ${FOCUS}`}
      />
      <WhiteButton onClick={onRefresh}>Refresh</WhiteButton>
      <WhiteButton onClick={onCsv}>CSV</WhiteButton>
      <WhiteButton onClick={onJson}>JSON</WhiteButton>
      <span className="text-[9px] text-slate-500">Last updated: {updated}</span>
    </div>
  );
}

/* --------------------------------- page --------------------------------- */

const INITIAL: Filters = { limit: 500, severity: "All", activity: "All", query: "" };

export default function RuntimeMonitoringPage() {
  const [filters, setFilters] = useState<Filters>(INITIAL);
  const [updated, setUpdated] = useState("2026-02-26 14:08:22");

  const base = useMemo(() => EVENTS.slice(0, filters.limit), [filters.limit]);
  const rows = useMemo(() => applyFilters(base, filters), [base, filters]);

  const refresh = () => setUpdated(new Date().toISOString().replace("T", " ").slice(0, 19));

  return (
    <DashboardLayout>
      <div className="min-h-full bg-black p-4 sm:p-6" style={{ fontFamily: FONT }}>
        <div className="mx-auto max-w-[1280px] space-y-4">
          <TopBar />
          <div className="grid overflow-hidden rounded-xl bg-[#0b1426] lg:grid-cols-[210px_1fr]">
            <FilterRail base={base} filters={filters} onChange={setFilters} />
            <main className="min-w-0 space-y-3 p-4">
              <Toolbar
                query={filters.query}
                onQuery={(query) => setFilters({ ...filters, query })}
                onRefresh={refresh}
                onCsv={() => download("runtime-events.csv", "text/csv", toCsv(rows))}
                onJson={() => download("runtime-events.json", "application/json", JSON.stringify(rows, null, 2))}
                updated={updated}
              />
              <Charts rows={rows} />
              <EventTable rows={rows} />
            </main>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}