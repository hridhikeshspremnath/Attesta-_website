"use client";

// src/app/incidents/page.tsx
// Attesta — Incidents & Response (CyberGuard incident detail).
// Dark fintech SaaS design. Tailwind only; no new dependencies.

import { useState, type ReactNode } from "react";

/* ------------------------- tokens + types ------------------------- */

const MUTED   = "text-slate-400";
const DIVIDER = "border-white/[0.06]";
const FOCUS   = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500";

const TABS = ["Overview", "Logs", "Actions", "Timeline"] as const;
type Tab = (typeof TABS)[number];

type Affected       = { name: string; state: string };
type TimelineEvent  = { time: string; text: string };
type Remediation    = { text: string; status: string };
type AuditEntry     = { id: string; time: string; confidence: string; reasoning: string; similar: number };

/* ----------------------------- data ----------------------------- */

const INCIDENT = {
  id:       "INC-12456",
  severity: "HIGH",
  status:   "Active",
  title:    "Ransomware Detected on Multiple Systems",
};

const AFFECTED: Affected[] = [
  { name: "Server-01",      state: "Infected" },
  { name: "Workstation-05", state: "Compromised" },
  { name: "Laptop-07",      state: "Infected" },
];

const TIMELINE: TimelineEvent[] = [
  { time: "10:15 AM", text: "Ransomware detected on Server-01" },
  { time: "10:20 AM", text: "Workstation-05 compromised" },
  { time: "10:32 AM", text: "Files encrypted on Laptop-07" },
  { time: "10:50 AM", text: "Alerts sent to security team" },
];

const REMEDIATION: Remediation[] = [
  { text: "Isolated Server-01",              status: "Completed" },
  { text: "Quarantined Workstation-05",      status: "Completed" },
  { text: "Removed Malware from Laptop-07", status: "Completed" },
];

const AUDIT: AuditEntry[] = [
  { id: "A5678", time: "10:52 AM", confidence: "92%", reasoning: "Isolated infected server",              similar: 3 },
  { id: "A5679", time: "11:00 AM", confidence: "92%", reasoning: "Quarantined compromised workstation",   similar: 2 },
  { id: "A5680", time: "11:10 AM", confidence: "92%", reasoning: "Removed ransomware from laptop",        similar: 4 },
];

const AUDIT_COLUMNS = ["Action ID", "Timestamp", "Confidence", "Reasoning", "Similar Incidents"];

/* --------------------------- primitives --------------------------- */

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-white/[0.07] bg-[#0D1117] px-5 pb-4 pt-4">
      <h2 className={`mb-2 border-b pb-2.5 text-sm font-semibold text-white ${DIVIDER}`}>{title}</h2>
      {children}
    </section>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return <span className="rounded-md bg-white/[0.08] px-2.5 py-0.5 text-xs text-white/80">{children}</span>;
}

function OutlineButton({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`h-8 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 text-xs font-medium text-white transition hover:bg-white/[0.08] ${FOCUS}`}
    >
      {children}
    </button>
  );
}

/* ----------------------------- tab bar ----------------------------- */

