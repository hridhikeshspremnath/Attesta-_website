"use client";

// src/app/provenance/page.tsx
// Attesta — Provenance & Verification & Correlated Event Explorer.
// Dark fintech SaaS design. Tailwind only; no new dependencies.

import { useState, type ReactNode } from "react";
import Link from "next/link";

/* ------------------------- tokens ------------------------- */

const MUTED   = "text-slate-400";
const DIVIDER = "border-white/[0.07]";
const FOCUS   = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500";

/* ----------------------------- data ----------------------------- */

type Severity = "High" | "Medium" | "Info";
const SEVERITY_TONE: Record<Severity, string> = {
  High:   "text-red-400 bg-red-400/10 border-red-400/20",
  Medium: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  Info:   "text-slate-400 bg-slate-400/10 border-slate-400/20",
};

const TOTAL_EVENTS = 214;

type EventRow = { id: string; time: string; workload: string; event: string; source: string; severity: Severity };
type Evidence = { label: string; value: string; href?: string };

const FILTERS = ["Last 24 h", "Severity: any", "Source: any", "Workload: any", "Run ID", "Request ID"];

const EVENTS: EventRow[] = [
  { id: "e1", time: "14:02:11", workload: "build-runner-1842", event: "Read protected secret denied", source: "OPA", severity: "High" },
  { id: "e2", time: "14:02:14", workload: "build-runner-1842", event: "Credential access alert", source: "Runtime", severity: "High" },
  { id: "e3", time: "14:01:52", workload: "build-runner-1842", event: "Dependency flagged by model", source: "ML model", severity: "Medium" },
  { id: "e4", time: "14:01:48", workload: "deploy-runner-1841", event: "SVID issued", source: "Attestation", severity: "Info" },
  { id: "e5", time: "14:00:30", workload: "test-runner-1840", event: "Attestation failed", source: "Attestation", severity: "High" },
  { id: "e6", time: "13:58:02", workload: "build-runner-1839", event: "Trust gate sent to review", source: "Trust gate", severity: "Medium" },
  { id: "e7", time: "13:55:19", workload: "build-runner-1838", event: "Decision signed · tx recorded", source: "Ledger", severity: "Info" },
];

const DETAIL = {
  e1: {
    observed: "Observed: request denied. Interpretation: possible misuse, unconfirmed.",
    ids: [
      { label: "Event ID", value: "evt-01J4NYPC3RT2" },
      { label: "Request ID", value: "req-9824-sec-read" },
      { label: "Trace ID", value: "trace-44a1-89bc" },
    ] as Evidence[],
    evidence: [
      { label: "OPA rule", value: "secrets.read v7", href: "/access-policies" },
      { label: "Workload and SVID", value: "build-runner-1842", href: "/workload-identity" },
      { label: "Trust decision", value: "Review", href: "/access-policies" },
      { label: "GitHub run", value: "#1842", href: "/pipeline-runs" },
      { label: "Runtime alert", value: "Credential access", href: "/runtime-monitoring" },
      { label: "Signed record", value: "tx 0x8f4d92a1", href: "/trust-ledger" },
    ] as Evidence[],
  },
} as Record<string, { observed: string; ids: Evidence[]; evidence: Evidence[] }>;

const FALLBACK_IDS: Evidence[] = [
  { label: "Event ID", value: "evt-gen-009182" },
  { label: "Request ID", value: "req-gen-102938" },
  { label: "Trace ID", value: "trace-gen-7718" },
];

type Tone = "green" | "amber" | "red";
const TONE_TEXT: Record<Tone, string> = {
  green: "text-emerald-400",
  amber: "text-amber-400",
  red:   "text-red-400",
};

type Row = { label: string; value: string; accent?: boolean; href?: string };
type Check = { name: string; detail: string; result: string; tone: Tone };

const RUN = "#1842";
const DECISION_ID = "dec-01J4NYPC";

const BUILD: Row[] = [
  { label: "Source revision", value: "git:sha-9f82d1c", href: "https://github.com" },
  { label: "Workflow identity", value: "org/repo/.github/workflows/ci.yml@main" },
  { label: "Builder", value: "github-hosted-runner-ubuntu-24.04" },
  { label: "Started / finished", value: "14:08:42 / pending" },
  { label: "Workload identity", value: "spiffe://attesta.dev/ns/ci/sa/build-runner-1842", href: "/workload-identity" },
  { label: "Ledger tx", value: "0x8f4d92a1", accent: true, href: "/trust-ledger" },
];

