"use client";

// src/app/incidents/page.tsx
// Attesta — Incidents & Response (CyberGuard incident detail).
// Same conventions as workload-identity/page.tsx. Tailwind only; no new dependencies.

import { useState, type ReactNode } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";

/* ------------------------- tokens + types ------------------------- */

const MUTED = "text-slate-400";
const DIVIDER = "border-white/[0.06]";
const FOCUS = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400";

const TABS = ["Overview", "Logs", "Actions", "Timeline"] as const;
type Tab = (typeof TABS)[number];

type Affected = { name: string; state: string };
type TimelineEvent = { time: string; text: string };
type Remediation = { text: string; status: string };
type AuditEntry = { id: string; time: string; confidence: string; reasoning: string; similar: number };

/* ----------------------------- data ----------------------------- */

const INCIDENT = {
  id: "INC-12456",
  severity: "HIGH",
  status: "Active",
  title: "Ransomware Detected on Multiple Systems",
};

const AFFECTED: Affected[] = [
  { name: "Server-01", state: "Infected" },
  { name: "Workstation-05", state: "Compromised" },
  { name: "Laptop-07", state: "Infected" },
];

const TIMELINE: TimelineEvent[] = [
  { time: "10:15 AM", text: "Ransomware detected on Server-01" },
  { time: "10:20 AM", text: "Workstation-05 compromised" },
  { time: "10:32 AM", text: "Files encrypted on Laptop-07" },
  { time: "10:50 AM", text: "Alerts sent to security team" },
];

const REMEDIATION: Remediation[] = [
  { text: "Isolated Server-01", status: "Completed" },
  { text: "Quarantined Workstation-05", status: "Completed" },
  { text: "Removed Malware from Laptop-07", status: "Completed" },
];

const AUDIT: AuditEntry[] = [
  { id: "A5678", time: "10:52 AM", confidence: "92%", reasoning: "Isolated infected server", similar: 3 },
  { id: "A5679", time: "11:00 AM", confidence: "92%", reasoning: "Quarantined compromised workstation", similar: 2 },
  { id: "A5680", time: "11:10 AM", confidence: "92%", reasoning: "Removed ransomware from laptop", similar: 4 },
];

const AUDIT_COLUMNS = ["Action ID", "Timestamp", "Confidence", "Reasoning", "Similar Incidents"];

/* --------------------------- primitives --------------------------- */

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-white/5 bg-[#0e1a30] px-4 pb-3 pt-3.5">
      <h2 className={`mb-1 border-b pb-2.5 text-xs font-bold text-white ${DIVIDER}`}>{title}</h2>
      {children}
    </section>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return <span className="rounded bg-white/10 px-2.5 py-0.5 text-xs text-white">{children}</span>;
}

function IconButton({ label, children }: { label: string; children: ReactNode }) {
  return (
    <button
      aria-label={label}
      className={`grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/5 text-zinc-300 transition hover:bg-white/10 motion-reduce:transition-none ${FOCUS}`}
    >
      {children}
    </button>
  );
}

function OutlineButton({ children }: { children: ReactNode }) {
  return (
    <button className={`h-8 rounded-md border border-white/10 bg-white/5 px-3 text-xs font-medium text-white transition hover:bg-white/10 motion-reduce:transition-none ${FOCUS}`}>
      {children}
    </button>
  );
}

/* ----------------------------- header ----------------------------- */

