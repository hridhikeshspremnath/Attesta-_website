"use client";

// src/app/overview/page.tsx
// Attesta — Overview dashboard: security posture at a glance.
// Self-contained: Tailwind utility classes only, no new dependencies.

import { useMemo, useState } from "react";
import Link from "next/link";
import PageHeader from "@/src/components/ui/PageHeader";
import { Badge, Button, Card, EmptyState, SampleBadge, SearchField, StatusDot, TONE_TEXT, type Tone } from "@/src/components/ui/primitives";
import { downloadFile } from "@/src/lib/download";

/* ----------------------------- data ----------------------------- */

const STATS: { label: string; value: number; note: string; tone: Tone; href: string }[] = [
  { label: "Active runs",          value: 12, note: "3 awaiting trust gate", tone: "info", href: "/pipeline-runs" },
  { label: "Access denials",       value: 7,  note: "2 need review",         tone: "crit", href: "/trust-decisions" },
  { label: "Open incidents",       value: 1,  note: "containment pending",   tone: "warn", href: "/incidents" },
  { label: "SVIDs expiring < 15m", value: 4,  note: "renewal queued",        tone: "warn", href: "/workload-identity" },
];

const DENIED_24H = [
  { label: "00–04", value: 22 },
  { label: "04–08", value: 34 },
  { label: "08–12", value: 14 },
  { label: "12–16", value: 100 },
  { label: "16–20", value: 40 },
  { label: "20–24", value: 28 },
];

const SERVICES: { name: string; status: string; tone: Tone }[] = [
  { name: "Webhook ingestion", status: "Live",          tone: "ok" },
  { name: "Policy engine",     status: "Live",          tone: "ok" },
  { name: "Runtime agent",     status: "Stale · 2 min", tone: "warn" },
  { name: "Ledger",            status: "Live",          tone: "ok" },
  { name: "SPIRE attestation", status: "Live",          tone: "ok" },
];

const EVENTS: {
  time: string; workload: string; event: string;
  outcome: string; tone: Tone; confidence: number;
  href: string;
}[] = [
  { time: "14:02:11", workload: "build-runner-1842",  event: "Read protected secret",           outcome: "Denied",   tone: "crit", confidence: 87, href: "/event-explorer?event=e1" },
  { time: "14:01:48", workload: "deploy-runner-1841", event: "SVID issued · trust gate passed", outcome: "Allowed",  tone: "ok",   confidence: 94, href: "/event-explorer?event=e4" },
  { time: "14:00:38", workload: "test-runner-1840",   event: "Attestation failed",              outcome: "Rejected", tone: "crit", confidence: 81, href: "/event-explorer?event=e5" },
  { time: "13:58:02", workload: "build-runner-1839",  event: "Trust gate: additional review",   outcome: "Review",   tone: "warn", confidence: 76, href: "/event-explorer?event=e6" },
  { time: "13:55:19", workload: "build-runner-1838",  event: "Decision signed · ledger tx recorded", outcome: "Verified", tone: "ok", confidence: 68, href: "/event-explorer?event=e7" },
];

/* ----------------------- stat cards ----------------------- */

function StatCard({ label, value, note, tone, href }: (typeof STATS)[number]) {
  return (
    <Link href={href} className="card card-link block p-4 sm:p-5">
      <p className="flex items-center gap-2 text-xs text-muted">
        <StatusDot tone={tone} />
        <span className="min-w-0">{label}</span>
      </p>
      <p className="tabnum mt-2 text-3xl font-semibold leading-none tracking-tight text-fg">{value}</p>
      <p className="mt-2 text-2xs text-muted">{note}</p>
    </Link>
  );
}

function StatsRow() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {STATS.map((s) => <StatCard key={s.label} {...s} />)}
    </div>
  );
}

/* ----------------------- denied chart ----------------------- */

