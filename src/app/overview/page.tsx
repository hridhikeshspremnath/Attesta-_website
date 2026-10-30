"use client";

// src/app/overview/page.tsx
// Attesta — Overview dashboard. Dark fintech SaaS design.
// Self-contained: Tailwind utility classes only, no new dependencies.

import type { ReactNode } from "react";
import Link from "next/link";

type Tone = "green" | "red" | "amber" | "cyan";

const TONE_TEXT: Record<Tone, string> = {
  green: "text-emerald-400",
  red:   "text-red-400",
  amber: "text-amber-400",
  cyan:  "text-cyan-300",
};

const TONE_BG: Record<Tone, string> = {
  green: "bg-emerald-400/10",
  red:   "bg-red-400/10",
  amber: "bg-amber-400/10",
  cyan:  "bg-cyan-400/10",
};

/* ----------------------------- data ----------------------------- */

const STATS = [
  { label: "Active runs",          value: 12, note: "3 awaiting trust gate",  tone: "cyan"  as Tone },
  { label: "Access denials",       value: 7,  note: "2 need review",          tone: "red"   as Tone },
  { label: "Open incidents",       value: 1,  note: "containment pending",    tone: "amber" as Tone },
  { label: "SVIDs expiring < 15m", value: 4,  note: "renewal queued",        tone: "cyan"  as Tone },
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
  { name: "Webhook ingestion", status: "Live",           tone: "green" },
  { name: "Policy engine",     status: "Live",           tone: "green" },
  { name: "Runtime agent",     status: "Stale · 2 min",  tone: "amber" },
  { name: "Ledger",            status: "Live",           tone: "green" },
];

const EVENTS: {
  time: string; workload: string; event: string;
  outcome: string; tone: Tone; confidence: number;
  href: string;
}[] = [
  { time: "14:02:11", workload: "build-runner-1842",  event: "Read protected secret",           outcome: "Denied",   tone: "red",   confidence: 87, href: "/event-explorer" },
  { time: "14:01:48", workload: "deploy-runner-1841", event: "SVID issued · trust gate passed", outcome: "Allowed",  tone: "green", confidence: 94, href: "/event-explorer" },
  { time: "14:00:38", workload: "test-runner-1840",   event: "Attestation failed",              outcome: "Rejected", tone: "red",   confidence: 81, href: "/event-explorer" },
  { time: "13:58:02", workload: "build-runner-1839",  event: "Trust gate: additional review",   outcome: "Review",   tone: "amber", confidence: 76, href: "/event-explorer" },
  { time: "13:55:19", workload: "build-runner-1838",  event: "Decision signed · ledger tx recorded", outcome: "Verified", tone: "green", confidence: 68, href: "/event-explorer" },
];

/* --------------------------- primitives --------------------------- */

function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <section className={`rounded-xl border border-emerald-500/25 bg-[#0A0E14] shadow-[0_0_18px_-3px_rgba(16,185,129,0.22),inset_0_0_12px_-3px_rgba(16,185,129,0.06)] hover:border-emerald-500/40 hover:shadow-[0_0_25px_-1px_rgba(16,185,129,0.32)] transition-all ${className}`}>
      {children}
    </section>
  );
}

/* ----------------------- stat cards ----------------------- */

