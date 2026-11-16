"use client";

// src/app/incidents/page.tsx
// Attesta — Incidents & Response (incident detail).
// Tailwind only; no new dependencies.

import { useState } from "react";
import PageHeader from "@/src/components/ui/PageHeader";
import { Badge, Button, Card, EmptyState, SampleBadge, StatusDot, Tabs, tabId } from "@/src/components/ui/primitives";
import { downloadFile, toCsv } from "@/src/lib/download";

/* ------------------------- tokens + types ------------------------- */

const TABS = ["Overview", "Logs", "Actions", "Timeline"] as const;
type Tab = (typeof TABS)[number];

const PANEL_ID = "incident-panel";

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

const AUDIT_COLUMNS = ["Action ID", "Timestamp", "Confidence", "Reasoning", "Similar incidents"];

/* ----------------------------- export ----------------------------- */

function exportCsv() {
  const rows = AUDIT.map((a) => [a.id, a.time, a.confidence, a.reasoning, a.similar]);
  downloadFile(`incident-${INCIDENT.id}-sample.csv`, "text/csv", toCsv(AUDIT_COLUMNS, rows));
}

function exportJson() {
  const data = { dataSource: "sample", incident: INCIDENT, affected: AFFECTED, timeline: TIMELINE, remediation: REMEDIATION, audit: AUDIT };
  downloadFile(`incident-${INCIDENT.id}-sample.json`, "application/json", JSON.stringify(data, null, 2));
}

/* ----------------------------- cards ----------------------------- */

function IncidentSummaryCard() {
  return (
    <Card title="Incident summary">
      <p className="text-sm font-medium text-fg">{INCIDENT.title}</p>
      <dl className="mt-3 grid grid-cols-3 gap-3 text-xs">
        <div>
          <dt className="text-muted">Severity</dt>
          <dd className="mt-1"><Badge tone="crit">{INCIDENT.severity}</Badge></dd>
        </div>
        <div>
          <dt className="text-muted">Status</dt>
          <dd className="mt-1"><Badge tone="warn">{INCIDENT.status}</Badge></dd>
        </div>
        <div>
          <dt className="text-muted">Incident ID</dt>
          <dd className="mt-1 font-mono text-fg">{INCIDENT.id}</dd>
        </div>
      </dl>
    </Card>
  );
}

function AffectedSystemsCard() {
  return (
    <Card title="Affected systems">
      <ul className="divide-y divide-line">
        {AFFECTED.map((s) => (
          <li key={s.name} className="flex items-center justify-between gap-3 py-2 text-xs first:pt-0 last:pb-0">
            <span className="flex items-center gap-2.5 text-fg"><StatusDot tone="crit" />{s.name}</span>
            <span className="font-medium text-crit">{s.state}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function EventTimelineCard() {
  return (
    <Card title="Event timeline">
      <ol className="divide-y divide-line">
        {TIMELINE.map((e) => (
          <li key={e.time} className="flex gap-4 py-2.5 text-xs first:pt-0 last:pb-0">
            <span className="tabnum w-16 shrink-0 font-mono text-muted">{e.time}</span>
            <span className="text-fg">{e.text}</span>
          </li>
        ))}
      </ol>
    </Card>
  );
}

function RemediationCard() {
  return (
    <Card title="Remediation actions">
      <ul className="divide-y divide-line">
        {REMEDIATION.map((r) => (
          <li key={r.text} className="flex items-center justify-between gap-3 py-2.5 text-xs first:pt-0 last:pb-0">
            <span className="text-fg">{r.text}</span>
            <Badge tone="ok">{r.status}</Badge>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function AuditLogCard() {
  return (
    <Card title="Audit log" flush>
      <div className="overflow-x-auto">
        <table className="data-table min-w-[640px]">
          <thead>
            <tr>{AUDIT_COLUMNS.map((c) => <th key={c} scope="col">{c}</th>)}</tr>
          </thead>
          <tbody>
            {AUDIT.map((a) => (
              <tr key={a.id}>
                <td className="font-mono text-fg">{a.id}</td>
                <td className="tabnum whitespace-nowrap text-muted">{a.time}</td>
                <td className="tabnum text-fg">{a.confidence}</td>
                <td className="text-fg">{a.reasoning}</td>
                <td className="tabnum whitespace-nowrap text-muted">{a.similar} similar cases</td>
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
      <div className="grid items-start gap-4 md:grid-cols-2">
        <IncidentSummaryCard />
        <AffectedSystemsCard />
      </div>
      <div className="grid items-start gap-4 md:grid-cols-2">
        <EventTimelineCard />
        <RemediationCard />
      </div>
      <AuditLogCard />
    </>
  );
}

function TabContent({ tab }: { tab: Tab }) {
  switch (tab) {
    case "Overview":
      return <Overview />;
    case "Actions":
      return (
        <>
          <RemediationCard />
          <AuditLogCard />
        </>
      );
    case "Timeline":
      return <EventTimelineCard />;
    case "Logs":
      return (
        <div className="card">
          <EmptyState title="No log source connected">
            Raw logs for this incident are not available in this build. Correlated events are in Event Explorer.
          </EmptyState>
        </div>
      );
  }
}

/* --------------------------------- page --------------------------------- */

export default function IncidentsPage() {
  const [tab, setTab] = useState<Tab>("Overview");

  return (
    <div className="page">
      <PageHeader
        title="Incidents & Response"
        subtitle={<>Incident <span className="font-mono">{INCIDENT.id}</span></>}
        badges={
          <>
            <SampleBadge />
            <Badge tone="crit">{INCIDENT.severity}</Badge>
            <Badge tone="warn">{INCIDENT.status}</Badge>
          </>
        }
        actions={
          <>
            <Button onClick={exportCsv}>Export CSV</Button>
            <Button onClick={exportJson}>Export JSON</Button>
          </>
        }
      />

      <Tabs tabs={TABS} value={tab} onChange={setTab} label="Incident sections" panelId={PANEL_ID} />
      <div id={PANEL_ID} role="tabpanel" aria-labelledby={tabId(PANEL_ID, tab)} className="space-y-4">
        <TabContent tab={tab} />
      </div>
    </div>
  );
}