const INITIAL_CHECKS: Check[] = [
  { name: "Signature", detail: "Checked against signer public key", result: "Valid", tone: "green" },
  { name: "Trusted signer", detail: "Signer certificate is in the trusted consortium set", result: "Valid", tone: "green" },
  { name: "Record integrity", detail: "SHA-256 stored record matches cryptographic payload", result: "Valid", tone: "green" },
  { name: "Ledger match", detail: "Hyperledger Fabric state equals signed attestation", result: "Not yet verified", tone: "amber" },
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

/* ------------------------- event explorer ------------------------- */

function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
      </div>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Search events"
        placeholder="Search events, IDs, SPIFFE IDs, rules..."
        className={`w-full rounded-xl border border-white/[0.07] bg-[#0A0F1A] pl-9 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 ${FOCUS}`}
      />
    </div>
  );
}

function FilterBar() {
  const [activeFilter, setActiveFilter] = useState("Last 24 h");
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium transition ${FOCUS} ${
              activeFilter === f
                ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-300"
                : "border-white/[0.1] text-slate-300 hover:bg-white/[0.05] hover:text-white"
            }`}
          >
            {f}
          </button>
        ))}
      </div>
      <button
        onClick={() => alert("Filter configuration saved to profile preferences.")}
        className={`text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors ${FOCUS}`}
      >
        Save filter
      </button>
    </div>
  );
}

function EventTable({ rows, selected, onSelect }: { rows: EventRow[]; selected: string; onSelect: (id: string) => void }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0A0F1A]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-xs">
          <thead>
            <tr className={`border-b text-slate-400 ${DIVIDER}`}>
              {["Time", "Workload", "Event", "Source", "Severity"].map((h, i) => (
                <th key={h} scope="col" className={`py-2.5 font-medium ${i === 0 ? "px-4" : "px-3"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const active = r.id === selected;
              return (
                <tr
                  key={r.id}
                  onClick={() => onSelect(r.id)}
                  aria-selected={active}
                  className={`cursor-pointer border-t transition-colors ${DIVIDER} ${active ? "bg-[#111d36]" : "hover:bg-white/[0.025]"}`}
                >
                  <td className={`py-2.5 px-4 font-mono text-[11px] ${MUTED}`}>{r.time}</td>
                  <td className="py-2.5 px-3 font-mono font-semibold text-white">
                    {r.workload}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-white/90">{r.event}</td>
                  <td className={`py-2.5 px-3 ${MUTED}`}>{r.source}</td>
                  <td className="py-2.5 px-3 pr-4">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-semibold ${SEVERITY_TONE[r.severity]}`}>
                      {r.severity}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className={`border-t px-4 py-2.5 text-[10px] ${DIVIDER} ${MUTED}`}>{rows.length} of {TOTAL_EVENTS} events · live tail on</p>
    </div>
  );
}

function KeyValue({ items, mono }: { items: Evidence[]; mono?: boolean }) {
  return (
    <dl className="divide-y divide-white/[0.05]">
      {items.map((f) => (
        <div key={f.label} className="flex items-start justify-between gap-4 py-1.5 text-xs">
          <dt className={`shrink-0 ${MUTED}`}>{f.label}</dt>
          <dd className="break-all text-right font-medium">
            {f.href ? (
              <Link href={f.href} className="text-cyan-400 hover:underline">
                {f.value}
              </Link>
            ) : (
              <span className={mono ? "font-mono font-semibold text-white" : "text-cyan-300"}>
                {f.value}
              </span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function EventDetail({ event }: { event: EventRow }) {
  const d = DETAIL[event.id];
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/event-explorer?event=${event.id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/[0.07] bg-[#0A0F1A] p-4">
      <h2 className="text-xs font-bold text-white">{event.event}</h2>
      {d && <p className={`mt-1 text-[11px] leading-snug ${MUTED}`}>{d.observed}</p>}
      <div className="mt-3">
        <KeyValue items={d?.ids ?? FALLBACK_IDS} mono />
      </div>
      <h3 className="mb-1 mt-3 text-xs font-bold text-white">Correlated evidence</h3>
      {d ? (
        <KeyValue items={d.evidence} />
      ) : (
        <p className={`py-2 text-[11px] ${MUTED}`}>No correlated evidence recorded for this event.</p>
      )}
      <div className="mt-4 flex gap-2 flex-wrap">
        <Link
          href="/incidents"
          className={`h-8 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 inline-flex items-center text-xs font-medium text-white transition hover:bg-white/[0.08] ${FOCUS}`}
        >
          Open incident
        </Link>
        <OutlineButton onClick={copyLink}>{copied ? "✓ Copied" : "Copy link"}</OutlineButton>
      </div>
    </div>
  );
}

/* -------------------- provenance & verification -------------------- */

function BuildProvenanceCard() {
  return (
    <Card title="Build provenance">
      <dl className="divide-y divide-white/[0.05]">
        {BUILD.map((r) => (
          <div key={r.label} className="flex items-start justify-between gap-4 py-2 text-xs">
            <dt className={`shrink-0 ${MUTED}`}>{r.label}</dt>
            <dd className="break-all text-right font-mono font-medium">
              {r.href ? (
                <Link href={r.href} className="text-cyan-400 hover:underline">
                  {r.value}
                </Link>
              ) : (
                <span className={r.accent ? "text-cyan-400 font-bold" : "text-white"}>{r.value}</span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function VerificationChecksCard() {
  const [checks, setChecks] = useState<Check[]>(INITIAL_CHECKS);
  const [verifying, setVerifying] = useState(false);

  const handleReVerify = () => {
    setVerifying(true);
    setTimeout(() => {
      setChecks([
        { name: "Signature", detail: "Checked against signer public key", result: "Valid", tone: "green" },
        { name: "Trusted signer", detail: "Signer certificate is in the trusted consortium set", result: "Valid", tone: "green" },
        { name: "Record integrity", detail: "SHA-256 stored record matches cryptographic payload", result: "Valid", tone: "green" },
        { name: "Ledger match", detail: "Hyperledger Fabric state verified and synced", result: "Valid", tone: "green" },
      ]);
      setVerifying(false);
    }, 800);
  };

  return (
    <Card
      title="Verification checks"
      action={
        <OutlineButton onClick={handleReVerify}>
          {verifying ? "Checking..." : "Re-verify"}
        </OutlineButton>
      }
    >
      <ul className="divide-y divide-white/[0.05]">
        {checks.map((c) => (
          <li key={c.name} className="flex items-start justify-between gap-4 py-2.5 text-xs">
            <div>
              <p className="font-semibold text-white">{c.name}</p>
              <p className={`mt-0.5 text-[11px] ${MUTED}`}>{c.detail}</p>
            </div>
            <span className={`shrink-0 font-semibold ${TONE_TEXT[c.tone]}`}>{c.result}</span>
          </li>
        ))}
      </ul>
      <p className={`border-t pt-3 mt-2 text-[11px] ${DIVIDER} ${MUTED}`}>
        A cryptographic hash match alone is not proof. Each check runs against valid x509 SVID credentials and consortium policies.
      </p>
    </Card>
  );
}

function EventExplorerSection() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("e1");

  const q = query.trim().toLowerCase();
  const rows = q
    ? EVENTS.filter((e) => [e.workload, e.event, e.source, e.severity].some((v) => v.toLowerCase().includes(q)))
    : EVENTS;
  const current = EVENTS.find((e) => e.id === selected) ?? EVENTS[0];

  return (
    <section aria-label="Event Explorer" className="space-y-4 rounded-xl border border-white/[0.07] bg-[#0D1117] p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Correlated Audit Events</h2>
        <span className="text-[11px] text-slate-400">Run {RUN} Context</span>
      </div>
      <SearchBar value={query} onChange={setQuery} />
      <FilterBar />
      <div className="grid items-start gap-4 lg:grid-cols-[1fr_340px]">
        <EventTable rows={rows} selected={selected} onSelect={setSelected} />
        <EventDetail event={current} />
      </div>
    </section>
  );
}

function ProvenanceSection() {
  return (
    <section aria-label="Provenance and verification" className="space-y-4">
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <BuildProvenanceCard />
        <VerificationChecksCard />
      </div>
    </section>
  );
}

/* --------------------------------- page --------------------------------- */

export default function ProvenancePage() {
  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Provenance & Verification</h1>
          <p className={`mt-0.5 text-xs ${MUTED}`}>Run {RUN} · Decision {DECISION_ID} cryptographic attestation trail</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-amber-400/60 px-2.5 py-0.5 text-[10px] font-medium text-amber-300">
            Sample data
          </span>
          <OutlineButton onClick={() => {
            const data = { run: RUN, decisionId: DECISION_ID, build: BUILD, checks: INITIAL_CHECKS };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = `provenance-run-${RUN.replace("#", "")}.json`; a.click();
            URL.revokeObjectURL(url);
          }}>
            Export Attestation
          </OutlineButton>
        </div>
      </div>

      <ProvenanceSection />
      <EventExplorerSection />
    </div>
  );
}
