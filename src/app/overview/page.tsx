"use client";

// src/app/overview/page.tsx
// Attesta — Overview dashboard: the trust ledger at a glance. Live data via /api/ledger.
// Self-contained: Tailwind utility classes only, no new dependencies.

import { useMemo, useState } from "react";
import Link from "next/link";
import PageHeader from "@/src/components/ui/PageHeader";
import { Badge, Button, Card, EmptyState, SearchField, StatusDot, TONE_TEXT, type Tone } from "@/src/components/ui/primitives";
import { AreaTrend, Donut, RiskHistogram } from "@/src/components/charts/charts";
import PipelineDiagram from "@/src/components/diagrams/PipelineDiagram";
import { decisionSlices, flowStats, riskPoints } from "@/src/lib/chartData";
import { downloadFile } from "@/src/lib/download";
import { DECISION_TONE, effectiveDecision, subject, useLedger, utc, type LedgerState } from "@/src/lib/ledger";
import type { Decision, LedgerEntry } from "@/src/types";

/* ----------------------------- derived data ----------------------------- */

type Stat = { label: string; value: string; note: string; tone: Tone };
type Bar = { label: string; value: number };
type Service = { name: string; status: string; tone: Tone };

const DAY = 86400;
const RECENT = 6;

const count = (records: LedgerEntry[], d: Decision) => records.filter((r) => effectiveDecision(r) === d).length;

function stats(state: LedgerState): Stat[] {
  const ready = state.status === "ready";
  const records = ready ? state.data.records : [];
  const cp = ready ? state.data.checkpoint : null;
  const n = (v: number) => (ready ? String(v) : "–");
  return [
    { label: "Records on ledger", value: n(records.length), note: cp?.kind === "fabric" ? `Fabric block height ${cp.height}` : "signed trust decisions", tone: "info" },
    { label: "Blocked", value: n(count(records, "BLOCK")), note: "refused by the deploy gate", tone: "crit" },
    { label: "Awaiting review", value: n(count(records, "REVIEW")), note: "needs an auditor decision", tone: "warn" },
    { label: "Allowed", value: n(count(records, "ALLOW")), note: "may deploy", tone: "ok" },
  ];
}

/** Records per UTC day for the 7 days ending at `nowMs`. */
function perDay(records: LedgerEntry[], nowMs: number): Bar[] {
  const today = Math.floor(nowMs / 1000 / DAY);
  return Array.from({ length: 7 }, (_, i) => {
    const day = today - 6 + i;
    return {
      label: new Date(day * DAY * 1000).toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" }),
      value: records.filter((r) => Math.floor(r.timestamp / DAY) === day).length,
    };
  });
}

function ago(seconds: number): string {
  if (seconds < 90) return "just now";
  if (seconds < 5400) return `${Math.round(seconds / 60)} min ago`;
  if (seconds < 2 * DAY) return `${Math.round(seconds / 3600)} h ago`;
  return `${Math.round(seconds / DAY)} d ago`;
}

function services(state: LedgerState): Service[] {
  if (state.status === "loading") return [{ name: "Gateway", status: "Checking…", tone: "info" }];
  if (state.status === "error") return [{ name: "Gateway", status: "Unreachable", tone: "crit" }];
  const { checkpoint: cp, records } = state.data;
  const ledger: Service = !cp
    ? { name: "Ledger", status: "Empty", tone: "warn" }
    : cp.kind === "fabric"
      ? { name: `Ledger · Fabric ${cp.channel}`, status: `Block ${cp.height}`, tone: "ok" }
      : { name: "Ledger · Merkle log (dev)", status: `${cp.record_count} records`, tone: "ok" };
  const newest = records[0];
  return [
    { name: "Gateway (SPIFFE mTLS)", status: "Live", tone: "ok" },
    ledger,
    { name: "Latest record", status: newest ? ago(state.loadedAt / 1000 - newest.timestamp) : "None yet", tone: newest ? "info" : "warn" },
  ];
}

/* ----------------------- stat cards ----------------------- */

function StatCard({ label, value, note, tone }: Stat) {
  return (
    <Link href="/trust-ledger" className="card card-link block p-4 sm:p-5">
      <p className="flex items-center gap-2 text-xs text-muted">
        <StatusDot tone={tone} />
        <span className="min-w-0">{label}</span>
      </p>
      <p className="tabnum mt-2 text-3xl font-semibold leading-none tracking-tight text-fg">{value}</p>
      <p className="mt-2 text-2xs text-muted">{note}</p>
    </Link>
  );
}

/* ----------------------- decisions chart ----------------------- */

