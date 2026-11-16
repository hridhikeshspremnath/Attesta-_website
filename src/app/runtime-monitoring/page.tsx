"use client";
// src/app/runtime-monitoring/page.tsx
// Attesta â€” Runtime Monitoring (runtime agent audit events).
// Tailwind only; no new dependencies.

import { useMemo, useState, type ReactNode } from "react";
import PageHeader from "@/src/components/ui/PageHeader";
import {
  Badge, Button, EmptyState, SampleBadge, SearchField, SortHeader, useSort, type Tone,
} from "@/src/components/ui/primitives";
import { downloadFile, toCsv } from "@/src/lib/download";

/* ------------------------- types + tokens ------------------------- */

type Severity = "High" | "Medium" | "Low";

type AuditEvent = {
  id: number; time: string; action: string; severity: Severity;
  user: string; details: string; comm: string; status: string;
};

type Template = Omit<AuditEvent, "id" | "time" | "details"> & { detail: (h: string) => string };
type Slice = { label: string; value: number; color: string };

const SEVERITIES: Severity[] = ["High", "Medium", "Low"];
const SEVERITY_COLOR: Record<Severity, string> = { High: "var(--critical)", Medium: "var(--warning)", Low: "var(--info)" };
const SEVERITY_TONE: Record<Severity, Tone> = { High: "crit", Medium: "warn", Low: "neutral" };
const SEVERITY_RANK: Record<Severity, number> = { High: 2, Medium: 1, Low: 0 };
const LIMITS = [25, 50, 100, 500];

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

const CSV_COLUMNS = ["Time", "Action", "Severity", "User", "Details", "Comm", "Status"];

function eventsToCsv(rows: AuditEvent[]): string {
  return toCsv(CSV_COLUMNS, rows.map((e) => [e.time, e.action, e.severity, e.user, e.details, e.comm, e.status]));
}

/* ------------------------------ filter rail ------------------------------ */

