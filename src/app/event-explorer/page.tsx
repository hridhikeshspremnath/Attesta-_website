"use client";
// src/app/event-explorer/page.tsx
// Attesta — Event Explorer. Dark fintech SaaS design.

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";

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

const SEVERITY_STYLE: Record<Severity, { text: string; bg: string; border: string }> = {
  High:   { text: "text-red-400",   bg: "bg-red-400/10",   border: "border-red-400/20" },
  Medium: { text: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
  Info:   { text: "text-slate-400", bg: "bg-slate-400/10", border: "border-slate-400/20" },
};

const MUTED   = "text-slate-400";
const DIVIDER = "border-white/[0.06]";
const FOCUS   = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500";

/* ----------------------------- data ----------------------------- */

const TOTAL_EVENTS = 214;

const EVENTS: EventItem[] = [
  {
    id: "e1", time: "14:02:11", workload: "build-runner-1842", event: "Read protected secret denied",
    source: "OPA", severity: "High",
    note: "Observed: request denied. Interpretation: possible misuse, unconfirmed.",
    ids: { event: "[evt-id]", request: "[req-id]", trace: "[trace-id]" },
    evidence: [
      { label: "OPA rule",            value: "secrets.read v7",       href: "/access-policies" },
      { label: "Workload and SVID",   value: "build-runner-1842",     href: "/workload-identity" },
      { label: "Trust decision",      value: "Review",                href: "/access-policies" },
      { label: "GitHub run",          value: "#1842",                 href: "/pipeline-runs" },
      { label: "Runtime alert",       value: "Credential access",     href: "/runtime-monitoring" },
      { label: "Signed record",       value: "tx [ID]",              href: "/trust-ledger" },
    ],
  },
  {
    id: "e2", time: "14:02:14", workload: "build-runner-1842", event: "Credential access alert",
    source: "Runtime", severity: "High",
    note: "Observed: process read a credential path. Interpretation: needs correlation with the denied request.",
    ids: { event: "[evt-id]", request: "[req-id]", trace: "[trace-id]" },
    evidence: [
      { label: "Runtime rule",      value: "cred-path-read",      href: "/runtime-monitoring" },
      { label: "Workload and SVID", value: "build-runner-1842",   href: "/workload-identity" },
      { label: "GitHub run",        value: "#1842",               href: "/pipeline-runs" },
    ],
  },
  {
    id: "e3", time: "14:01:52", workload: "build-runner-1842", event: "Dependency flagged by model",
    source: "ML model", severity: "Medium",
    note: "Observed: package scored suspicious. A score with evidence, not a confirmed verdict.",
    ids: { event: "[evt-id]", request: "[req-id]", trace: "[trace-id]" },
    evidence: [
      { label: "Package",        value: "[package-a]@[ver]", href: "/pipeline-runs" },
      { label: "Trust decision", value: "Review",            href: "/access-policies" },
      { label: "GitHub run",     value: "#1842",             href: "/pipeline-runs" },
    ],
  },
  {
    id: "e4", time: "14:01:48", workload: "deploy-runner-1841", event: "SVID issued",
    source: "Attestation", severity: "Info",
    note: "Observed: short-lived identity issued after attestation passed.",
    ids: { event: "[evt-id]", request: "[req-id]", trace: "[trace-id]" },
    evidence: [
      { label: "Workload and SVID", value: "deploy-runner-1841", href: "/workload-identity" },
      { label: "Trust decision",    value: "Allowed",            href: "/access-policies" },
    ],
  },
  {
    id: "e5", time: "14:00:38", workload: "test-runner-1840", event: "Attestation failed",
    source: "Attestation", severity: "High",
    note: "Observed: workload attestation did not verify. Interpretation: identity not issued.",
    ids: { event: "[evt-id]", request: "[req-id]", trace: "[trace-id]" },
    evidence: [
      { label: "Workload and SVID", value: "test-runner-1840", href: "/workload-identity" },
      { label: "Trust decision",    value: "Rejected",         href: "/access-policies" },
    ],
  },
  {
    id: "e6", time: "13:58:02", workload: "build-runner-1839", event: "Trust gate sent to review",
    source: "Trust gate", severity: "Medium",
    note: "Observed: additional evidence required before the run can continue.",
    ids: { event: "[evt-id]", request: "[req-id]", trace: "[trace-id]" },
    evidence: [
      { label: "Trust decision", value: "Review", href: "/access-policies" },
      { label: "GitHub run",     value: "#1839",  href: "/pipeline-runs" },
    ],
  },
  {
    id: "e7", time: "13:55:19", workload: "build-runner-1838", event: "Decision signed · tx recorded",
    source: "Ledger", severity: "Info",
    note: "Observed: decision signed and written to the trust ledger.",
    ids: { event: "[evt-id]", request: "[req-id]", trace: "[trace-id]" },
    evidence: [
      { label: "Signed record", value: "tx [ID]", href: "/trust-ledger" },
      { label: "GitHub run",    value: "#1838",   href: "/pipeline-runs" },
    ],
  },
];

const SEVERITY_OPTIONS = ["any", "High", "Medium", "Info"];
const SOURCE_OPTIONS   = ["any", ...Array.from(new Set(EVENTS.map((e) => e.source)))];
const WORKLOAD_OPTIONS = ["any", ...Array.from(new Set(EVENTS.map((e) => e.workload)))];

/* --------------------------- filtering --------------------------- */

type Filters = { query: string; severity: string; source: string; workload: string };

function matchesFilters(e: EventItem, f: Filters): boolean {
  if (f.severity !== "any" && e.severity !== f.severity) return false;
  if (f.source   !== "any" && e.source   !== f.source)   return false;
  if (f.workload !== "any" && e.workload !== f.workload)  return false;
  const q = f.query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [e.time, e.workload, e.event, e.source, e.severity, ...Object.values(e.ids),
    ...e.evidence.map((x) => `${x.label} ${x.value}`)].join(" ").toLowerCase();
  return haystack.includes(q);
}

function nextOption(options: string[], current: string): string {
  return options[(options.indexOf(current) + 1) % options.length];
}

/* ---------------------------------- UI ---------------------------------- */

function SeverityBadge({ severity }: { severity: Severity }) {
  const s = SEVERITY_STYLE[severity];
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${s.text} ${s.bg} ${s.border}`}>
      {severity}
    </span>
  );
}

function CycleChip({ name, value, onClick }: { name: string; value: string; onClick: () => void }) {
  const isActive = value !== "any";
  return (
    <button
      onClick={onClick}
      aria-label={`${name}: ${value}. Activate to change`}
      className={`rounded-full border px-3 py-1 text-[11px] font-medium transition hover:bg-white/[0.05] ${FOCUS} ${
        isActive
          ? "border-emerald-400/50 text-emerald-300 bg-emerald-400/5"
          : "border-white/[0.12] text-slate-300"
      }`}
    >
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
      <span className="rounded-full border border-white/[0.12] px-3 py-1 text-[11px] font-medium text-slate-300">Last 24 h</span>
      <CycleChip name="Severity" value={filters.severity} onClick={() => cycle("severity", SEVERITY_OPTIONS)} />
      <CycleChip name="Source"   value={filters.source}   onClick={() => cycle("source",   SOURCE_OPTIONS)} />
      <CycleChip name="Workload" value={filters.workload}  onClick={() => cycle("workload",  WORKLOAD_OPTIONS)} />
      <button
        onClick={() => setSaved(true)}
        className={`ml-auto text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors ${FOCUS}`}
      >
        {saved ? "✓ Filter saved" : "Save filter"}
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
      className={`cursor-pointer border-t transition ${DIVIDER} ${FOCUS} ${
        selected ? "bg-[#111d36]" : "hover:bg-white/[0.025]"
      }`}
    >
      <td className={`whitespace-nowrap px-5 py-3 font-mono text-[11px] ${MUTED}`}>{e.time}</td>
      <td className="whitespace-nowrap px-3 py-3 font-mono text-[12px] font-semibold text-white">{e.workload}</td>
      <td className="px-3 py-3 text-sm text-white/90">{e.event}</td>
      <td className={`whitespace-nowrap px-3 py-3 text-xs ${MUTED}`}>{e.source}</td>
      <td className="whitespace-nowrap px-3 py-3 pr-5">
        <SeverityBadge severity={e.severity} />
      </td>
    </tr>
  );
}

function EventTable({ rows, selectedId, onSelect }: { rows: EventItem[]; selectedId: string; onSelect: (id: string) => void }) {
  return (
    <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0D1117]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[660px] text-left">
          <thead>
            <tr className={`border-b text-xs ${MUTED} ${DIVIDER}`}>
              {["Time", "Workload", "Event", "Source", "Severity"].map((h, i) => (
                <th key={h} scope="col" className={`py-3 font-medium ${i === 0 ? "px-5" : "px-3"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => <EventRow key={e.id} e={e} selected={e.id === selectedId} onSelect={() => onSelect(e.id)} />)}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && <p className={`px-5 py-6 text-center text-xs ${MUTED}`}>No events match these filters.</p>}
      <p className={`border-t px-5 py-3 text-[10px] ${DIVIDER} ${MUTED}`}>{rows.length} of {TOTAL_EVENTS} events · live tail on</p>
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
  if (ev.href) {
    return (
      <Link href={ev.href} className={`font-medium text-cyan-400 hover:underline ${FOCUS}`}>
        {ev.value}
      </Link>
    );
  }
  return <span className="font-medium text-cyan-400">{ev.value}</span>;
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
  const btn = `rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs font-medium text-white transition hover:bg-white/[0.08] ${FOCUS}`;
  return (
    <div className="mt-4 flex gap-2 flex-wrap">
      <Link href="/incidents" className={btn}>Open incident</Link>
      <button onClick={copyLink} className={btn}>{copied ? "✓ Copied" : "Copy link"}</button>
    </div>
  );
}

