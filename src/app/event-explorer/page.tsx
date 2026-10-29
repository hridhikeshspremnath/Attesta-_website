"use client";
// src/app/event-explorer/page.tsx
// Attesta â€” Event Explorer, matched to the reference image.
// Black canvas, navy panel + cards, dense small type. Tailwind only; no new dependencies.

import { useMemo, useState, type ReactNode } from "react";
/* ------------------------- types + tokens ------------------------- */

type Severity = "High" | "Medium" | "Info";

type Evidence = { label: string; value: string; href?: string };

type EventItem = {
  id: string;
  time: string;
  workload: string;
  event: string;
  source: string;
  severity: Severity;
  note: string;
  ids: { event: string; request: string; trace: string };
  evidence: Evidence[];
};

const SEVERITY_TEXT: Record<Severity, string> = {
  High: "text-red-400",
  Medium: "text-amber-400",
  Info: "text-slate-400",
};

const MUTED = "text-slate-400";
const DIVIDER = "border-white/[0.06]";

/* ----------------------------- data ----------------------------- */

const TOTAL_EVENTS = 214;

const EVENTS: EventItem[] = [
  {
    id: "e1", time: "14:02:11", workload: "build-runner-1842", event: "Read protected secret denied",
    source: "OPA", severity: "High",
    note: "Observed: request denied. Interpretation: possible misuse, unconfirmed.",
    ids: { event: "[evt-id]", request: "[req-id]", trace: "[trace-id]" },
    evidence: [
      { label: "OPA rule", value: "secrets.read v7", href: "/access-policies" },
      { label: "Workload and SVID", value: "build-runner-1842", href: "/workload-identity" },
      { label: "Trust decision", value: "Review", href: "/trust-decisions" },
      { label: "GitHub run", value: "#1842", href: "/pipeline-runs" },
      { label: "Runtime alert", value: "Credential access", href: "/runtime-monitoring" },
      { label: "Signed record", value: "tx [ID]", href: "/trust-ledger" },
    ],
  },
  {
    id: "e2", time: "14:02:14", workload: "build-runner-1842", event: "Credential access alert",
    source: "Runtime", severity: "High",
    note: "Observed: process read a credential path. Interpretation: needs correlation with the denied request.",
    ids: { event: "[evt-id]", request: "[req-id]", trace: "[trace-id]" },
    evidence: [
      { label: "Runtime rule", value: "cred-path-read", href: "/runtime-monitoring" },
      { label: "Workload and SVID", value: "build-runner-1842", href: "/workload-identity" },
      { label: "GitHub run", value: "#1842", href: "/pipeline-runs" },
    ],
  },
  {
    id: "e3", time: "14:01:52", workload: "build-runner-1842", event: "Dependency flagged by model",
    source: "ML model", severity: "Medium",
    note: "Observed: package scored suspicious. A score with evidence, not a confirmed verdict.",
    ids: { event: "[evt-id]", request: "[req-id]", trace: "[trace-id]" },
    evidence: [
      { label: "Package", value: "[package-a]@[ver]", href: "/pipeline-runs" },
      { label: "Trust decision", value: "Review", href: "/trust-decisions" },
      { label: "GitHub run", value: "#1842", href: "/pipeline-runs" },
    ],
  },
  {
    id: "e4", time: "14:01:48", workload: "deploy-runner-1841", event: "SVID issued",
    source: "Attestation", severity: "Info",
    note: "Observed: short-lived identity issued after attestation passed.",
    ids: { event: "[evt-id]", request: "[req-id]", trace: "[trace-id]" },
    evidence: [
      { label: "Workload and SVID", value: "deploy-runner-1841", href: "/workload-identity" },
      { label: "Trust decision", value: "Allowed", href: "/trust-decisions" },
    ],
  },
  {
    id: "e5", time: "14:00:38", workload: "test-runner-1840", event: "Attestation failed",
    source: "Attestation", severity: "High",
    note: "Observed: workload attestation did not verify. Interpretation: identity not issued.",
    ids: { event: "[evt-id]", request: "[req-id]", trace: "[trace-id]" },
    evidence: [
      { label: "Workload and SVID", value: "test-runner-1840", href: "/workload-identity" },
      { label: "Trust decision", value: "Rejected", href: "/trust-decisions" },
    ],
  },
  {
    id: "e6", time: "13:58:02", workload: "build-runner-1839", event: "Trust gate sent to review",
    source: "Trust gate", severity: "Medium",
    note: "Observed: additional evidence required before the run can continue.",
    ids: { event: "[evt-id]", request: "[req-id]", trace: "[trace-id]" },
    evidence: [
      { label: "Trust decision", value: "Review", href: "/trust-decisions" },
      { label: "GitHub run", value: "#1839", href: "/pipeline-runs" },
    ],
  },
  {
    id: "e7", time: "13:55:19", workload: "build-runner-1838", event: "Decision signed Â· tx recorded",
    source: "Ledger", severity: "Info",
    note: "Observed: decision signed and written to the trust ledger.",
    ids: { event: "[evt-id]", request: "[req-id]", trace: "[trace-id]" },
    evidence: [
      { label: "Signed record", value: "tx [ID]", href: "/trust-ledger" },
      { label: "GitHub run", value: "#1838", href: "/pipeline-runs" },
    ],
  },
];

