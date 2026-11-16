"use client";

// src/app/provenance/page.tsx
// Attesta — Provenance & Verification & Correlated Event Explorer.
// Tailwind only; no new dependencies.

import { useState } from "react";
import Link from "next/link";
import PageHeader from "@/src/components/ui/PageHeader";
import {
  Badge, Button, ButtonLink, Card, CopyButton, EmptyState, FilterSelect, SampleBadge, SearchField, type Tone,
} from "@/src/components/ui/primitives";
import { downloadFile } from "@/src/lib/download";

/* ----------------------------- data ----------------------------- */

type Severity = "High" | "Medium" | "Info";
const SEVERITY_TONE: Record<Severity, Tone> = { High: "crit", Medium: "warn", Info: "neutral" };

type EventRow = { id: string; time: string; workload: string; event: string; source: string; severity: Severity };
type Evidence = { label: string; value: string; href?: string };

const EVENTS: EventRow[] = [
  { id: "e1", time: "14:02:11", workload: "build-runner-1842", event: "Read protected secret denied", source: "OPA", severity: "High" },
  { id: "e2", time: "14:02:14", workload: "build-runner-1842", event: "Credential access alert", source: "Runtime", severity: "High" },
  { id: "e3", time: "14:01:52", workload: "build-runner-1842", event: "Dependency flagged by model", source: "ML model", severity: "Medium" },
  { id: "e4", time: "14:01:48", workload: "deploy-runner-1841", event: "SVID issued", source: "Attestation", severity: "Info" },
  { id: "e5", time: "14:00:30", workload: "test-runner-1840", event: "Attestation failed", source: "Attestation", severity: "High" },
  { id: "e6", time: "13:58:02", workload: "build-runner-1839", event: "Trust gate sent to review", source: "Trust gate", severity: "Medium" },
  { id: "e7", time: "13:55:19", workload: "build-runner-1838", event: "Decision signed · tx recorded", source: "Ledger", severity: "Info" },
];

const DETAIL = {
  e1: {
    observed: "Observed: request denied. Interpretation: possible misuse, unconfirmed.",
    ids: [
      { label: "Event ID", value: "evt-01J4NYPC3RT2" },
      { label: "Request ID", value: "req-9824-sec-read" },
      { label: "Trace ID", value: "trace-44a1-89bc" },
    ] as Evidence[],
    evidence: [
      { label: "OPA rule", value: "secrets.read v7", href: "/access-policies" },
      { label: "Workload and SVID", value: "build-runner-1842", href: "/workload-identity" },
      { label: "Trust decision", value: "Review", href: "/trust-decisions" },
      { label: "GitHub run", value: "#1842", href: "/pipeline-runs" },
      { label: "Runtime alert", value: "Credential access", href: "/runtime-monitoring" },
      { label: "Signed record", value: "tx 0x8f4d92a1", href: "/trust-ledger" },
    ] as Evidence[],
  },
} as Record<string, { observed: string; ids: Evidence[]; evidence: Evidence[] }>;

const FALLBACK_IDS: Evidence[] = [
  { label: "Event ID", value: "evt-gen-009182" },
  { label: "Request ID", value: "req-gen-102938" },
  { label: "Trace ID", value: "trace-gen-7718" },
];

type Row = { label: string; value: string; accent?: boolean; href?: string };
type Check = { name: string; detail: string; result: string; tone: Tone };

const RUN = "#1842";
const DECISION_ID = "dec-01J4NYPC";

const BUILD: Row[] = [
  { label: "Source revision", value: "git:sha-9f82d1c", href: "https://github.com" },
  { label: "Workflow identity", value: "org/repo/.github/workflows/ci.yml@main" },
  { label: "Builder", value: "github-hosted-runner-ubuntu-24.04" },
  { label: "Started / finished", value: "14:08:42 / pending" },
  { label: "Workload identity", value: "spiffe://attesta.dev/ns/ci/sa/build-runner-1842", href: "/workload-identity" },
  { label: "Ledger tx", value: "0x8f4d92a1", accent: true, href: "/trust-ledger" },
];