function EventDetail({ e }: { e: EventItem | undefined }) {
  if (!e) {
    return (
      <aside className="rounded-xl border border-white/[0.07] bg-[#0D1117] p-5 text-xs text-slate-400">
        Select an event to see its evidence.
      </aside>
    );
  }
  return (
    <aside aria-live="polite" className="rounded-xl border border-white/[0.07] bg-[#0D1117] p-5">
      <h2 className="text-sm font-semibold text-white">{e.event}</h2>
      <p className={`mt-1.5 text-[11px] leading-relaxed ${MUTED}`}>{e.note}</p>
      <dl className="mt-3 divide-y divide-white/[0.05]">
        <KeyValue label="Event ID"><span className="font-mono font-bold text-white">{e.ids.event}</span></KeyValue>
        <KeyValue label="Request ID"><span className="font-mono font-bold text-white">{e.ids.request}</span></KeyValue>
        <KeyValue label="Trace ID"><span className="font-mono font-bold text-white">{e.ids.trace}</span></KeyValue>
      </dl>
      <h3 className="mt-4 text-xs font-semibold text-white">Correlated evidence</h3>
      <dl className="mt-1 divide-y divide-white/[0.05]">
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
    <div className="space-y-4 p-4 sm:p-6">
      {/* Page header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Event Explorer</h1>
          <p className="mt-0.5 text-xs text-[#6B7280]">{TOTAL_EVENTS} events · live tail active</p>
        </div>
        <span className="rounded-full border border-amber-400/60 px-2.5 py-0.5 text-[10px] font-medium text-amber-300">
          Sample data
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-3">
          {/* Search */}
          <div className="relative">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            <input
              type="search"
              value={filters.query}
              onChange={(e) => setFilters({ ...filters, query: e.target.value })}
              placeholder="Search events, IDs, SPIFFE IDs, rules…"
              aria-label="Search events, IDs, SPIFFE IDs and rules"
              className={`h-11 w-full rounded-xl border border-white/[0.07] bg-[#0D1117] pl-9 pr-4 text-sm text-slate-200 placeholder:text-slate-500 focus:border-white/[0.15] focus:outline-none transition-colors ${FOCUS}`}
            />
          </div>

          <FilterBar filters={filters} onChange={setFilters} />
          <EventTable rows={rows} selectedId={selected?.id ?? ""} onSelect={setSelectedId} />
        </div>
        <EventDetail e={selected} />
      </div>
    </div>
  );
}