function DeniedRequestsChart() {
  const max = Math.max(...DENIED_24H.map((d) => d.value));
  const total = DENIED_24H.reduce((a, b) => a + b.value, 0);
  return (
    <Card title="Denied requests" aside={<span className="tabnum text-2xs text-muted">{total} in last 24 h</span>}>
      <div className="flex h-40 items-stretch gap-2 border-b border-line pt-6 sm:gap-3">
        {DENIED_24H.map((d) => {
          const peak = d.value === max;
          const pct = (d.value / max) * 100;
          return (
            <div
              key={d.label}
              tabIndex={0}
              aria-label={`${d.label} UTC: ${d.value} denied requests`}
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
        {DENIED_24H.map((d) => <span key={d.label} className="tabnum flex-1 text-center text-2xs text-muted">{d.label}</span>)}
      </div>
      <p className="mt-2 text-2xs text-muted">Requests per 4-hour window, UTC</p>
    </Card>
  );
}

/* ----------------------- service health ----------------------- */

function ServiceHealth() {
  const degraded = SERVICES.filter((s) => s.tone !== "ok").length;
  return (
    <Card title="Service health" aside={<span className="text-2xs text-muted">{SERVICES.length - degraded} of {SERVICES.length} live</span>}>
      <ul className="divide-y divide-line">
        {SERVICES.map((s) => (
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

/* ----------------------- recent event feed ----------------------- */

function ConfidenceBar({ value }: { value: number }) {
  return (
    <div className="h-1 w-16 overflow-hidden rounded-full bg-raised" aria-hidden>
      <div className="h-full rounded-full bg-accent" style={{ width: `${value}%` }} />
    </div>
  );
}

function EventRow({ e }: { e: (typeof EVENTS)[number] }) {
  return (
    <tr>
      <td className="tabnum whitespace-nowrap font-mono text-muted">{e.time}</td>
      <td className="whitespace-nowrap font-mono text-fg">{e.workload}</td>
      <td className="text-fg">{e.event}</td>
      <td className="whitespace-nowrap"><Badge tone={e.tone}>{e.outcome}</Badge></td>
      <td>
        <span className="flex items-center gap-2.5">
          <ConfidenceBar value={e.confidence} />
          <span className="tabnum text-muted">{e.confidence}%</span>
        </span>
      </td>
      <td className="text-right">
        <Link href={e.href} aria-label={`View event details for ${e.workload}`} className="link whitespace-nowrap">Details</Link>
      </td>
    </tr>
  );
}

function RecentEvents() {
  const [query, setQuery] = useState("");
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? EVENTS.filter((e) => `${e.workload} ${e.event} ${e.outcome}`.toLowerCase().includes(q)) : EVENTS;
  }, [query]);

  return (
    <Card
      flush
      title="Recent events"
      aside={
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Filter by workload or event…"
            label="Filter recent events"
            className="flex-1 sm:w-64"
          />
          <Link href="/event-explorer" className="link shrink-0 text-xs">View all</Link>
        </div>
      }
    >
      <div className="overflow-x-auto">
        <table className="data-table min-w-[780px]">
          <thead>
            <tr>
              {["Time", "Workload", "Event", "Outcome", "Confidence"].map((h) => <th key={h} scope="col">{h}</th>)}
              <th scope="col" aria-label="Details" />
            </tr>
          </thead>
          <tbody>{rows.map((e) => <EventRow key={e.time} e={e} />)}</tbody>
        </table>
      </div>
      {rows.length === 0 && (
        <EmptyState title="No events match this filter" action={<Button size="sm" onClick={() => setQuery("")}>Clear filter</Button>}>
          Five recent events are loaded. Try a workload name such as build-runner.
        </EmptyState>
      )}
    </Card>
  );
}

/* ----------------------------- page ----------------------------- */

export default function OverviewPage() {
  const degraded = SERVICES.filter((s) => s.tone !== "ok").length;
  const exportSnapshot = () =>
    downloadFile(
      "attesta-overview-sample.json",
      "application/json",
      JSON.stringify({ dataSource: "sample", stats: STATS, deniedRequests24h: DENIED_24H, services: SERVICES, events: EVENTS }, null, 2),
    );

  return (
    <div className="page">
      <PageHeader
        title="Security overview"
        subtitle="Thu, 26 Feb 2026 · last 24 hours"
        badges={
          <>
            <SampleBadge />
            {degraded > 0 && <Badge tone="warn">{degraded} service degraded</Badge>}
          </>
        }
        actions={<Button onClick={exportSnapshot}>Export JSON</Button>}
      />

      <StatsRow />

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <DeniedRequestsChart />
        <ServiceHealth />
      </div>

      <RecentEvents />
    </div>
  );
}
