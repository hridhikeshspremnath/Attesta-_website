// src/app/trust-ledger/page.tsx
// Attesta — Trust Ledger. Same conventions as workload-identity/page.tsx.
// Tailwind only; no new dependencies.

import type { ReactNode } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";

/* ------------------------- tokens + types ------------------------- */

type Tone = "green" | "amber" | "red" | "white";

const TONE_TEXT: Record<Tone, string> = {
  green: "text-emerald-400",
  amber: "text-amber-400",
  red: "text-red-400",
  white: "text-white",
};

const MUTED = "text-slate-400";
const DIVIDER = "border-white/[0.06]";
const FOCUS = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400";

type Verification = "Valid" | "Not yet verified" | "Invalid";
type LedgerRow = { tx: string; block: string; time: string; type: string; subject: string; verification: Verification };
type Field = { label: string; value: string; tone?: Tone };

const VERIFICATION_TONE: Record<Verification, Tone> = {
  Valid: "green",
  "Not yet verified": "amber",
  Invalid: "red",
};

/* ----------------------------- data ----------------------------- */

const LEDGER: LedgerRow[] = [
  { tx: "[tx-id]", block: "[n]", time: "13:55:19", type: "Signed decision", subject: "build-runner-1838", verification: "Valid" },
  { tx: "[tx-id]", block: "[n]", time: "13:41:07", type: "Provenance record", subject: "run #1837", verification: "Valid" },
  { tx: "[tx-id]", block: "[n]", time: "13:20:44", type: "Signed decision", subject: "test-runner-1836", verification: "Not yet verified" },
  { tx: "[tx-id]", block: "[n]", time: "12:58:30", type: "Evidence reference", subject: "run #1835", verification: "Invalid" },
];

const NETWORK: Field[] = [
  { label: "Channel", value: "[channel]" },
  { label: "Peers online", value: "[n] of [n]", tone: "green" },
  { label: "Block height", value: "[n]" },
];

const COLUMNS = ["Tx ID", "Block", "Time", "Type", "Subject", "Verification"];

/* --------------------------- primitives --------------------------- */

function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-white/5 bg-[#0e1a30] px-4 pb-3 pt-3.5">
      {title && <h2 className="mb-1 text-xs font-bold text-white">{title}</h2>}
      {children}
    </section>
  );
}

function OutlineChip({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-amber-400 px-2.5 py-0.5 text-[10px] font-medium text-amber-300">
      {children}
    </span>
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

function PageTitle() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white">Trust Ledger</h1>
        <p className={`mt-1 text-xs ${MUTED}`}>Signed decisions and provenance references recorded on Hyperledger Fabric</p>
      </div>
      <OutlineChip>Sample data</OutlineChip>
    </div>
  );
}

/* ----------------------------- ledger ----------------------------- */

function LedgerTable() {
  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-left text-xs">
          <thead>
            <tr className="text-slate-300">
              {COLUMNS.map((c) => (
                <th key={c} scope="col" className="py-2.5 pr-4 font-medium">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LEDGER.map((r) => (
              <tr key={r.time} className={`border-t ${DIVIDER}`}>
                <td className="py-3 pr-4 font-mono font-bold text-sky-400">{r.tx}</td>
                <td className="py-3 pr-4 font-mono font-bold text-white">{r.block}</td>
                <td className={`py-3 pr-4 font-mono text-[11px] ${MUTED}`}>{r.time}</td>
                <td className="py-3 pr-4 font-medium text-white">{r.type}</td>
                <td className="py-3 pr-4 font-mono font-bold text-white">{r.subject}</td>
                <td className={`py-3 font-medium ${TONE_TEXT[VERIFICATION_TONE[r.verification]]}`}>{r.verification}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function NetworkStatusCard() {
  return (
    <Card title="Network status">
      <dl>
        {NETWORK.map((f) => (
          <div key={f.label} className="flex items-start justify-between gap-4 py-1.5 text-xs">
            <dt className={`shrink-0 ${MUTED}`}>{f.label}</dt>
            <dd className={`break-all text-right font-mono font-bold ${TONE_TEXT[f.tone ?? "white"]}`}>{f.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function LedgerNote() {
  return (
    <Card>
      <p className={`text-[11px] leading-relaxed ${MUTED}`}>
        Only signed decisions, provenance records and evidence references are written to the ledger. Ordinary telemetry stays in the event store.
      </p>
    </Card>
  );
}

/* --------------------------------- page --------------------------------- */

export default function TrustLedgerPage() {
  return (
    <DashboardLayout>
      <div className="min-h-full bg-black p-4 sm:p-6" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", system-ui, sans-serif' }}>
        <div className="mx-auto max-w-[1200px] space-y-4">
          <TopBar />
          <div className="space-y-4 rounded-xl bg-[#0b1426] p-4 sm:p-6">
            <PageTitle />
            <div className="grid items-start gap-4 lg:grid-cols-[1fr_280px]">
              <LedgerTable />
              <div className="space-y-4">
                <NetworkStatusCard />
                <LedgerNote />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}