"use client";

// src/app/settings/page.tsx
// Attesta — Integrations & Settings. Same conventions as workload-identity/page.tsx.

import { useState, type ReactNode } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";

/* ------------------------- tokens ------------------------- */

const MUTED = "text-slate-400";
const DIVIDER = "border-white/[0.06]";
const FOCUS = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400";

type Tone = "green" | "amber";
const TONE_TEXT: Record<Tone, string> = { green: "text-emerald-400", amber: "text-amber-400" };

const TABS = ["Integrations", "Users & roles", "Alerting"] as const;
type Tab = (typeof TABS)[number];

type Integration = { name: string; detail: string; status: "Connected" | "Not configured" };
type UserRow = { name: string; role: string; can: string };

/* ----------------------------- data ----------------------------- */

const INTEGRATIONS: Integration[] = [
  { name: "GitHub", detail: "Webhook, HMAC secret, repositories", status: "Connected" },
  { name: "SPIRE", detail: "Trust domain [domain], attestation", status: "Connected" },
  { name: "OPA", detail: "Policy bundle [version]", status: "Connected" },
  { name: "Hyperledger Fabric", detail: "Channel [channel], chaincode", status: "Connected" },
  { name: "ML package model", detail: "Endpoint, model [version]", status: "Connected" },
  { name: "Alerting", detail: "Email, Slack, webhook", status: "Not configured" },
];

const USERS: UserRow[] = [
  { name: "[name]", role: "Admin", can: "Configure, respond, approve" },
  { name: "[name]", role: "Analyst", can: "Investigate, request actions" },
  { name: "[name]", role: "Viewer", can: "Read only" },
];

/* --------------------------- primitives --------------------------- */

function Card({ title, action, children }: { title?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-white/5 bg-[#0e1a30] px-4 pb-3 pt-3.5">
      {(title || action) && (
        <div className="mb-1 flex items-center justify-between gap-3">
          {title && <h2 className="text-xs font-bold text-white">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

function SampleChip() {
  return (
    <span className="rounded-full border border-amber-400 px-2.5 py-0.5 text-[10px] font-medium text-amber-300">
      Sample data
    </span>
  );
}

function OutlineButton({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`h-8 rounded-md border border-white/10 bg-white/5 px-3 text-xs font-medium text-white transition hover:bg-white/10 motion-reduce:transition-none ${FOCUS}`}
    >
      {children}
    </button>
  );
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
          className={`rounded-full border px-3 py-1 text-[10px] font-medium transition motion-reduce:transition-none ${FOCUS} ${
            tab === t ? "border-sky-400 text-sky-300" : "border-white/15 text-slate-300 hover:text-white"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

function IntegrationCard({ i }: { i: Integration }) {
  const tone: Tone = i.status === "Connected" ? "green" : "amber";
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-xs font-bold text-white">{i.name}</h3>
        <span className={`text-xs font-medium ${TONE_TEXT[tone]}`}>{i.status}</span>
      </div>
      <p className={`mt-1.5 text-[11px] ${MUTED}`}>{i.detail}</p>
      <div className="mt-3">
        <OutlineButton>Configure</OutlineButton>
      </div>
    </Card>
  );
}

function IntegrationGrid({ items }: { items: Integration[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((i) => <IntegrationCard key={i.name} i={i} />)}
    </div>
  );
}

function UsersTable() {
  return (
    <Card title="Users & roles">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-xs">
          <thead>
            <tr className={MUTED}>
              <th scope="col" className="w-[45%] py-2.5 pr-4 font-normal">User</th>
              <th scope="col" className="w-[15%] py-2.5 pr-4 font-normal">Role</th>
              <th scope="col" className="py-2.5 font-normal">Can</th>
            </tr>
          </thead>
          <tbody>
            {USERS.map((u) => (
              <tr key={u.role} className={`border-t ${DIVIDER}`}>
                <td className="py-3 pr-4 font-mono font-bold text-white">{u.name}</td>
                <td className="py-3 pr-4 font-bold text-white">{u.role}</td>
                <td className={`py-3 ${MUTED}`}>{u.can}</td>
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
  const alerting = INTEGRATIONS.filter((i) => i.name === "Alerting");

  return (
    <DashboardLayout>
      <div className="min-h-full bg-black p-4 sm:p-6" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", system-ui, sans-serif' }}>
        <div className="mx-auto max-w-[1200px] space-y-4">
          <TopBar />
          <div className="space-y-4 rounded-xl bg-[#0b1426] p-4 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-xl font-bold tracking-tight text-white">Integrations & Settings</h1>
              <SampleChip />
            </div>
            <TabPills tab={tab} onChange={setTab} />
            {tab === "Integrations" && (
              <>
                <IntegrationGrid items={INTEGRATIONS} />
                <UsersTable />
              </>
            )}
            {tab === "Users & roles" && <UsersTable />}
            {tab === "Alerting" && <IntegrationGrid items={alerting} />}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}