function StatCard({ label, value, note, tone }: (typeof STATS)[number]) {
  return (
    <Card className="p-5 flex flex-col gap-1">
      <p className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-bold tabnum leading-none drop-shadow-[0_0_10px_currentColor] ${TONE_TEXT[tone]}`}>{value}</p>
      <p className="mt-1 text-[11px] text-[#6B7280]">{note}</p>
      <div className={`mt-2 h-1 rounded-full ${TONE_BG[tone]} overflow-hidden`}>
        <div className={`h-full rounded-full ${TONE_TEXT[tone].replace("text-", "bg-")} shadow-[0_0_8px_currentColor]`} style={{ width: "60%" }} />
      </div>
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

/* ----------------------- denied chart ----------------------- */

function DeniedRequestsChart() {
  const max = Math.max(...DENIED_24H.map((d) => d.value));
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-white">Denied requests · 24 h</h2>
        <span className="text-[10px] text-[#6B7280] tabnum">{DENIED_24H.reduce((a, b) => a + b.value, 0)} total</span>
      </div>
      <div className="flex h-28 items-end gap-2 drop-shadow-[0_0_12px_rgba(6,182,212,0.3)]" role="img" aria-label="Denied requests per 4-hour window">
        {DENIED_24H.map((d) => {
          const peak = d.value === max;
          const pct = (d.value / max) * 100;
          return (
            <div key={d.label} className="flex flex-1 flex-col items-center gap-1.5">
              <span className="text-[9px] text-[#6B7280] tabnum">{d.value}</span>
              <div
                title={`${d.label}: ${d.value}`}
                className={`w-full rounded-sm transition-all ${
                  peak
                    ? "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.9),0_0_24px_rgba(239,68,68,0.45)]"
                    : "bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.85),0_0_20px_rgba(6,182,212,0.4)]"
                }`}
                style={{ height: `${pct}%`, minHeight: 4 }}
              />
              <span className="text-[8px] text-[#6B7280]">{d.label}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ----------------------- service health ----------------------- */

function ServiceHealth() {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-white">Service health</h2>
        <span className="flex items-center gap-1.5 text-[10px] text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10B981]" />
          Live
        </span>
      </div>
      <ul className="space-y-3">
        {SERVICES.map((s) => (
          <li key={s.name} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full flex-shrink-0 ${TONE_TEXT[s.tone].replace("text-", "bg-")} shadow-[0_0_8px_currentColor]`} />
              <span className="text-sm text-[#E5E7EB]">{s.name}</span>
            </div>
            <span className={`text-xs font-medium ${TONE_TEXT[s.tone]}`}>{s.status}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* ----------------------- live event feed ----------------------- */

function ConfidenceBar({ value }: { value: number }) {
  const segments = 20;
  const filled = Math.round((value / 100) * segments);
  return (
    <div className="flex items-center gap-[2px]" aria-hidden>
      {Array.from({ length: segments }).map((_, i) => {
        const hue = 10 + (i / (segments - 1)) * 110;
        const isFilled = i < filled;
        return (
          <span
            key={i}
            className="h-2.5 w-[3px] rounded-[1px] transition-all"
            style={{
              background: isFilled ? `hsl(${hue} 90% 55%)` : "rgba(255,255,255,0.07)",
              boxShadow: isFilled ? `0 0 6px hsl(${hue} 90% 55%)` : "none",
            }}
          />
        );
      })}
    </div>
  );
}

function OutcomeBadge({ outcome, tone }: { outcome: string; tone: Tone }) {
  const cls: Record<Tone, string> = {
    green: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
    red:   "bg-red-400/10 text-red-400 border-red-400/20",
    amber: "bg-amber-400/10 text-amber-400 border-amber-400/20",
    cyan:  "bg-cyan-400/10 text-cyan-300 border-cyan-400/20",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${cls[tone]}`}>
      {outcome}
    </span>
  );
}

function EventRow({ e }: { e: (typeof EVENTS)[number] }) {
  return (
    <tr className="border-t border-white/[0.05] transition hover:bg-white/[0.025] group">
      <td className="whitespace-nowrap px-4 py-3 font-mono text-[12px] text-[#6B7280]">{e.time}</td>
      <td className="whitespace-nowrap px-4 py-3 font-mono text-[12px] font-semibold text-white">{e.workload}</td>
      <td className="px-4 py-3 text-sm text-[#E5E7EB]">{e.event}</td>
      <td className="whitespace-nowrap px-4 py-3">
        <OutcomeBadge outcome={e.outcome} tone={e.tone} />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <ConfidenceBar value={e.confidence} />
          <span className="w-9 text-xs text-[#9CA3AF] tabnum">{e.confidence}%</span>
          <Link
            href={e.href}
            aria-label={`View details for ${e.workload}`}
            className="grid h-7 w-7 place-items-center rounded-md bg-white/[0.08] text-white/60 text-xs transition hover:bg-white/[0.15] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          >
            →
          </Link>
        </div>
      </td>
    </tr>
  );
}

function LiveEventFeed() {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <h2 className="text-sm font-semibold text-white">Live event feed</h2>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[10px] text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live tail on
          </span>
          <Link
            href="/event-explorer"
            className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
          >
            View all →
          </Link>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead>
            <tr className="text-xs text-[#6B7280] border-b border-white/[0.05]">
              {["Time", "Workload", "Event", "Outcome", "Confidence"].map((h) => (
                <th key={h} className="px-4 py-2.5 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>{EVENTS.map((e) => <EventRow key={e.time} e={e} />)}</tbody>
        </table>
      </div>
    </Card>
  );
}

/* ---------------------- search bar ---------------------- */

function SearchBar() {
  return (
    <div className="relative flex items-center">
      <div className="pointer-events-none absolute left-3 text-[#6B7280]">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
      </div>
      <input
        type="search"
        placeholder="Search workload, run ID, request ID…"
        aria-label="Search workloads, runs and requests"
        className="h-10 w-full rounded-lg border border-emerald-500/25 bg-[#0A0E14] pl-9 pr-4 text-sm text-[#E5E7EB] placeholder:text-[#6B7280] shadow-[0_0_15px_-3px_rgba(16,185,129,0.18)] focus:border-emerald-500/50 focus:shadow-[0_0_20px_rgba(16,185,129,0.3)] focus:outline-none transition-all"
      />
      <div className="absolute right-3 flex items-center gap-2">
        <span className="rounded-md border border-white/[0.07] px-1.5 py-0.5 text-[10px] text-[#6B7280]">Last 24 h</span>
        <span className="rounded-md border border-amber-400/40 px-1.5 py-0.5 text-[10px] text-amber-300">Sample</span>
      </div>
    </div>
  );
}

/* ----------------------------- page ----------------------------- */

export default function OverviewPage() {
  return (
    <div className="space-y-4 p-4 sm:p-6">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Company health overview</h1>
          <p className="mt-0.5 text-xs text-[#6B7280]">Thu, 26 Feb 2026 · synced 3 min ago</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1 text-[11px] text-[#9CA3AF]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            All systems operational
          </span>
          <a
            href="#export"
            onClick={(e) => { e.preventDefault(); alert("Export functionality: CSV/JSON export would download here"); }}
            className="flex items-center gap-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-white hover:bg-white/[0.1] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16" />
            </svg>
            Export
          </a>
        </div>
      </div>

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