const INITIAL_CHECKS: Check[] = [
  { name: "Signature", detail: "Checked against signer public key", result: "Valid", tone: "ok" },
  { name: "Trusted signer", detail: "Signer certificate is in the trusted consortium set", result: "Valid", tone: "ok" },
  { name: "Record integrity", detail: "SHA-256 stored record matches cryptographic payload", result: "Valid", tone: "ok" },
  { name: "Ledger match", detail: "Hyperledger Fabric state equals signed attestation", result: "Not yet verified", tone: "warn" },
];

const SEVERITY_OPTIONS = ["any", "High", "Medium", "Info"];
const SOURCE_OPTIONS   = ["any", ...Array.from(new Set(EVENTS.map((e) => e.source)))];
const WORKLOAD_OPTIONS = ["any", ...Array.from(new Set(EVENTS.map((e) => e.workload)))];

type Filters = { query: string; severity: string; source: string; workload: string };

const INITIAL_FILTERS: Filters = { query: "", severity: "any", source: "any", workload: "any" };

function matchesFilters(e: EventRow, f: Filters): boolean {
  if (f.severity !== "any" && e.severity !== f.severity) return false;
  if (f.source   !== "any" && e.source   !== f.source)   return false;
  if (f.workload !== "any" && e.workload !== f.workload) return false;
  const q = f.query.trim().toLowerCase();
  return !q || [e.workload, e.event, e.source, e.severity].some((v) => v.toLowerCase().includes(q));
}

/* ------------------------- event explorer ------------------------- */

function FilterBar({ filters, onChange }: { filters: Filters; onChange: (f: Filters) => void }) {
  const dirty = filters.severity !== "any" || filters.source !== "any" || filters.workload !== "any" || filters.query !== "";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <FilterSelect name="Severity" value={filters.severity} options={SEVERITY_OPTIONS} onChange={(severity) => onChange({ ...filters, severity })} />
      <FilterSelect name="Source"   value={filters.source}   options={SOURCE_OPTIONS}   onChange={(source) => onChange({ ...filters, source })} />
      <FilterSelect name="Workload" value={filters.workload} options={WORKLOAD_OPTIONS} onChange={(workload) => onChange({ ...filters, workload })} />
      {dirty && <Button size="sm" onClick={() => onChange(INITIAL_FILTERS)}>Reset</Button>}
    </div>
  );
}

function EventTable({ rows, selected, onSelect, onReset }: { rows: EventRow[]; selected: string; onSelect: (id: string) => void; onReset: () => void }) {
  return (
    <div className="well min-w-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="data-table min-w-[620px]">
          <thead>
            <tr>
              {["Time", "Workload", "Event", "Source", "Severity"].map((h) => <th key={h} scope="col">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                tabIndex={0}
                aria-current={r.id === selected ? "true" : undefined}
                onClick={() => onSelect(r.id)}
                onKeyDown={(ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); onSelect(r.id); } }}
                className="cursor-pointer"
              >
                <td className="tabnum font-mono text-muted">{r.time}</td>
                <td className="whitespace-nowrap font-mono text-fg">{r.workload}</td>
                <td className="text-fg">{r.event}</td>
                <td className="whitespace-nowrap text-muted">{r.source}</td>
                <td><Badge tone={SEVERITY_TONE[r.severity]}>{r.severity}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && (
        <EmptyState title="No events match these filters" action={<Button size="sm" onClick={onReset}>Reset filters</Button>} />
      )}
      <p className="border-t border-line px-5 py-2.5 text-2xs text-muted">{rows.length} of {EVENTS.length} sample events for run {RUN}</p>
    </div>
  );
}

