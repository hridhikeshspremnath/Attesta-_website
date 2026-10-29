// src/app/overview/page.tsx
// Attesta — Overview. Self-contained: Tailwind utility classes only, no new dependencies.
// Wrap with <DashboardLayout> only if your layout.tsx does not already do so.

import type { ReactNode } from "react";

type Tone = "green" | "red" | "amber" | "cyan";

const TONE_TEXT: Record<Tone, string> = {
  green: "text-emerald-400",
  red: "text-red-400",
  amber: "text-amber-400",
  cyan: "text-cyan-300",
};

/* ----------------------------- data ----------------------------- */

const STATS = [
  { label: "Active runs", value: 12, note: "3 awaiting trust gate", tone: "cyan" as Tone },
  { label: "Access denials", value: 7, note: "2 need review", tone: "red" as Tone },
  { label: "Open incidents", value: 1, note: "containment pending", tone: "amber" as Tone },
  { label: "SVIDs expiring < 15 min", value: 4, note: "renewal queued", tone: "cyan" as Tone },
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
  { name: "Webhook ingestion", status: "Live", tone: "green" },
  { name: "Policy engine", status: "Live", tone: "green" },
  { name: "Runtime agent", status: "Stale · 2 min", tone: "amber" },
  { name: "Ledger", status: "Live", tone: "green" },
];

const EVENTS: {
  time: string; workload: string; event: string;
  outcome: string; tone: Tone; confidence: number;
}[] = [
  { time: "14:02:11", workload: "build-runner-1842", event: "Read protected secret", outcome: "Denied", tone: "red", confidence: 87 },
  { time: "14:01:48", workload: "deploy-runner-1841", event: "SVID issued · trust gate passed", outcome: "Allowed", tone: "green", confidence: 94 },
  { time: "14:00:38", workload: "test-runner-1840", event: "Attestation failed", outcome: "Rejected", tone: "red", confidence: 81 },
  { time: "13:58:02", workload: "build-runner-1839", event: "Trust gate: additional review", outcome: "Review", tone: "amber", confidence: 76 },
  { time: "13:55:19", workload: "build-runner-1838", event: "Decision signed · ledger tx recorded", outcome: "Verified", tone: "green", confidence: 68 },
];

/* --------------------------- primitives --------------------------- */

function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <section className={`rounded-xl border border-white/5 bg-[#0d1830] ${className}`}>
      {children}
    </section>
  );
}

function IconButton({ label, children }: { label: string; children: ReactNode }) {
  return (
    <button
      aria-label={label}
      className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/5 text-zinc-300 transition hover:bg-white/10"
    >
      {children}
    </button>
  );
}

function Chip({ children, accent = false }: { children: ReactNode; accent?: boolean }) {
  return (
    <span
      className={`rounded-md border px-2 py-0.5 text-[10px] font-medium ${
        accent ? "border-amber-400/70 text-amber-300" : "border-white/10 text-zinc-300"
      }`}
    >
      {children}
    </span>
  );
}

/* ----------------------------- header ----------------------------- */

function OverviewHeader() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/5 bg-[#0a0d14] px-4 py-3">
      <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-100">
        <h1 className="font-medium">Company health overview</h1>
        <span className="text-xs text-zinc-500">· Thu, 26 Feb 2026</span>
        <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-zinc-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          synced 3 min ago
        </span>
      </div>
      <div className="flex items-center gap-2">
        <IconButton label="Security status">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" /></svg>
        </IconButton>
        <IconButton label="Notifications">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 8a6 6 0 1112 0c0 7 3 8 3 8H3s3-1 3-8M10 21h4" /></svg>
        </IconButton>
        <button className="flex items-center gap-2 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-900 transition hover:bg-white">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16" /></svg>
          Export
        </button>
      </div>
    </header>
  );
}

/* ------------------------- search + stats ------------------------- */

function SearchBar() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-[#0d1830] px-3 py-2">
      <input
        type="search"
        placeholder="Search workload, run ID, request ID…"
        aria-label="Search workloads, runs and requests"
        className="min-w-0 flex-1 bg-transparent text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none"
      />
      <Chip>Last 24 h</Chip>
      <Chip accent>Sample data</Chip>
    </div>
  );
}

