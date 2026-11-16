"use client";

// src/app/integrations/page.tsx
// Attesta — Integrations & Settings.
// Tailwind only; no new dependencies.

import { useState } from "react";
import PageHeader from "@/src/components/ui/PageHeader";
import { Badge, Button, Card, Dialog, SampleBadge, Tabs, tabId } from "@/src/components/ui/primitives";

/* ------------------------- tokens ------------------------- */

const TABS = ["Integrations", "Users & roles", "Alerting"] as const;
type Tab = (typeof TABS)[number];

const PANEL_ID = "settings-panel";

type Integration = { name: string; detail: string; status: "Connected" | "Not configured" };
type UserRow = { name: string; role: string; can: string; email: string };

/* ----------------------------- data ----------------------------- */

const INTEGRATIONS: Integration[] = [
  { name: "GitHub",             detail: "Webhook, HMAC secret, 4 active repositories synced", status: "Connected" },
  { name: "SPIRE",              detail: "Trust domain attesta.dev, Node & Workload Attestor", status: "Connected" },
  { name: "OPA",                detail: "Policy bundle v7.1.0, active decision logger",       status: "Connected" },
  { name: "Hyperledger Fabric", detail: "Channel attesta-consortium-main, raft consensus",   status: "Connected" },
  { name: "ML package model",   detail: "Inference endpoint https://ml.attesta.local, v1.4.2", status: "Connected" },
  { name: "Alerting",           detail: "PagerDuty, Slack webhook, email notifications",       status: "Not configured" },
];

const USERS: UserRow[] = [
  { name: "Sarah Connor",  role: "Admin",    can: "Configure, respond, approve", email: "sarah.c@attesta.dev" },
  { name: "Alex Chen",     role: "Analyst",  can: "Investigate, request actions", email: "alex.chen@attesta.dev" },
  { name: "David Kim",     role: "Auditor",  can: "Read only, export reports",    email: "david.kim@attesta.dev" },
];

const ALERT_RULES = [
  "Notify on HIGH severity incidents",
  "Notify on SVID expiration within 15 minutes",
  "Notify on policy check DENY spikes (>50 in 1 hour)",
];

/* ----------------------------- sections ----------------------------- */

function IntegrationCard({ i, onManage }: { i: Integration; onManage: (i: Integration) => void }) {
  const connected = i.status === "Connected";
  return (
    <section className="card flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-fg">{i.name}</h3>
        <Badge tone={connected ? "ok" : "warn"}>{i.status}</Badge>
      </div>
      <p className="mt-2 flex-1 text-xs leading-relaxed text-muted">{i.detail}</p>
      <div className="mt-4">
        <Button size="sm" onClick={() => onManage(i)}>View configuration</Button>
      </div>
    </section>
  );
}

function IntegrationGrid({ items, onManage }: { items: Integration[]; onManage: (i: Integration) => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((i) => <IntegrationCard key={i.name} i={i} onManage={onManage} />)}
    </div>
  );
}

function UsersTable() {
  return (
    <Card title="Team members & permissions" flush>
      <div className="overflow-x-auto">
        <table className="data-table min-w-[620px]">
          <thead>
            <tr>
              {["User", "Email", "Role", "Permissions"].map((h) => <th key={h} scope="col">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {USERS.map((u) => (
              <tr key={u.email}>
                <td className="font-medium text-fg">{u.name}</td>
                <td className="font-mono text-muted">{u.email}</td>
                <td><Badge>{u.role}</Badge></td>
                <td className="text-fg">{u.can}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function AlertRules({ channelConnected }: { channelConnected: boolean }) {
  return (
    <Card title="Alert notification rules">
      <ul className="divide-y divide-line text-xs">
        {ALERT_RULES.map((rule) => (
          <li key={rule} className="flex items-center justify-between gap-4 py-2.5 first:pt-0">
            <span className="text-fg">{rule}</span>
            <Badge tone="neutral">Rule on</Badge>
          </li>
        ))}
      </ul>
      {!channelConnected && (
        <p className="mt-2 border-t border-line pt-3 text-xs text-warn">
          No delivery channel is configured, so these rules do not send notifications yet.
        </p>
      )}
    </Card>
  );
}

function ConfigDialog({ integration, onClose }: { integration: Integration; onClose: () => void }) {
  const slug = integration.name.toLowerCase().replace(/\s+/g, "-");
  return (
    <Dialog
      title={integration.name}
      description="Sample configuration. Changes require the integrations API, which is not connected in this build."
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Close</Button>
          <Button variant="primary" disabled title="Integrations API not connected">Save changes</Button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <label htmlFor="config-endpoint" className="field-label">Endpoint URL / target</label>
          <input id="config-endpoint" type="text" readOnly value={`https://api.${slug}.attesta.internal`} className="field" />
        </div>
        <div>
          <label htmlFor="config-secret" className="field-label">Secret / token</label>
          <input id="config-secret" type="text" readOnly value="Hidden. Never shown after saving." className="field" />
        </div>
      </div>
    </Dialog>
  );
}

/* --------------------------------- page --------------------------------- */

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("Integrations");
  const [active, setActive] = useState<Integration | null>(null);

  const alerting = INTEGRATIONS.filter((i) => i.name === "Alerting");

  return (
    <div className="page">
      <PageHeader
        title="Integrations & Settings"
        subtitle="External connections, team access and alert routing"
        badges={<SampleBadge />}
      />

      <Tabs tabs={TABS} value={tab} onChange={setTab} label="Settings sections" panelId={PANEL_ID} />

      <div id={PANEL_ID} role="tabpanel" aria-labelledby={tabId(PANEL_ID, tab)} className="space-y-4">
        {tab === "Integrations" && <IntegrationGrid items={INTEGRATIONS} onManage={setActive} />}

        {tab === "Users & roles" && <UsersTable />}

        {tab === "Alerting" && (
          <>
            <IntegrationGrid items={alerting} onManage={setActive} />
            <AlertRules channelConnected={alerting.every((i) => i.status === "Connected")} />
          </>
        )}
      </div>

      {active && <ConfigDialog integration={active} onClose={() => setActive(null)} />}
    </div>
  );
}