function TopBar() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/5 bg-[#0a0d14] px-4 py-3">
      <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-100">
        <span className="font-medium">Company health overview</span>
        <span className="text-xs text-zinc-500">· Thu, 26 Feb 2026</span>
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

function BrandBar() {
  return (
    <div className={`flex items-center gap-2 border-b px-5 py-3.5 ${DIVIDER}`}>
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 2l8 3v6c0 5-3.4 9.3-8 11-4.6-1.7-8-6-8-11V5l8-3z" stroke="#38bdf8" strokeWidth="1.8" />
        <path d="M9 8h6M12 8v7" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      <span className="text-lg font-bold tracking-tight text-white">CyberGuard</span>
    </div>
  );
}

function TabBar({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-2 border-b px-3 ${DIVIDER}`}>
      <div role="tablist" aria-label="Incident sections" className="flex">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            id={`tab-${t}`}
            aria-selected={tab === t}
            aria-controls="incident-panel"
            onClick={() => onChange(t)}
            className={`px-6 py-3 text-xs transition motion-reduce:transition-none ${FOCUS} ${
              tab === t ? "border-b-2 border-sky-400 bg-white/5 font-medium text-white" : "text-slate-300 hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="flex gap-2 py-2">
        <OutlineButton>Export PDF</OutlineButton>
        <OutlineButton>Export CSV</OutlineButton>
      </div>
    </div>
  );
}

/* ----------------------------- cards ----------------------------- */

function IncidentSummaryCard() {
  return (
    <Card title="Incident Summary">
      <div className="flex items-start gap-3 pt-2">
        <span className="rounded bg-red-700 px-4 py-2 text-xs font-bold text-white">{INCIDENT.severity}</span>
        <div className="space-y-1 text-xs text-slate-200">
          <p>Severity: {INCIDENT.severity} <span aria-hidden className="text-red-500">▸▸</span></p>
          <p>Incident ID: {INCIDENT.id}</p>
          <p>Status: {INCIDENT.status}</p>
        </div>
      </div>
      <p className="mt-3 pb-1 text-xs text-white">{INCIDENT.title}</p>
    </Card>
  );
}

function AffectedSystemsCard() {
  return (
    <Card title="Affected Systems">
      <ul className="space-y-2.5 pt-2 text-xs">
        {AFFECTED.map((s) => (
          <li key={s.name} className="flex items-center gap-2.5 text-white">
            <span aria-hidden className="h-2 w-2 rounded-full bg-red-500" />
            <span>{s.name}: <span className="text-red-400">{s.state}</span></span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function EventTimelineCard() {
  return (
    <Card title="Event Timeline">
      <ol>
        {TIMELINE.map((e) => (
          <li key={e.time} className={`border-t py-2.5 text-xs first:border-t-0 ${DIVIDER}`}>
            <span className={MUTED}>- {e.time} - </span>
            <span className="text-white">{e.text}</span>
          </li>
        ))}
      </ol>
    </Card>
  );
}

function RemediationCard() {
  return (
    <Card title="Remediation Actions">
      <ul>
        {REMEDIATION.map((r) => (
          <li key={r.text} className={`flex items-center justify-between gap-3 border-t py-2.5 text-xs first:border-t-0 ${DIVIDER}`}>
            <span className="flex items-center gap-2.5 text-white">
              <span aria-hidden className="grid h-4 w-4 place-items-center rounded-full bg-emerald-500 text-[9px] font-bold text-[#0e1a30]">✓</span>
              {r.text}
            </span>
            <span className="flex items-center gap-1.5 text-slate-200">
              <span aria-hidden className="h-3 w-3 rounded-full bg-emerald-500" />
              {r.status}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function AuditLogCard() {
  return (
    <Card title="Audit Log">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-left text-xs">
          <thead>
            <tr className={`border-b text-slate-300 ${DIVIDER}`}>
              {AUDIT_COLUMNS.map((c) => (
                <th key={c} scope="col" className="py-2.5 pr-4 font-medium">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {AUDIT.map((a) => (
              <tr key={a.id} className={`border-b last:border-b-0 ${DIVIDER}`}>
                <td className="py-2.5 pr-4 text-white">{a.id}</td>
                <td className="py-2.5 pr-4 text-white">{a.time}</td>
                <td className="py-2.5 pr-4"><Pill>{a.confidence}</Pill></td>
                <td className="py-2.5 pr-4 text-white">{a.reasoning}</td>
                <td className="py-2.5"><Pill>{a.similar} Similar Cases</Pill></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Overview() {
  return (
    <>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <IncidentSummaryCard />
        <AffectedSystemsCard />
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <EventTimelineCard />
        <RemediationCard />
      </div>
      <AuditLogCard />
    </>
  );
}

/* --------------------------------- page --------------------------------- */

export default function IncidentsPage() {
  const [tab, setTab] = useState<Tab>("Overview");

  return (
    <DashboardLayout>
      <div className="min-h-full bg-black p-4 sm:p-6" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", system-ui, sans-serif' }}>
        <div className="mx-auto max-w-[1200px] space-y-4">
          <TopBar />
          <div className="overflow-hidden rounded-xl bg-[#0b1426]">
            <BrandBar />
            <TabBar tab={tab} onChange={setTab} />
            <div id="incident-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="space-y-4 p-4 sm:p-5">
              {tab === "Overview" ? (
                <Overview />
              ) : (
                <p className={`py-20 text-center text-xs ${MUTED}`}>
                  No {tab.toLowerCase()} to show yet. Select Overview to see this incident’s summary.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}