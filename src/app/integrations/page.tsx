"use client";

// src/app/integrations/page.tsx
// Attesta — Integrations & Settings.
// Dark fintech SaaS design. Tailwind only; no new dependencies.

import { useState, type ReactNode } from "react";

/* ------------------------- tokens ------------------------- */

const MUTED   = "text-slate-400";
const DIVIDER = "border-white/[0.07]";
const FOCUS   = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500";

type Tone = "green" | "amber";

const TABS = ["Integrations", "Users & roles", "Alerting"] as const;
type Tab = (typeof TABS)[number];

type Integration = { name: string; detail: string; status: "Connected" | "Not configured"; icon?: string };
type UserRow = { name: string; role: string; can: string; email: string };

/* ----------------------------- data ----------------------------- */

const INITIAL_INTEGRATIONS: Integration[] = [
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

/* --------------------------- primitives --------------------------- */

function Card({ title, action, children }: { title?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-white/[0.07] bg-[#0D1117] p-5">
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title && <h2 className="text-sm font-semibold text-white">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
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

/* ----------------------------- sections ----------------------------- */

function TabPills({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <div role="tablist" aria-label="Settings sections" className="flex gap-2">
      {TABS.map((t) => (
        <button
          key={t}
          role="tab"
          aria-selected={tab === t}
          onClick={() => onChange(t)}
          className={`rounded-full border px-3.5 py-1 text-xs font-medium transition ${FOCUS} ${
            tab === t
              ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-300 font-semibold"
              : "border-white/[0.08] text-slate-300 hover:bg-white/[0.04] hover:text-white"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

function IntegrationCard({
  i,
  onConfigure,
}: {
  i: Integration;
  onConfigure: (name: string) => void;
}) {
  const tone: Tone = i.status === "Connected" ? "green" : "amber";
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-white">{i.name}</h3>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
          tone === "green"
            ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-400"
            : "border-amber-400/20 bg-amber-400/10 text-amber-400"
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${tone === "green" ? "bg-emerald-400" : "bg-amber-400"}`} />
          {i.status}
        </span>
      </div>
      <p className={`mt-2 text-xs leading-relaxed ${MUTED}`}>{i.detail}</p>
      <div className="mt-4">
        <OutlineButton onClick={() => onConfigure(i.name)}>
          {i.status === "Connected" ? "Manage Settings" : "Configure Connection"}
        </OutlineButton>
      </div>
    </Card>
  );
}

function IntegrationGrid({
  items,
  onConfigure,
}: {
  items: Integration[];
  onConfigure: (name: string) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((i) => (
        <IntegrationCard key={i.name} i={i} onConfigure={onConfigure} />
      ))}
    </div>
  );
}

function UsersTable() {
  return (
    <Card title="Team members & permissions">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-xs">
          <thead>
            <tr className={`border-b text-slate-400 ${DIVIDER}`}>
              <th scope="col" className="py-2.5 pr-4 font-medium">User</th>
              <th scope="col" className="py-2.5 pr-4 font-medium">Email</th>
              <th scope="col" className="py-2.5 pr-4 font-medium">Role</th>
              <th scope="col" className="py-2.5 font-medium">Permissions</th>
            </tr>
          </thead>
          <tbody>
            {USERS.map((u) => (
              <tr key={u.email} className={`border-t hover:bg-white/[0.025] transition-colors ${DIVIDER}`}>
                <td className="py-3 pr-4 font-semibold text-white">{u.name}</td>
                <td className="py-3 pr-4 font-mono text-slate-400">{u.email}</td>
                <td className="py-3 pr-4">
                  <span className="rounded-md bg-white/[0.08] px-2 py-0.5 text-[10px] font-semibold text-white">
                    {u.role}
                  </span>
                </td>
                <td className={`py-3 text-slate-300`}>{u.can}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* --------------------------------- page --------------------------------- */

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("Integrations");
  const [integrations, setIntegrations] = useState<Integration[]>(INITIAL_INTEGRATIONS);
  const [activeConfig, setActiveConfig] = useState<string | null>(null);

  const handleConfigure = (name: string) => {
    setActiveConfig(name);
  };

  const handleToggleStatus = (name: string) => {
    setIntegrations((prev) =>
      prev.map((item) =>
        item.name === name
          ? {
              ...item,
              status: item.status === "Connected" ? "Not configured" : "Connected",
            }
          : item
      )
    );
    setActiveConfig(null);
  };

  const alerting = integrations.filter((i) => i.name === "Alerting");

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Integrations & Settings</h1>
          <p className={`mt-0.5 text-xs ${MUTED}`}>Manage external connections, consortium members, and identity providers</p>
        </div>
        <span className="rounded-full border border-amber-400/60 px-2.5 py-0.5 text-[10px] font-medium text-amber-300">
          Sample data
        </span>
      </div>

      <TabPills tab={tab} onChange={setTab} />

      {tab === "Integrations" && (
        <div className="space-y-4">
          <IntegrationGrid items={integrations} onConfigure={handleConfigure} />
          <UsersTable />
        </div>
      )}

      {tab === "Users & roles" && <UsersTable />}

      {tab === "Alerting" && (
        <div className="space-y-4">
          <IntegrationGrid items={alerting} onConfigure={handleConfigure} />
          <Card title="Alert Notification Rules">
            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-center justify-between py-2 border-b border-white/[0.05]">
                <span>Notify on HIGH severity incidents</span>
                <span className="text-emerald-400 font-semibold">Enabled</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/[0.05]">
                <span>Notify on SVID expiration within 15 minutes</span>
                <span className="text-emerald-400 font-semibold">Enabled</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span>Notify on policy check DENY spikes (&gt;50 in 1 hour)</span>
                <span className="text-emerald-400 font-semibold">Enabled</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Configuration Dialog Modal */}
      {activeConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-white/[0.1] bg-[#0D1117] p-5 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">
              Configure {activeConfig}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Update authentication tokens, certificates, or endpoints for this service.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Endpoint URL / Target</label>
                <input
                  type="text"
                  readOnly
                  value={`https://api.${activeConfig.toLowerCase().replace(/\s+/g, "-")}.attesta.internal`}
                  className="w-full rounded-lg border border-white/[0.08] bg-[#080C14] px-3 py-2 text-xs text-slate-300"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Secret / Token</label>
                <input
                  type="password"
                  readOnly
                  value="••••••••••••••••••••••••••••••••"
                  className="w-full rounded-lg border border-white/[0.08] bg-[#080C14] px-3 py-2 text-xs text-slate-300 font-mono"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setActiveConfig(null)}
                className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/[0.05]"
              >
                Close
              </button>
              <button
                onClick={() => handleToggleStatus(activeConfig)}
                className="rounded-lg bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30"
              >
                Toggle Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
