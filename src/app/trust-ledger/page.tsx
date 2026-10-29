"use client";

// src/app/trust-ledger/page.tsx
// Attesta — Trust Ledger.
// Dark fintech SaaS design. Tailwind only; no new dependencies.

import type { ReactNode } from "react";
import Link from "next/link";

/* ------------------------- tokens + types ------------------------- */

type Tone = "green" | "amber" | "red" | "white";

const TONE_TEXT: Record<Tone, string> = {
  green: "text-emerald-400",
  amber: "text-amber-400",
  red:   "text-red-400",
  white: "text-white",
};

const MUTED   = "text-slate-400";
const DIVIDER = "border-white/[0.07]";

type Verification = "Valid" | "Not yet verified" | "Invalid";
type LedgerRow = { tx: string; block: string; time: string; type: string; subject: string; verification: Verification; href?: string };
type Field = { label: string; value: string; tone?: Tone };

const VERIFICATION_BADGE: Record<Verification, string> = {
  Valid: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
  "Not yet verified": "bg-amber-400/10 text-amber-400 border-amber-400/20",
  Invalid: "bg-red-400/10 text-red-400 border-red-400/20",
};

/* ----------------------------- data ----------------------------- */

const LEDGER: LedgerRow[] = [
  { tx: "0x8f4d92a1", block: "148,291", time: "13:55:19", type: "Signed decision", subject: "build-runner-1838", verification: "Valid", href: "/workload-identity" },
  { tx: "0x3c7e10b4", block: "148,289", time: "13:41:07", type: "Provenance record", subject: "run #1837", verification: "Valid", href: "/provenance" },
  { tx: "0x9a2f58e6", block: "148,276", time: "13:20:44", type: "Signed decision", subject: "test-runner-1836", verification: "Not yet verified", href: "/workload-identity" },
  { tx: "0x1b4c73d9", block: "148,252", time: "12:58:30", type: "Evidence reference", subject: "run #1835", verification: "Invalid", href: "/pipeline-runs" },
];

const NETWORK: Field[] = [
  { label: "Channel", value: "attesta-consortium-main" },
  { label: "Peers online", value: "4 of 4 active", tone: "green" },
  { label: "Block height", value: "148,294" },
  { label: "Consensus", value: "Raft (TLS v1.3)" },
];

const COLUMNS = ["Tx Hash", "Block", "Time (UTC)", "Record Type", "Subject", "Verification"];

/* --------------------------- primitives --------------------------- */

function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-white/[0.07] bg-[#0D1117] p-5">
      {title && <h2 className="mb-3 text-sm font-semibold text-white">{title}</h2>}
      {children}
    </section>
  );
}

/* ----------------------------- ledger ----------------------------- */

function LedgerTable() {
  return (
    <Card>
      <div className="flex items-center justify-between pb-3">
        <h2 className="text-sm font-semibold text-white">Committed Transactions</h2>
        <span className="text-[11px] text-[#6B7280]">Hyperledger Fabric Channel</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead>
            <tr className={`border-b text-slate-400 ${DIVIDER}`}>
              {COLUMNS.map((c) => (
                <th key={c} scope="col" className="py-2.5 pr-4 font-medium">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LEDGER.map((r) => (
              <tr key={r.tx} className={`border-t hover:bg-white/[0.025] transition-colors ${DIVIDER}`}>
                <td className="py-3 pr-4 font-mono font-semibold text-cyan-400">
                  {r.href ? (
                    <Link href={r.href} className="hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500">
                      {r.tx}
                    </Link>
                  ) : r.tx}
                </td>
                <td className="py-3 pr-4 font-mono text-white/90">{r.block}</td>
                <td className={`py-3 pr-4 font-mono text-[11px] ${MUTED}`}>{r.time}</td>
                <td className="py-3 pr-4 font-medium text-white">{r.type}</td>
                <td className="py-3 pr-4 font-mono text-white/90">{r.subject}</td>
                <td className="py-3">
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${VERIFICATION_BADGE[r.verification]}`}>
                    {r.verification}
                  </span>
                </td>
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
      <dl className="divide-y divide-white/[0.05]">
        {NETWORK.map((f) => (
          <div key={f.label} className="flex items-center justify-between gap-4 py-2 text-xs">
            <dt className={`shrink-0 ${MUTED}`}>{f.label}</dt>
            <dd className={`break-all text-right font-mono font-semibold ${TONE_TEXT[f.tone ?? "white"]}`}>{f.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function LedgerNote() {
  return (
    <Card title="Ledger Guarantee">
      <p className={`text-xs leading-relaxed ${MUTED}`}>
        Only cryptographically signed decisions, build provenance records, and immutable evidence references are committed to the distributed ledger. Ordinary pipeline telemetry remains in the high-throughput event store.
      </p>
    </Card>
  );
}

/* --------------------------------- page --------------------------------- */

export default function TrustLedgerPage() {
  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Trust Ledger</h1>
          <p className={`mt-0.5 text-xs ${MUTED}`}>Signed decisions and provenance references recorded on Hyperledger Fabric</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-amber-400/60 px-2.5 py-0.5 text-[10px] font-medium text-amber-300">
            Sample data
          </span>
          <button
            onClick={() => {
              const headers = COLUMNS.join(",");
              const rows = LEDGER.map(l => `${l.tx},${l.block},${l.time},"${l.type}","${l.subject}",${l.verification}`).join("\n");
              const blob = new Blob([headers + "\n" + rows], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url; a.download = "trust-ledger-export.csv"; a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white hover:bg-white/[0.08] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16" />
            </svg>
            Export Ledger
          </button>
        </div>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_300px]">
        <LedgerTable />
        <div className="space-y-4">
          <NetworkStatusCard />
          <LedgerNote />
        </div>
      </div>
    </div>
  );
}