function FilterButton({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className="chip w-full justify-between">
      <span className="truncate">{label}</span>
      <span className="tabnum">{count}</span>
    </button>
  );
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-2xs font-medium text-muted">{title}</h3>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-1">{children}</div>
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
    <aside aria-label="Filters" className="card min-w-0 space-y-5 self-start p-4">
      <h2 className="text-base font-semibold text-fg">Filters</h2>
      <div>
        <label htmlFor="event-limit" className="field-label">Maximum events</label>
        <select
          id="event-limit"
          value={filters.limit}
          onChange={(e) => onChange({ ...filters, limit: Number(e.target.value) })}
          className="field"
        >
          {LIMITS.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
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
  return (
    <path d={`M100 100 L${x1} ${y1} A100 100 0 ${large} 1 ${x2} ${y2} Z`} fill={slice.color} stroke="var(--surface)" strokeWidth="2">
      <title>{`${slice.label}: ${slice.value}`}</title>
    </path>
  );
}

function Pie({ slices, label }: { slices: Slice[]; label: string }) {
  const live = slices.filter((s) => s.value > 0);
  const total = live.reduce((n, s) => n + s.value, 0);
  let angle = 0;
  return (
    <svg viewBox="0 0 200 200" role="img" aria-label={label} className="h-24 w-24 shrink-0">
      {total === 0 && <circle cx="100" cy="100" r="100" fill="var(--surface-elevated)" />}
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
    <ul className="min-w-0 flex-1 space-y-1.5 text-xs text-fg">
      {slices.map((s) => (
        <li key={s.label} className="flex items-center gap-2">
          <span aria-hidden className="h-2 w-2 shrink-0 rounded-sm" style={{ background: s.color }} />
          <span className="flex-1 truncate">{s.label}</span>
          <span className="tabnum text-muted">{s.value}</span>
        </li>
      ))}
    </ul>
  );
}

function ChartCard({ title, slices }: { title: string; slices: Slice[] }) {
  return (
    <section className="card min-w-0 p-4">
      <h3 className="mb-3 text-sm font-semibold text-fg">{title}</h3>
      <div className="flex items-center gap-5">
        <Pie slices={slices} label={`${title}: ${slices.map((s) => `${s.label} ${s.value}`).join(", ")}`} />
        <Legend slices={slices} />
      </div>
    </section>
  );
}

function Charts({ rows }: { rows: AuditEvent[] }) {
  const sev = countBy(rows, (e) => e.severity);
  const severitySlices: Slice[] = SEVERITIES.map((s) => ({ label: s, value: sev.get(s) ?? 0, color: SEVERITY_COLOR[s] }));
  const active = AGENTS.filter((a) => a.active).length;
  const agentSlices: Slice[] = [
    { label: "Active", value: active, color: "var(--success)" },
    { label: "Inactive", value: AGENTS.length - active, color: "var(--critical)" },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ChartCard title="Events by severity" slices={severitySlices} />
      <ChartCard title="Runtime agents" slices={agentSlices} />
    </div>
  );
}

/* ------------------------------- table ------------------------------- */

const ACTION_TONE: Record<string, Tone> = {
  delete:  "crit",
  exec:    "crit",
  connect: "warn",
  read:    "warn",
};

function EventRow({ e }: { e: AuditEvent }) {
  return (
    <tr>
      <td className="tabnum whitespace-nowrap font-mono text-2xs text-muted">{e.time}</td>
      <td><Badge tone={ACTION_TONE[e.action] ?? "neutral"}>{e.action}</Badge></td>
      <td><Badge tone={SEVERITY_TONE[e.severity]}>{e.severity}</Badge></td>
      <td className="text-muted">{e.user}</td>
      <td className="max-w-[280px]"><span className="block truncate text-fg" title={e.details}>{e.details}</span></td>
      <td className="font-mono text-2xs text-muted">{e.comm}</td>
      <td className="whitespace-nowrap text-muted">{e.status}</td>
    </tr>
  );
}

type SortKey = "time" | "action" | "severity" | "comm";

const SORT_ACCESSORS: Record<SortKey, (e: AuditEvent) => string | number> = {
  time:     (e) => e.time,
  action:   (e) => e.action,
  severity: (e) => SEVERITY_RANK[e.severity],
  comm:     (e) => e.comm,
};

function EventTable({ rows, onReset }: { rows: AuditEvent[]; onReset: () => void }) {
  const { sorted, sort, toggle } = useSort(rows, SORT_ACCESSORS, { key: "time", dir: "desc" });
  return (
    <div className="card min-w-0 overflow-hidden">
      <div className="max-h-[520px] overflow-auto">
        <table className="data-table min-w-[880px]">
          <thead className="sticky top-0 z-10 bg-card">
            <tr>
              <SortHeader label="Time" sortKey="time" sort={sort} onSort={toggle} />
              <SortHeader label="Action" sortKey="action" sort={sort} onSort={toggle} />
              <SortHeader label="Severity" sortKey="severity" sort={sort} onSort={toggle} />
              <th scope="col">User</th>
              <th scope="col">Details</th>
              <SortHeader label="Comm" sortKey="comm" sort={sort} onSort={toggle} />
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>{sorted.map((e) => <EventRow key={e.id} e={e} />)}</tbody>
        </table>
        {rows.length === 0 && (
          <EmptyState title="No events match these filters" action={<Button size="sm" onClick={onReset}>Reset filters</Button>} />
        )}
      </div>
      <p className="border-t border-line px-5 py-3 text-2xs text-muted">{rows.length} sample events Â· snapshot {SNAPSHOT_TIME}</p>
    </div>
  );
}

/* ------------------------------ toolbar ------------------------------ */

function Toolbar({
  query, onQuery, onCsv, onJson,
}: { query: string; onQuery: (v: string) => void; onCsv: () => void; onJson: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <h2 className="mr-1 text-base font-semibold text-fg">Audit events</h2>
      <SearchField
        value={query}
        onChange={onQuery}
        placeholder="Search visible rowsâ€¦"
        label="Search visible rows"
        className="min-w-[180px] flex-1"
      />
      <Button disabled title="Runtime agent feed not connected">Refresh</Button>
      <Button onClick={onCsv}>Export CSV</Button>
      <Button onClick={onJson}>Export JSON</Button>
    </div>
  );
}

/* --------------------------------- page --------------------------------- */

const INITIAL: Filters = { limit: 500, severity: "All", activity: "All", query: "" };
const SNAPSHOT_TIME = "2026-02-26 14:08:22";

export default function RuntimeMonitoringPage() {
  const [filters, setFilters] = useState<Filters>(INITIAL);

  const base = useMemo(() => EVENTS.slice(0, filters.limit), [filters.limit]);
  const rows = useMemo(() => applyFilters(base, filters), [base, filters]);

  return (
    <div className="page">
      <PageHeader
        title="Runtime Monitoring"
        subtitle="eBPF and kernel audit telemetry from build runners"
        badges={<SampleBadge />}
      />

      <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <FilterRail base={base} filters={filters} onChange={setFilters} />
        <div className="min-w-0 space-y-4">
          <Toolbar
            query={filters.query}
            onQuery={(query) => setFilters({ ...filters, query })}
            onCsv={() => downloadFile("runtime-events-sample.csv", "text/csv", eventsToCsv(rows))}
            onJson={() => downloadFile("runtime-events-sample.json", "application/json", JSON.stringify(rows, null, 2))}
          />
          <Charts rows={rows} />
          <EventTable rows={rows} onReset={() => setFilters(INITIAL)} />
        </div>
      </div>
    </div>
  );
}
