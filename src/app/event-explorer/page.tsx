"use client";
// src/app/event-explorer/page.tsx
// Attesta — Event Explorer: correlated events with their evidence.

import { Suspense, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PageHeader from "@/src/components/ui/PageHeader";
import {
  Badge, Button, ButtonLink, CopyButton, EmptyState, FilterSelect, PageSkeleton,
  SampleBadge, SearchField, SortHeader, useSort, type Tone,
} from "@/src/components/ui/primitives";

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

const SEVERITY_TONE: Record<Severity, Tone> = { High: "crit", Medium: "warn", Info: "neutral" };
const SEVERITY_RANK: Record<Severity, number> = { High: 2, Medium: 1, Info: 0 };

/* ----------------------------- data ----------------------------- */

const EVENTS: EventItem[] = [
  {
    id: "e1", time: "14:02:11", workload: "build-runner-1842", event: "Read protected secret denied",
    source: "OPA", severity: "High",
    note: "Observed: request denied. Interpretation: possible misuse, unconfirmed.",
    ids: { event: "[evt-id]", request: "[req-id]", trace: "[trace-id]" },
    evidence: [
      { label: "OPA rule",            value: "secrets.read v7",       href: "/access-policies" },
      { label: "Workload and SVID",   value: "build-runner-1842",     href: "/workload-identity" },
      { label: "Trust decision",      value: "Review",                href: "/trust-decisions" },
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
      { label: "Trust decision", value: "Review",            href: "/trust-decisions" },
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
      { label: "Trust decision",    value: "Allowed",            href: "/trust-decisions" },
    ],
  },
  {
    id: "e5", time: "14:00:38", workload: "test-runner-1840", event: "Attestation failed",
    source: "Attestation", severity: "High",
    note: "Observed: workload attestation did not verify. Interpretation: identity not issued.",
    ids: { event: "[evt-id]", request: "[req-id]", trace: "[trace-id]" },
    evidence: [
      { label: "Workload and SVID", value: "test-runner-1840", href: "/workload-identity" },
      { label: "Trust decision",    value: "Rejected",         href: "/trust-decisions" },
    ],
  },
  {
    id: "e6", time: "13:58:02", workload: "build-runner-1839", event: "Trust gate sent to review",
    source: "Trust gate", severity: "Medium",
    note: "Observed: additional evidence required before the run can continue.",
    ids: { event: "[evt-id]", request: "[req-id]", trace: "[trace-id]" },
    evidence: [
      { label: "Trust decision", value: "Review", href: "/trust-decisions" },
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

/* ---------------------------------- UI ---------------------------------- */

function FilterBar({ filters, onChange, onReset }: { filters: Filters; onChange: (f: Filters) => void; onReset: () => void }) {
  const active = filters.severity !== "any" || filters.source !== "any" || filters.workload !== "any" || filters.query !== "";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <FilterSelect name="Severity" value={filters.severity} options={SEVERITY_OPTIONS} onChange={(severity) => onChange({ ...filters, severity })} />
      <FilterSelect name="Source"   value={filters.source}   options={SOURCE_OPTIONS}   onChange={(source) => onChange({ ...filters, source })} />
      <FilterSelect name="Workload" value={filters.workload} options={WORKLOAD_OPTIONS} onChange={(workload) => onChange({ ...filters, workload })} />
      {active && <Button size="sm" onClick={onReset}>Reset</Button>}
    </div>
  );
}

/* ------------------------------- table ------------------------------- */

function EventRow({ e, selected, onSelect }: { e: EventItem; selected: boolean; onSelect: () => void }) {
  return (
    <tr
      tabIndex={0}
      aria-current={selected ? "true" : undefined}
      onClick={onSelect}
      onKeyDown={(ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); onSelect(); } }}
      className="cursor-pointer"
    >
      <td className="tabnum whitespace-nowrap font-mono text-muted">{e.time}</td>
      <td className="whitespace-nowrap font-mono text-fg">{e.workload}</td>
      <td className="text-fg">{e.event}</td>
      <td className="whitespace-nowrap text-muted">{e.source}</td>
      <td className="whitespace-nowrap"><Badge tone={SEVERITY_TONE[e.severity]}>{e.severity}</Badge></td>
    </tr>
  );
}

type SortKey = "time" | "workload" | "source" | "severity";

const SORT_ACCESSORS: Record<SortKey, (e: EventItem) => string | number> = {
  time:     (e) => e.time,
  workload: (e) => e.workload,
  source:   (e) => e.source,
  severity: (e) => SEVERITY_RANK[e.severity],
};

function EventTable({ rows, selectedId, onSelect, onReset }: { rows: EventItem[]; selectedId: string; onSelect: (id: string) => void; onReset: () => void }) {
  const { sorted, sort, toggle } = useSort(rows, SORT_ACCESSORS, { key: "time", dir: "desc" });
  return (
    <section className="card min-w-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="data-table min-w-[660px]">
          <thead>
            <tr>
              <SortHeader label="Time" sortKey="time" sort={sort} onSort={toggle} />
              <SortHeader label="Workload" sortKey="workload" sort={sort} onSort={toggle} />
              <th scope="col">Event</th>
              <SortHeader label="Source" sortKey="source" sort={sort} onSort={toggle} />
              <SortHeader label="Severity" sortKey="severity" sort={sort} onSort={toggle} />
            </tr>
          </thead>
          <tbody>
            {sorted.map((e) => <EventRow key={e.id} e={e} selected={e.id === selectedId} onSelect={() => onSelect(e.id)} />)}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && (
        <EmptyState title="No events match these filters" action={<Button size="sm" onClick={onReset}>Reset filters</Button>}>
          The filters exclude every loaded event. This does not mean no events occurred.
        </EmptyState>
      )}
      <p className="border-t border-line px-5 py-3 text-2xs text-muted">{rows.length} of {EVENTS.length} sample events · last 24 h</p>
    </section>
  );
}