const SEVERITY_OPTIONS = ["any", "High", "Medium", "Info"];
const SOURCE_OPTIONS = ["any", ...Array.from(new Set(EVENTS.map((e) => e.source)))];
const WORKLOAD_OPTIONS = ["any", ...Array.from(new Set(EVENTS.map((e) => e.workload)))];

/* --------------------------- filtering --------------------------- */

type Filters = { query: string; severity: string; source: string; workload: string };

function matchesFilters(e: EventItem, f: Filters): boolean {
  if (f.severity !== "any" && e.severity !== f.severity) return false;
  if (f.source !== "any" && e.source !== f.source) return false;
  if (f.workload !== "any" && e.workload !== f.workload) return false;
  const q = f.query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [e.time, e.workload, e.event, e.source, e.severity, ...Object.values(e.ids),
    ...e.evidence.map((x) => `${x.label} ${x.value}`)].join(" ").toLowerCase();
  return haystack.includes(q);
}

function nextOption(options: string[], current: string): string {
  return options[(options.indexOf(current) + 1) % options.length];
}

/* --------------------------- primitives --------------------------- */

function OutlineChip({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-amber-400 px-2.5 py-0.5 text-[10px] font-medium text-amber-300">{children}</span>
  );
}

function IconButton({ label, children }: { label: string; children: ReactNode }) {
  return (
    <button
      aria-label={label}
      className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/5 text-zinc-300 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 motion-reduce:transition-none"
    >
      {children}
    </button>
  );
}

const FOCUS = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400";

/* ----------------------------- header ----------------------------- */

function TopBar() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/5 bg-[#0a0d14] px-4 py-3">
      <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-100">
        <span className="font-medium">Company health overview</span>
        <span className="text-xs text-zinc-500">Â· Thu, 26 Feb 2026</span>
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

function PageTitle() {
  return (
    <div className="flex items-center justify-between gap-3">
      <h1 className="text-xl font-bold tracking-tight text-white">Event Explorer</h1>
      <OutlineChip>Sample data</OutlineChip>
    </div>
  );
}

/* --------------------------- search + filters --------------------------- */

function SearchBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search events, IDs, SPIFFE IDs, rulesâ€¦"
      aria-label="Search events, IDs, SPIFFE IDs and rules"
      className={`h-11 w-full rounded-lg border border-white/5 bg-[#0e1a30] px-4 text-xs text-slate-200 placeholder:text-slate-500 ${FOCUS}`}
    />
  );
}

const CHIP = "rounded-full border border-sky-300/30 px-3 py-1 text-[11px] font-medium text-slate-100";

function CycleChip({ name, value, onClick }: { name: string; value: string; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-label={`${name}: ${value}. Activate to change`} className={`${CHIP} transition hover:bg-white/5 motion-reduce:transition-none ${FOCUS}`}>
      {name}: {value}
    </button>
  );
}

function FilterBar({ filters, onChange }: { filters: Filters; onChange: (f: Filters) => void }) {
  const [saved, setSaved] = useState(false);
  const cycle = (key: "severity" | "source" | "workload", options: string[]) =>
    onChange({ ...filters, [key]: nextOption(options, filters[key]) });
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={CHIP}>Last 24 h</span>
      <CycleChip name="Severity" value={filters.severity} onClick={() => cycle("severity", SEVERITY_OPTIONS)} />
      <CycleChip name="Source" value={filters.source} onClick={() => cycle("source", SOURCE_OPTIONS)} />
      <CycleChip name="Workload" value={filters.workload} onClick={() => cycle("workload", WORKLOAD_OPTIONS)} />
      <span className={CHIP}>Run ID</span>
      <span className={CHIP}>Request ID</span>
      <button
        onClick={() => setSaved(true)}
        className={`ml-auto text-xs font-medium text-cyan-300 hover:underline ${FOCUS}`}
      >
        {saved ? "Filter saved" : "Save filter"}
      </button>
    </div>
  );
}

/* ------------------------------- table ------------------------------- */

function EventRow({ e, selected, onSelect }: { e: EventItem; selected: boolean; onSelect: () => void }) {
  return (
    <tr
      tabIndex={0}
      aria-selected={selected}
      onClick={onSelect}
      onKeyDown={(ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); onSelect(); } }}
      className={`cursor-pointer border-t transition motion-reduce:transition-none ${DIVIDER} ${FOCUS} ${
        selected ? "bg-[#1b2c52]" : "hover:bg-white/[0.03]"
      }`}
    >
      <td className={`whitespace-nowrap px-4 py-3 font-mono text-[11px] ${MUTED}`}>{e.time}</td>
      <td className="whitespace-nowrap px-3 py-3 font-mono text-[11px] font-bold text-white">{e.workload}</td>
      <td className="px-3 py-3 text-xs font-medium text-white">{e.event}</td>
      <td className={`whitespace-nowrap px-3 py-3 text-xs ${MUTED}`}>{e.source}</td>
      <td className={`whitespace-nowrap px-3 py-3 pr-4 text-xs font-medium ${SEVERITY_TEXT[e.severity]}`}>{e.severity}</td>
    </tr>
  );
}