function KeyValue({ items, mono }: { items: Evidence[]; mono?: boolean }) {
  return (
    <dl className="divide-y divide-line">
      {items.map((f) => (
        <div key={f.label} className="flex items-start justify-between gap-4 py-2 text-xs">
          <dt className="shrink-0 text-muted">{f.label}</dt>
          <dd className="min-w-0 break-words text-right font-medium">
            {f.href ? (
              <Link href={f.href} className="link">{f.value}</Link>
            ) : (
              <span className={mono ? "font-mono text-fg" : "text-fg"}>{f.value}</span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function EventDetail({ event }: { event: EventRow }) {
  const d = DETAIL[event.id];
  return (
    <div className="well min-w-0 p-4">
      <h3 className="text-sm font-semibold text-fg">{event.event}</h3>
      {d && <p className="mt-1 text-xs leading-snug text-muted">{d.observed}</p>}
      <div className="mt-3">
        <KeyValue items={d?.ids ?? FALLBACK_IDS} mono />
      </div>
      <h4 className="mb-1 mt-3 text-xs font-semibold text-fg">Correlated evidence</h4>
      {d ? (
        <KeyValue items={d.evidence} />
      ) : (
        <p className="py-2 text-xs text-muted">No correlated evidence recorded for this event.</p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <ButtonLink href="/incidents" size="sm">Open incident</ButtonLink>
        <CopyButton size="sm" label="Copy link" text={`${typeof window === "undefined" ? "" : window.location.origin}/event-explorer?event=${event.id}`} />
      </div>
    </div>
  );
}

/* -------------------- provenance & verification -------------------- */

function BuildProvenanceCard() {
  return (
    <Card title="Build provenance">
      <dl className="divide-y divide-line">
        {BUILD.map((r) => (
          <div key={r.label} className="flex items-start justify-between gap-4 py-2 text-xs">
            <dt className="shrink-0 text-muted">{r.label}</dt>
            <dd className="min-w-0 break-all text-right font-mono">
              {r.href?.startsWith("http") ? (
                <a href={r.href} target="_blank" rel="noreferrer" className="link">{r.value}</a>
              ) : r.href ? (
                <Link href={r.href} className="link">{r.value}</Link>
              ) : (
                <span className="text-fg">{r.value}</span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function VerificationChecksCard() {
  return (
    <Card
      title="Verification checks"
      aside={<Button size="sm" disabled title="Verification service not connected">Re-verify</Button>}
    >
      <ul className="divide-y divide-line">
        {INITIAL_CHECKS.map((c) => (
          <li key={c.name} className="flex items-start justify-between gap-4 py-2.5 text-xs">
            <div>
              <p className="font-medium text-fg">{c.name}</p>
              <p className="mt-0.5 text-muted">{c.detail}</p>
            </div>
            <Badge tone={c.tone}>{c.result}</Badge>
          </li>
        ))}
      </ul>
      <p className="mt-2 border-t border-line pt-3 text-xs text-muted">
        A cryptographic hash match alone is not proof. Each check runs against valid x509 SVID credentials and consortium policies.
        Re-verification needs the verification service, which is not connected in this build.
      </p>
    </Card>
  );
}

function EventExplorerSection() {
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [selected, setSelected] = useState("e1");

  const rows = EVENTS.filter((e) => matchesFilters(e, filters));
  const current = EVENTS.find((e) => e.id === selected) ?? EVENTS[0];

  return (
    <section aria-label="Correlated audit events" className="card space-y-3 p-5">
      <div className="flex flex-wrap items-center justify-between gap-x-3">
        <h2 className="text-base font-semibold text-fg">Correlated audit events</h2>
        <span className="text-2xs text-muted">Run {RUN} context</span>
      </div>
      <SearchField
        value={filters.query}
        onChange={(query) => setFilters({ ...filters, query })}
        placeholder="Search workload, event, source…"
        label="Search events"
      />
      <FilterBar filters={filters} onChange={setFilters} />
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <EventTable rows={rows} selected={selected} onSelect={setSelected} onReset={() => setFilters(INITIAL_FILTERS)} />
        <EventDetail event={current} />
      </div>
    </section>
  );
}

/* --------------------------------- page --------------------------------- */

function exportAttestation() {
  const data = { dataSource: "sample", run: RUN, decisionId: DECISION_ID, build: BUILD, checks: INITIAL_CHECKS };
  downloadFile(`provenance-run-${RUN.replace("#", "")}-sample.json`, "application/json", JSON.stringify(data, null, 2));
}

export default function ProvenancePage() {
  return (
    <div className="page">
      <PageHeader
        title="Provenance & Verification"
        subtitle={<>Run {RUN} · decision <span className="font-mono">{DECISION_ID}</span> attestation trail</>}
        badges={<SampleBadge />}
        actions={<Button onClick={exportAttestation}>Export attestation</Button>}
      />

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <BuildProvenanceCard />
        <VerificationChecksCard />
      </div>
      <EventExplorerSection />
    </div>
  );
}