/* ----------------------------- detail panel ----------------------------- */

function KeyValue({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 text-xs">
      <dt className="text-muted">{label}</dt>
      <dd className="min-w-0 break-words text-right">{children}</dd>
    </div>
  );
}

function EvidenceValue({ ev }: { ev: Evidence }) {
  if (ev.href) return <Link href={ev.href} className="link font-medium">{ev.value}</Link>;
  return <span className="font-medium text-fg">{ev.value}</span>;
}

function DetailActions({ e }: { e: EventItem }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <ButtonLink href="/incidents">Open incident</ButtonLink>
      <CopyButton label="Copy link" text={`${typeof window === "undefined" ? "" : window.location.origin}/event-explorer?event=${e.id}`} />
    </div>
  );
}

function EventDetail({ e }: { e: EventItem | undefined }) {
  if (!e) {
    return (
      <aside className="card self-start p-5 text-xs text-muted">
        Select an event to see its evidence.
      </aside>
    );
  }
  return (
    <aside aria-live="polite" className="card min-w-0 self-start p-5">
      <h2 className="text-base font-semibold text-fg">{e.event}</h2>
      <p className="mt-1.5 text-xs leading-relaxed text-muted">{e.note}</p>
      <dl className="mt-3 divide-y divide-line">
        <KeyValue label="Event ID"><span className="font-mono text-fg">{e.ids.event}</span></KeyValue>
        <KeyValue label="Request ID"><span className="font-mono text-fg">{e.ids.request}</span></KeyValue>
        <KeyValue label="Trace ID"><span className="font-mono text-fg">{e.ids.trace}</span></KeyValue>
      </dl>
      <h3 className="mt-4 text-sm font-semibold text-fg">Correlated evidence</h3>
      <dl className="mt-1 divide-y divide-line">
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

function EventExplorer({ linkedEvent }: { linkedEvent: string | null }) {
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [selectedId, setSelectedId] = useState(linkedEvent ?? EVENTS[0].id);
  const rows = useMemo(() => EVENTS.filter((e) => matchesFilters(e, filters)), [filters]);
  const selected = rows.find((e) => e.id === selectedId) ?? rows[0];
  const reset = () => setFilters(INITIAL_FILTERS);

  return (
    <div className="page">
      <PageHeader
        title="Event Explorer"
        subtitle="Pipeline, identity, policy and runtime events correlated with their evidence"
        badges={<SampleBadge />}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-3">
          <SearchField
            value={filters.query}
            onChange={(query) => setFilters({ ...filters, query })}
            placeholder="Search events, IDs, SPIFFE IDs, rules…"
            label="Search events, IDs, SPIFFE IDs and rules"
          />
          <FilterBar filters={filters} onChange={setFilters} onReset={reset} />
          <EventTable rows={rows} selectedId={selected?.id ?? ""} onSelect={setSelectedId} onReset={reset} />
        </div>
        <EventDetail e={selected} />
      </div>
    </div>
  );
}

// Keyed so a link to a different event re-selects it on a route that stays mounted.
function LinkedEventExplorer() {
  const linkedEvent = useSearchParams().get("event");
  return <EventExplorer key={linkedEvent} linkedEvent={linkedEvent} />;
}

export default function EventExplorerPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <LinkedEventExplorer />
    </Suspense>
  );
}
