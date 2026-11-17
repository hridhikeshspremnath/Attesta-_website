"use client";

// src/app/event-explorer/page.tsx — events derived from the trust ledger, each correlated with its record.
// Every ledger record implies several events (scored, decision, attestation, LLM review, flags,
// commit) and every auditor override is one more. Nothing here is invented: no ledger, no events.
import { Suspense, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import LedgerGate from "@/src/components/ledger/LedgerGate";
import { raisedFlags } from "@/src/components/ledger/RecordDetail";
import PageHeader from "@/src/components/ui/PageHeader";
import {
  Badge, Button, ButtonLink, CopyButton, EmptyState, FilterSelect, PageSkeleton, SearchField, SortHeader, useSort, type Tone,
} from "@/src/components/ui/primitives";
import { HBars } from "@/src/components/charts/charts";
import { severityBars } from "@/src/lib/chartData";
import { Card } from "@/src/components/ui/primitives";
import { subject, utc } from "@/src/lib/ledger";
import type { LedgerEntry } from "@/src/types";

/* ----------------------------- events ----------------------------- */

type Severity = "High" | "Medium" | "Info";
const SEVERITY_TONE: Record<Severity, Tone> = { High: "crit", Medium: "warn", Info: "neutral" };
const SEVERITY_RANK: Record<Severity, number> = { High: 3, Medium: 2, Info: 1 };

type Evidence = { label: string; value: string; href?: string };
type EventItem = {
  id: string; ts: number; pkg: string; event: string; source: string; severity: Severity; note: string;
  ids: { record: string; run: string; tx: string };
  evidence: Evidence[];
};

const decisionSeverity = (d: string): Severity => (d === "BLOCK" ? "High" : d === "ALLOW" ? "Info" : "Medium");
const bandSeverity = (b: string): Severity => (b === "CRITICAL" || b === "HIGH" ? "High" : b === "MEDIUM" ? "Medium" : "Info");

function eventsFor(e: LedgerEntry): EventItem[] {
  const r = e.record;
  const pkg = subject(e);
  const ids = { record: r.record_id, run: r.run_id, tx: e.tx_id ?? "–" };
  const evidence: Evidence[] = [
    { label: "Trust decision", value: r.decision, href: "/trust-decisions" },
    { label: "Artifact", value: r.artifact_digest.replace("sha256:", "").slice(0, 12) + "…", href: "/provenance" },
    { label: "Scoring run", value: r.run_id, href: "/pipeline-runs" },
    { label: "Scorer identity", value: r.submitted_by_spiffe_id.replace("spiffe://", ""), href: "/workload-identity" },
    { label: "Ledger record", value: e.tx_id ? `tx ${e.tx_id.slice(0, 12)}…` : "record", href: "/trust-ledger" },
  ];
  const make = (kind: string, ts: number, event: string, source: string, severity: Severity, note: string): EventItem =>
    ({ id: `${r.record_id}:${kind}`, ts, pkg, event, source, severity, note, ids, evidence });

  const out = [
    make("scored", e.timestamp, `Scored ${r.risk_score}/1000 (${r.risk_band})`, "Scorer", bandSeverity(r.risk_band),
      "Observed: the detector's score for this artifact. A score is evidence, not a verdict."),
    make("decision", e.timestamp, `Decision: ${r.decision}`, "Policy", decisionSeverity(r.decision),
      `Observed: the policy service signed this decision under policy ${r.policy_version}.`),
    make("attestation", e.timestamp, r.attestation_verified ? `Runner attested (${r.node_attestor})` : "Runner not attested", "Attestation",
      r.attestation_verified ? "Info" : "Medium",
      r.attestation_verified ? "Observed: the requesting runner's identity was verified." : "Observed: no verified runner attestation, so ALLOW cannot be granted."),
    make("commit", e.timestamp, e.block_number ? `Committed in block ${e.block_number}` : "Committed to the ledger", "Ledger", "Info",
      "Observed: endorsed by the required organisations and written to the ledger."),
  ];
  const flags = raisedFlags(e);
  if (flags.length) out.push(make("flags", e.timestamp, `Flags raised: ${flags.join(", ")}`, "Scorer", "Medium", "Observed: behaviour indicators found in the package. Interpretation: possible risk, unconfirmed."));
  if (r.llm_verdict !== "NOT_RUN") {
    out.push(make("llm", e.timestamp, `LLM review: ${r.llm_verdict}`, "LLM review",
      r.llm_verdict === "MALICIOUS" ? "High" : r.llm_verdict === "SUSPICIOUS" ? "Medium" : "Info",
      "Observed: advisory verdict. It can raise a decision, never lower one."));
  }
  (e.overrides ?? []).forEach((o, i) => {
    out.push(make(`override-${i}`, o.tx_time, `Auditor changed ${o.previous_decision} → ${o.decision}`, "Auditor", decisionSeverity(o.decision),
      `Reason given: ${o.reason}`));
  });
  return out;
}

/* --------------------------- filtering --------------------------- */

type Filters = { query: string; severity: string; source: string; pkg: string };
const INITIAL_FILTERS: Filters = { query: "", severity: "any", source: "any", pkg: "any" };

function matches(e: EventItem, f: Filters): boolean {
  if (f.severity !== "any" && e.severity !== f.severity) return false;
  if (f.source !== "any" && e.source !== f.source) return false;
  if (f.pkg !== "any" && e.pkg !== f.pkg) return false;
  const q = f.query.trim().toLowerCase();
  return !q || [utc(e.ts), e.pkg, e.event, e.source, ...Object.values(e.ids), ...e.evidence.map((x) => `${x.label} ${x.value}`)].join(" ").toLowerCase().includes(q);
}

/* ---------------------------------- UI ---------------------------------- */

type SortKey = "time" | "pkg" | "source" | "severity";
const SORT_ACCESSORS: Record<SortKey, (e: EventItem) => string | number> = {
  time: (e) => e.ts, pkg: (e) => e.pkg, source: (e) => e.source, severity: (e) => SEVERITY_RANK[e.severity],
};

function EventTable({ rows, total, selectedId, onSelect, onReset }: { rows: EventItem[]; total: number; selectedId: string; onSelect: (id: string) => void; onReset: () => void }) {
  const { sorted, sort, toggle } = useSort(rows, SORT_ACCESSORS, { key: "time", dir: "desc" });
  return (
    <section className="card min-w-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="data-table min-w-[700px]">
          <thead>
            <tr>
              <SortHeader label="Time (UTC)" sortKey="time" sort={sort} onSort={toggle} />
              <SortHeader label="Package" sortKey="pkg" sort={sort} onSort={toggle} />
              <th scope="col">Event</th>
              <SortHeader label="Source" sortKey="source" sort={sort} onSort={toggle} />
              <SortHeader label="Severity" sortKey="severity" sort={sort} onSort={toggle} />
            </tr>
          </thead>
          <tbody>
            {sorted.map((e) => (
              <tr
                key={e.id}
                tabIndex={0}
                aria-current={e.id === selectedId ? "true" : undefined}
                onClick={() => onSelect(e.id)}
                onKeyDown={(ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); onSelect(e.id); } }}
                className="cursor-pointer"
              >
                <td className="tabnum whitespace-nowrap font-mono text-muted">{utc(e.ts)}</td>
                <td className="whitespace-nowrap font-mono text-fg">{e.pkg}</td>
                <td className="text-fg">{e.event}</td>
                <td className="whitespace-nowrap text-muted">{e.source}</td>
                <td className="whitespace-nowrap"><Badge tone={SEVERITY_TONE[e.severity]}>{e.severity}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && (
        <EmptyState title="No events match these filters" action={<Button size="sm" onClick={onReset}>Reset filters</Button>}>
          The filters exclude every loaded event. This does not mean no events occurred.
        </EmptyState>
      )}
      <p className="border-t border-line px-5 py-3 text-2xs text-muted">{rows.length} of {total} events, derived from the ledger</p>
    </section>
  );
}

function KeyValue({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 text-xs">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="min-w-0 break-all text-right">{children}</dd>
    </div>
  );
}

function EventDetail({ e }: { e: EventItem | undefined }) {
  if (!e) return <aside className="card self-start p-5 text-xs text-muted">Select an event to see its evidence.</aside>;
  return (
    <aside aria-live="polite" className="card min-w-0 self-start p-5">
      <h2 className="text-base font-semibold text-fg">{e.event}</h2>
      <p className="mt-1.5 text-xs leading-relaxed text-muted">{e.note}</p>
      <dl className="mt-3 divide-y divide-line">
        <KeyValue label="Record ID"><span className="font-mono text-fg">{e.ids.record}</span></KeyValue>
        <KeyValue label="Run"><span className="font-mono text-fg">{e.ids.run}</span></KeyValue>
        <KeyValue label="Transaction"><span className="font-mono text-fg" title={e.ids.tx}>{e.ids.tx.slice(0, 16)}{e.ids.tx.length > 16 ? "…" : ""}</span></KeyValue>
      </dl>
      <h3 className="mt-4 text-sm font-semibold text-fg">Correlated evidence</h3>
      <dl className="mt-1 divide-y divide-line">
        {e.evidence.map((ev) => (
          <KeyValue key={ev.label} label={ev.label}>
            {ev.href ? <Link href={ev.href} className="link font-medium">{ev.value}</Link> : <span className="font-medium text-fg">{ev.value}</span>}
          </KeyValue>
        ))}
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        <ButtonLink href="/incidents">Open findings</ButtonLink>
        <CopyButton label="Copy link" text={`${typeof window === "undefined" ? "" : window.location.origin}/event-explorer?event=${encodeURIComponent(e.id)}`} />
      </div>
    </aside>
  );
}

function EventExplorer({ records, linkedEvent }: { records: LedgerEntry[]; linkedEvent: string | null }) {
  const events = useMemo(() => records.flatMap(eventsFor), [records]);
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [selectedId, setSelectedId] = useState(linkedEvent ?? "");
  const rows = useMemo(() => events.filter((e) => matches(e, filters)), [events, filters]);
  const newest = useMemo(() => [...rows].sort((a, b) => b.ts - a.ts)[0], [rows]);
  const selected = rows.find((e) => e.id === selectedId) ?? newest;
  const reset = () => setFilters(INITIAL_FILTERS);
  const options = (pick: (e: EventItem) => string) => ["any", ...Array.from(new Set(events.map(pick)))];
  const active = filters.severity !== "any" || filters.source !== "any" || filters.pkg !== "any" || filters.query !== "";

  return (
    <>
      <PageHeader title="Event Explorer" subtitle="Scoring, policy, attestation, review and auditor events from the ledger, correlated with their records" />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-3">
          <Card title="Event severity" aside={<span className="text-2xs text-muted">{events.length} events</span>}>
            <HBars rows={severityBars({ High: events.filter((e) => e.severity === "High").length, Medium: events.filter((e) => e.severity === "Medium").length, Info: events.filter((e) => e.severity === "Info").length })} />
          </Card>
          <SearchField value={filters.query} onChange={(query) => setFilters({ ...filters, query })}
            placeholder="Search events, packages, record, run or transaction IDs…" label="Search events" />
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect name="Severity" value={filters.severity} options={["any", "High", "Medium", "Info"]} onChange={(severity) => setFilters({ ...filters, severity })} />
            <FilterSelect name="Source" value={filters.source} options={options((e) => e.source)} onChange={(source) => setFilters({ ...filters, source })} />
            <FilterSelect name="Package" value={filters.pkg} options={options((e) => e.pkg)} onChange={(pkg) => setFilters({ ...filters, pkg })} />
            {active && <Button size="sm" onClick={reset}>Reset</Button>}
          </div>
          <EventTable rows={rows} total={events.length} selectedId={selected?.id ?? ""} onSelect={setSelectedId} onReset={reset} />
        </div>
        <EventDetail e={selected} />
      </div>
    </>
  );
}

// Keyed so a link to a different event re-selects it on a route that stays mounted.
function Linked() {
  const linkedEvent = useSearchParams().get("event");
  return (
    <div className="page">
      <LedgerGate title="Events">{(l) => <EventExplorer key={linkedEvent} records={l.records} linkedEvent={linkedEvent} />}</LedgerGate>
    </div>
  );
}

export default function EventExplorerPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Linked />
    </Suspense>
  );
}