function TabBar({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-2 border-b px-4 sm:px-5 ${DIVIDER}`}>
      <div role="tablist" aria-label="Incident sections" className="flex">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            id={`tab-${t}`}
            aria-selected={tab === t}
            aria-controls="incident-panel"
            onClick={() => onChange(t)}
            className={`px-4 sm:px-6 py-3 text-xs transition ${FOCUS} ${
              tab === t
                ? "border-b-2 border-emerald-400 bg-white/[0.03] font-semibold text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="flex gap-2 py-2 flex-wrap">
        <OutlineButton onClick={() => {
          const headers = AUDIT_COLUMNS.join(",");
          const rows = AUDIT.map(a => `${a.id},${a.time},${a.confidence},"${a.reasoning}",${a.similar}`).join("\n");
          const blob = new Blob([headers + "\n" + rows], { type: "text/csv" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url; a.download = "incident-INC-12456.csv"; a.click();
          URL.revokeObjectURL(url);
        }}>Export CSV</OutlineButton>
        <OutlineButton onClick={() => {
          const data = { incident: INCIDENT, affected: AFFECTED, timeline: TIMELINE, remediation: REMEDIATION, audit: AUDIT };
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url; a.download = "incident-INC-12456.json"; a.click();
          URL.revokeObjectURL(url);
        }}>Export JSON</OutlineButton>
      </div>
    </div>
  );
}

/* ----------------------------- cards ----------------------------- */

function IncidentSummaryCard() {
  return (
    <Card title="Incident Summary">
      <div className="flex items-start gap-3 pt-2">
        <span className="rounded-lg bg-red-500/20 border border-red-500/30 px-3 py-2 text-xs font-bold text-red-400">
          {INCIDENT.severity}
        </span>
        <div className="space-y-1 text-xs text-slate-300">
          <p>Severity: <span className="text-red-400 font-semibold">{INCIDENT.severity}</span></p>
          <p>Incident ID: <span className="font-mono font-bold text-white">{INCIDENT.id}</span></p>
          <p>Status: <span className="font-semibold text-amber-400">{INCIDENT.status}</span></p>
        </div>
      </div>
      <p className="mt-3 pb-1 text-sm font-medium text-white">{INCIDENT.title}</p>
    </Card>
  );
}

function AffectedSystemsCard() {
  return (
    <Card title="Affected Systems">
      <ul className="space-y-2.5 pt-2">
        {AFFECTED.map((s) => (
          <li key={s.name} className="flex items-center gap-2.5 text-xs">
            <span aria-hidden className="h-2 w-2 rounded-full bg-red-400 flex-shrink-0" />
            <span className="text-white/90">{s.name}:</span>
            <span className="text-red-400 font-medium">{s.state}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function EventTimelineCard() {
  return (
    <Card title="Event Timeline">
      <ol className="space-y-0">
        {TIMELINE.map((e, i) => (
          <li key={e.time} className={`flex gap-3 py-2.5 text-xs ${i > 0 ? `border-t ${DIVIDER}` : ""}`}>
            <span className={`shrink-0 font-mono ${MUTED}`}>{e.time}</span>
            <span className="text-white/90">{e.text}</span>
          </li>
        ))}
      </ol>
    </Card>
  );
}

function RemediationCard() {
  return (
    <Card title="Remediation Actions">
      <ul className="space-y-0">
        {REMEDIATION.map((r, i) => (
          <li key={r.text} className={`flex items-center justify-between gap-3 py-2.5 text-xs ${i > 0 ? `border-t ${DIVIDER}` : ""}`}>
            <span className="flex items-center gap-2.5 text-white/90">
              <span aria-hidden className="grid h-4 w-4 flex-shrink-0 place-items-center rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[9px] font-bold text-emerald-400">✓</span>
              {r.text}
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
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
            <tr className={`border-b ${DIVIDER}`}>
              {AUDIT_COLUMNS.map((c) => (
                <th key={c} scope="col" className={`py-2 pr-4 text-[11px] font-medium ${MUTED}`}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {AUDIT.map((a) => (
              <tr key={a.id} className={`border-b last:border-b-0 ${DIVIDER}`}>
                <td className="py-2.5 pr-4 font-mono font-bold text-white">{a.id}</td>
                <td className="py-2.5 pr-4 text-white/80">{a.time}</td>
                <td className="py-2.5 pr-4"><Pill>{a.confidence}</Pill></td>
                <td className="py-2.5 pr-4 text-white/80">{a.reasoning}</td>
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
      <div className="grid items-start gap-4 sm:grid-cols-2">
        <IncidentSummaryCard />
        <AffectedSystemsCard />
      </div>
      <div className="grid items-start gap-4 sm:grid-cols-2">
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
    <div className="p-4 sm:p-6">
      {/* Page header */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M12 2l8 3v6c0 5-3.4 9.3-8 11-4.6-1.7-8-6-8-11V5l8-3z" stroke="#38bdf8" strokeWidth="1.8" />
              <path d="M9 8h6M12 8v7" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <h1 className="text-xl font-bold text-white tracking-tight">CyberGuard</h1>
          </div>
          <p className="mt-1 text-xs text-[#6B7280]">Incident ID: {INCIDENT.id} · {INCIDENT.status}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-bold text-red-400">
            {INCIDENT.severity}
          </span>
          <span className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-xs font-semibold text-amber-400">
            {INCIDENT.status}
          </span>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0A0F1A]">
        <TabBar tab={tab} onChange={setTab} />
        <div id="incident-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="space-y-4 p-4 sm:p-5">
          {tab === "Overview" ? (
            <Overview />
          ) : (
            <p className={`py-20 text-center text-xs ${MUTED}`}>
              No {tab.toLowerCase()} to show yet. Select <strong className="text-white">Overview</strong> to see this incident&apos;s summary.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