function StatCard({ label, value, note, tone }: (typeof STATS)[number]) {
  return (
    <Card className="p-4">
      <p className="text-[11px] text-zinc-400">{label}</p>
      <p className={`mt-1 text-3xl font-semibold ${TONE_TEXT[tone]}`}>{value}</p>
      <p className="mt-1 text-[11px] text-zinc-500">{note}</p>
    </Card>
  );
}

function StatsRow() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {STATS.map((s) => <StatCard key={s.label} {...s} />)}
    </div>
  );
}

/* ----------------------- denied chart + health ----------------------- */

function DeniedRequestsChart() {
  const max = Math.max(...DENIED_24H.map((d) => d.value));
  return (
    <Card className="p-4">
      <h2 className="text-sm font-semibold text-zinc-100">Denied requests · 24 h</h2>
      <div className="mt-4 flex h-28 items-end gap-3" role="img" aria-label="Denied requests per 4-hour window">
        {DENIED_24H.map((d) => {
          const peak = d.value === max;
          return (
            <div key={d.label} className="flex flex-1 flex-col items-center justify-end gap-1" style={{ height: "100%" }}>
              <div
                title={`${d.label}: ${d.value}`}
                className={`w-full rounded-sm ${peak ? "bg-red-400" : "bg-cyan-300"}`}
                style={{ height: `${(d.value / max) * 100}%`, minHeight: 8 }}
              />
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function ServiceHealth() {
  return (
    <Card className="p-4">
      <h2 className="text-sm font-semibold text-zinc-100">Service health</h2>
      <ul className="mt-3 space-y-2.5 text-sm">
        {SERVICES.map((s) => (
          <li key={s.name} className="flex items-center justify-between">
            <span className="text-zinc-200">{s.name}</span>
            <span className={`text-xs font-medium ${TONE_TEXT[s.tone]}`}>{s.status}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* ------------------------- live event feed ------------------------- */

function ConfidenceBar({ value }: { value: number }) {
  const segments = 24;
  const filled = Math.round((value / 100) * segments);
  return (
    <div className="flex items-center gap-[2px]" aria-hidden>
      {Array.from({ length: segments }).map((_, i) => {
        const hue = 10 + (i / (segments - 1)) * 110; // red → green
        return (
          <span
            key={i}
            className="h-3 w-[3px] rounded-[1px]"
            style={{ background: i < filled ? `hsl(${hue} 85% 55%)` : "rgba(255,255,255,0.08)" }}
          />
        );
      })}
    </div>
  );
}

function EventRow({ e }: { e: (typeof EVENTS)[number] }) {
  return (
    <tr className="border-t border-white/5 transition hover:bg-white/[0.03]">
      <td className="whitespace-nowrap px-4 py-3 font-mono text-[13px] text-zinc-400">{e.time}</td>
      <td className="whitespace-nowrap px-4 py-3 font-mono text-[13px] font-semibold text-zinc-100">{e.workload}</td>
      <td className="px-4 py-3 text-sm font-medium text-zinc-100">{e.event}</td>
      <td className={`whitespace-nowrap px-4 py-3 text-sm font-medium ${TONE_TEXT[e.tone]}`}>{e.outcome}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <ConfidenceBar value={e.confidence} />
          <span className="w-9 text-xs text-zinc-300">{e.confidence}%</span>
          <button aria-label={`Expand ${e.workload}`} className="grid h-7 w-7 place-items-center rounded-md bg-zinc-200 text-zinc-900 transition hover:bg-white">
            +
          </button>
        </div>
      </td>
    </tr>
  );
}

function LiveEventFeed() {
  return (
    <Card className="overflow-hidden">
      <h2 className="px-4 pt-4 text-base font-semibold text-zinc-100">Live event feed</h2>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead>
            <tr className="text-sm text-slate-400">
              {["Time", "Workload", "Event", "Outcome", "Confidence"].map((h) => (
                <th key={h} className="px-4 py-3 font-normal">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>{EVENTS.map((e) => <EventRow key={e.time} e={e} />)}</tbody>
        </table>
      </div>
    </Card>
  );
}

/* --------------------------- page --------------------------- */

export default function OverviewPage() {
  return (
    <div className="space-y-4 p-4 sm:p-6">
      <OverviewHeader />
      <SearchBar />
      <StatsRow />
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <DeniedRequestsChart />
        <ServiceHealth />
      </div>
      <LiveEventFeed />
    </div>
  );
}