function EventTable({ rows, selectedId, onSelect }: { rows: EventItem[]; selectedId: string; onSelect: (id: string) => void }) {
  return (
    <section className="overflow-hidden rounded-lg border border-white/5 bg-[#0e1a30]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[660px] text-left">
          <thead>
            <tr className={`text-xs ${MUTED}`}>
              {["Time", "Workload", "Event", "Source", "Severity"].map((h, i) => (
                <th key={h} scope="col" className={`py-3 font-normal ${i === 0 ? "px-4" : "px-3"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => <EventRow key={e.id} e={e} selected={e.id === selectedId} onSelect={() => onSelect(e.id)} />)}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && <p className={`px-4 py-6 text-center text-xs ${MUTED}`}>No events match these filters.</p>}
      <p className={`px-4 py-3 text-[10px] ${MUTED}`}>{rows.length} of {TOTAL_EVENTS} events Â· live tail on</p>
    </section>
  );
}

/* ----------------------------- detail panel ----------------------------- */

function KeyValue({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 text-xs">
      <dt className={MUTED}>{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}

function EvidenceValue({ ev }: { ev: Evidence }) {
  const cls = "font-medium text-cyan-300";
  return ev.href ? <a href={ev.href} className={`${cls} hover:underline ${FOCUS}`}>{ev.value}</a> : <span className={cls}>{ev.value}</span>;
}

function DetailActions({ e }: { e: EventItem }) {
  const [copied, setCopied] = useState(false);
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/event-explorer#${e.id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };
  const btn = `rounded-md border border-sky-300/30 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/5 motion-reduce:transition-none ${FOCUS}`;
  return (
    <div className="mt-4 flex gap-2">
      <a href="/incidents" className={btn}>Open incident</a>
      <button onClick={copyLink} className={btn}>{copied ? "Copied" : "Copy link"}</button>
    </div>
  );
}

function EventDetail({ e }: { e: EventItem | undefined }) {
  if (!e) {
    return (
      <aside className="rounded-lg border border-white/5 bg-[#0e1a30] p-4 text-xs text-slate-400">
        Select an event to see its evidence.
      </aside>
    );
  }
  return (
    <aside aria-live="polite" className="rounded-lg border border-white/5 bg-[#0e1a30] p-4">
      <h2 className="text-xs font-bold text-white">{e.event}</h2>
      <p className={`mt-1.5 text-[10px] leading-relaxed ${MUTED}`}>{e.note}</p>
      <dl className="mt-3">
        <KeyValue label="Event ID"><span className="font-mono font-bold text-white">{e.ids.event}</span></KeyValue>
        <KeyValue label="Request ID"><span className="font-mono font-bold text-white">{e.ids.request}</span></KeyValue>
        <KeyValue label="Trace ID"><span className="font-mono font-bold text-white">{e.ids.trace}</span></KeyValue>
      </dl>
      <h3 className="mt-3 text-xs font-bold text-white">Correlated evidence</h3>
      <dl className="mt-1">
        {e.evidence.map((ev) => (
          <KeyValue key={ev.label} label={ev.label}><EvidenceValue ev={ev} /></KeyValue>
        ))}
      </dl>
      <DetailActions e={e} />
    </aside>
  );
}

/* --------------------------------- page --------------------------------- */


const INITIAL_FILTERS: Filters = { query: "", severity: "any", source: "any", workload: "any" };

export default function EventExplorerPage() {
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [selectedId, setSelectedId] = useState(EVENTS[0].id);
  const rows = useMemo(() => EVENTS.filter((e) => matchesFilters(e, filters)), [filters]);
  const selected = rows.find((e) => e.id === selectedId) ?? rows[0];

  return (
    <div className="min-h-full bg-black p-4 sm:p-6">
      <div className="mx-auto max-w-[1200px] space-y-4">
        <TopBar />
        <div className="space-y-3 rounded-xl bg-[#0b1426] p-4 sm:p-6">
          <PageTitle />
          <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
            <div className="min-w-0 space-y-3">
              <SearchBox value={filters.query} onChange={(query) => setFilters({ ...filters, query })} />
              <FilterBar filters={filters} onChange={setFilters} />
              <EventTable rows={rows} selectedId={selected?.id ?? ""} onSelect={setSelectedId} />
            </div>
            <EventDetail e={selected} />
          </div>
        </div>
      </div>
    </div>
  );
}