function DecisionsChart({ bars }: { bars: Bar[] }) {
  const max = Math.max(1, ...bars.map((d) => d.value));
  const total = bars.reduce((a, b) => a + b.value, 0);
  return (
    <Card title="Decisions recorded" aside={<span className="tabnum text-2xs text-muted">{total} in last 7 days</span>}>
      <div className="flex h-40 items-stretch gap-2 border-b border-line pt-6 sm:gap-3">
        {bars.map((d) => {
          const peak = d.value === max && d.value > 0;
          const pct = (d.value / max) * 100;
          return (
            <div
              key={d.label}
              tabIndex={0}
              aria-label={`${d.label}: ${d.value} decisions recorded`}
              className="group relative flex flex-1 items-end rounded-t focus-visible:outline-offset-0"
            >
              <div
                className={`w-full rounded-t transition-colors ${peak ? "bg-accent-light" : "bg-accent/60 group-hover:bg-accent"}`}
                style={{ height: `${pct}%` }}
              />
              {peak && <span className="tabnum absolute inset-x-0 -top-5 text-center text-2xs text-fg group-hover:invisible group-focus-visible:invisible">{d.value}</span>}
              <span
                className="popover tabnum pointer-events-none absolute left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-2xs text-fg group-hover:block group-focus-visible:block"
                style={{ bottom: `${pct}%` }}
              >
                {d.label}: {d.value}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex gap-2 sm:gap-3" aria-hidden>
        {bars.map((d) => <span key={d.label} className="tabnum flex-1 text-center text-2xs text-muted">{d.label}</span>)}
      </div>
      <p className="mt-2 text-2xs text-muted">Ledger records per day, UTC</p>
    </Card>
  );
}

/* ----------------------- service health ----------------------- */

function ServiceHealth({ items }: { items: Service[] }) {
  return (
    <Card title="Service health" aside={<span className="text-2xs text-muted">measured through the gateway</span>}>
      <ul className="divide-y divide-line">
        {items.map((s) => (
          <li key={s.name} className="flex items-center justify-between gap-3 py-2.5 first:pt-1 last:pb-0">
            <span className="flex min-w-0 items-center gap-2.5">
              <StatusDot tone={s.tone} />
              <span className="truncate text-xs text-fg">{s.name}</span>
            </span>
            <span className={`shrink-0 text-2xs font-medium ${TONE_TEXT[s.tone]}`}>{s.status}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* ----------------------- recent decisions ----------------------- */

function RiskBar({ permille }: { permille: number }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="h-1 w-16 overflow-hidden rounded-full bg-raised" aria-hidden>
        <span className="block h-full rounded-full bg-accent" style={{ width: `${permille / 10}%` }} />
      </span>
      <span className="tabnum text-muted">{permille}</span>
    </span>
  );
}

function RecentDecisions({ state, onRetry }: { state: LedgerState; onRetry: () => void }) {
  const [query, setQuery] = useState("");
  const records = useMemo(() => (state.status === "ready" ? state.data.records : []), [state]);
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = q ? records.filter((e) => `${subject(e)} ${e.record.run_id} ${effectiveDecision(e)}`.toLowerCase().includes(q)) : records;
    return matched.slice(0, RECENT);
  }, [query, records]);

  return (
    <Card
      flush
      title="Recent decisions"
      aside={
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <SearchField value={query} onChange={setQuery} placeholder="Filter by package, run or decision…" label="Filter recent decisions" className="flex-1 sm:w-64" />
          <Link href="/trust-ledger" className="link shrink-0 text-xs">View all</Link>
        </div>
      }
    >
      {state.status === "loading" && <EmptyState title="Loading ledger…" />}
      {state.status === "error" && (
        <EmptyState title="Could not load the ledger" action={<Button size="sm" onClick={onRetry}>Retry</Button>}>{state.message}</EmptyState>
      )}
      {state.status === "ready" && rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="data-table min-w-[720px]">
            <thead>
              <tr>
                {["Time (UTC)", "Package", "Run", "Decision", "Risk (0–1000)"].map((h) => <th key={h} scope="col">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.record.record_id}>
                  <td className="tabnum whitespace-nowrap font-mono text-muted">{utc(e.timestamp)}</td>
                  <td className="whitespace-nowrap font-mono text-fg">{subject(e)}</td>
                  <td className="font-mono text-muted">{e.record.run_id}</td>
                  <td className="whitespace-nowrap"><Badge tone={DECISION_TONE[effectiveDecision(e)]}>{effectiveDecision(e)}</Badge></td>
                  <td><RiskBar permille={e.record.risk_score} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {state.status === "ready" && rows.length === 0 && (
        records.length
          ? <EmptyState title="No decisions match this filter" action={<Button size="sm" onClick={() => setQuery("")}>Clear filter</Button>} />
          : <EmptyState title="No records yet">The ledger is empty until the scoring service submits a signed record.</EmptyState>
      )}
    </Card>
  );
}

/* ----------------------------- page ----------------------------- */

export default function OverviewPage() {
  const { state, reload } = useLedger();
  const ready = state.status === "ready";
  const bars = useMemo(() => (state.status === "ready" ? perDay(state.data.records, state.loadedAt) : []), [state]);
  const exportSnapshot = () =>
    ready && downloadFile("attesta-overview.json", "application/json", JSON.stringify({ dataSource: "trust ledger", ...state.data }, null, 2));

  return (
    <div className="page">
      <PageHeader
        title="Security overview"
        subtitle="Live from the trust ledger · last 7 days"
        badges={state.status === "error" ? <Badge tone="crit">Ledger unreachable</Badge> : undefined}
        actions={
          <>
            <Button onClick={reload}>Refresh</Button>
            <Button onClick={exportSnapshot} disabled={!ready}>Export JSON</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats(state).map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {state.status === "ready" && (
        <>
          <Card title="How a decision is made" aside={<span className="text-2xs text-muted">Live counts · click a stage to open its page</span>}>
            <PipelineDiagram s={flowStats(state.data.records, state.data.checkpoint)} />
          </Card>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card title="Decision mix"><Donut slices={decisionSlices(state.data.records)} center={String(state.data.records.length)} caption="artifacts" /></Card>
            <Card title="Risk score over time" aside={<span className="text-2xs text-muted">0 = safe, 1000 = dangerous</span>}><AreaTrend points={riskPoints(state.data.records)} yLabel="Risk score" /></Card>
            <Card title="Where scores land" aside={<span className="text-2xs text-muted">artifacts per score range</span>}><RiskHistogram scores={state.data.records.map((e) => e.record.risk_score)} /></Card>
          </div>
        </>
      )}

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <DecisionsChart bars={bars} />
        <ServiceHealth items={services(state)} />
      </div>

      <RecentDecisions state={state} onRetry={reload} />
    </div>
  );
}
