"use client";

// src/app/provenance/page.tsx
// Attesta — Event Explorer stacked above Provenance & Verification.
// Same conventions as workload-identity/page.tsx. Tailwind only; no new dependencies.

import { useState, type ReactNode } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";

/* ------------------------- tokens ------------------------- */

const MUTED = "text-slate-400";
const DIVIDER = "border-white/[0.06]";
const FOCUS = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400";

/* ----------------------------- data ----------------------------- */

type Severity = "High" | "Medium" | "Info";
const SEVERITY_TONE: Record<Severity, string> = {
  High: "text-red-400",
  Medium: "text-amber-400",
  Info: "text-slate-400",
};

const TOTAL_EVENTS = 214;

type EventRow = { id: string; time: string; workload: string; event: string; source: string; severity: Severity };
type Evidence = { label: string; value: string };

/* ----------------------------- data ----------------------------- */

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
      { label: "Event ID", value: "[evt-id]" },
      { label: "Request ID", value: "[req-id]" },
      { label: "Trace ID", value: "[trace-id]" },
    ] as Evidence[],
    evidence: [
      { label: "OPA rule", value: "secrets.read v7" },
      { label: "Workload and SVID", value: "build-runner-1842" },
      { label: "Trust decision", value: "Review" },
      { label: "GitHub run", value: "#1842" },
      { label: "Runtime alert", value: "Credential access" },
      { label: "Signed record", value: "tx [ID]" },
    ] as Evidence[],
  },
} as Record<string, { observed: string; ids: Evidence[]; evidence: Evidence[] }>;

const FALLBACK_IDS: Evidence[] = [
  { label: "Event ID", value: "[evt-id]" },
  { label: "Request ID", value: "[req-id]" },
  { label: "Trace ID", value: "[trace-id]" },
];

type Tone = "green" | "amber" | "red";
const TONE_TEXT: Record<Tone, string> = {
  green: "text-emerald-400",
  amber: "text-amber-400",
  red: "text-red-400",
};

type Row = { label: string; value: string; accent?: boolean };
type Check = { name: string; detail: string; result: string; tone: Tone };

/* ----------------------------- data ----------------------------- */

const RUN = "#1842";
const DECISION_ID = "[decision-id]";

const BUILD: Row[] = [
  { label: "Source revision", value: "[sha]" },
  { label: "Workflow identity", value: "[org/repo/workflow]" },
  { label: "Builder", value: "[runner]" },
  { label: "Started / finished", value: "14:08:42 / pending" },
  { label: "Workload identity", value: "[spiffe-id]" },
  { label: "Ledger tx", value: "[tx-id]", accent: true },
];

const CHECKS: Check[] = [
  { name: "Signature", detail: "Checked against signer key", result: "Valid", tone: "green" },
  { name: "Trusted signer", detail: "Signer is in the trusted set", result: "Valid", tone: "green" },
  { name: "Record integrity", detail: "Stored record matches signed payload", result: "Valid", tone: "green" },
  { name: "Ledger match", detail: "Fabric record equals signed decision", result: "Not yet verified", tone: "amber" },
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

/* ------------------------- event explorer ------------------------- */

function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Search events"
      placeholder="Search events, IDs, SPIFFE IDs, rules..."
      className={`w-full rounded-lg border border-white/5 bg-[#0e1a30] px-4 py-3 text-xs text-white placeholder:text-slate-500 ${FOCUS}`}
    />
  );
}

function FilterBar() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            className={`rounded-full border border-white/15 px-2.5 py-0.5 text-[10px] font-medium text-white transition hover:bg-white/10 motion-reduce:transition-none ${FOCUS}`}
          >
            {f}
          </button>
        ))}
      </div>
      <button className={`text-[11px] font-medium text-sky-400 hover:text-sky-300 ${FOCUS}`}>Save filter</button>
    </div>
  );
}

function EventTable({ rows, selected, onSelect }: { rows: EventRow[]; selected: string; onSelect: (id: string) => void }) {
  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead>
            <tr className={MUTED}>
              {["Time", "Workload", "Event", "Source", "Severity"].map((h) => (
                <th key={h} scope="col" className="py-2.5 pr-4 font-normal">{h}</th>
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
                  className={`cursor-pointer border-t transition-colors motion-reduce:transition-none ${DIVIDER} ${active ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"}`}
                >
                  <td className={`py-2.5 pr-4 font-mono text-[11px] ${MUTED}`}>{r.time}</td>
                  <td className="py-2.5 pr-4 font-mono font-bold text-white">
                    <button onClick={() => onSelect(r.id)} className={`text-left ${FOCUS}`}>{r.workload}</button>
                  </td>
                  <td className="py-2.5 pr-4 font-medium text-white">{r.event}</td>
                  <td className={`py-2.5 pr-4 ${MUTED}`}>{r.source}</td>
                  <td className={`py-2.5 font-medium ${SEVERITY_TONE[r.severity]}`}>{r.severity}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className={`border-t pt-2.5 text-[11px] ${DIVIDER} ${MUTED}`}>{rows.length} of {TOTAL_EVENTS} events · live tail on</p>
    </Card>
  );
}

function KeyValue({ items, mono }: { items: Evidence[]; mono?: boolean }) {
  return (
    <dl>
      {items.map((f) => (
        <div key={f.label} className="flex items-start justify-between gap-4 py-1.5 text-xs">
          <dt className={`shrink-0 ${MUTED}`}>{f.label}</dt>
          <dd className={`break-all text-right font-bold ${mono ? "font-mono text-white" : "text-sky-300"}`}>{f.value}</dd>
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
      await navigator.clipboard.writeText(`${window.location.origin}/events?event=${event.id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Card>
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
      <div className="mt-3 flex gap-2">
        <OutlineButton>Open incident</OutlineButton>
        <OutlineButton onClick={copyLink}>{copied ? "Link copied" : "Copy link"}</OutlineButton>
      </div>
    </Card>
  );
}

/* -------------------- provenance & verification -------------------- */

function BuildProvenanceCard() {
  return (
    <Card title="Build provenance">
      <dl>
        {BUILD.map((r) => (
          <div key={r.label} className="flex items-start justify-between gap-4 py-2 text-xs">
            <dt className={`shrink-0 ${MUTED}`}>{r.label}</dt>
            <dd className={`break-all text-right font-mono font-bold ${r.accent ? "text-sky-400" : "text-white"}`}>{r.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function VerificationChecksCard() {
  return (
    <Card title="Verification checks" action={<OutlineButton>Re-verify</OutlineButton>}>
      <ul>
        {CHECKS.map((c) => (
          <li key={c.name} className="flex items-start justify-between gap-4 py-2.5 text-xs">
            <div>
              <p className="font-medium text-white">{c.name}</p>
              <p className={`mt-0.5 text-[11px] ${MUTED}`}>{c.detail}</p>
            </div>
            <span className={`shrink-0 font-medium ${TONE_TEXT[c.tone]}`}>{c.result}</span>
          </li>
        ))}
      </ul>
      <p className={`border-t pt-3 text-[11px] ${DIVIDER} ${MUTED}`}>
        A hash match alone is not proof. Each check runs on the real signature, signer and record.
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
    <section aria-label="Event Explorer" className="space-y-4 rounded-xl bg-[#0b1426] p-4 sm:p-6">
      <SearchBar value={query} onChange={setQuery} />
      <FilterBar />
      <div className="grid items-start gap-4 lg:grid-cols-[1fr_330px]">
        <EventTable rows={rows} selected={selected} onSelect={setSelected} />
        <EventDetail event={current} />
      </div>
    </section>
  );
}

function ProvenanceSection() {
  return (
    <section aria-label="Provenance and verification" className="space-y-4 rounded-xl bg-[#0b1426] p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Provenance & Verification</h1>
          <p className={`mt-1 text-xs ${MUTED}`}>Run {RUN} · decision {DECISION_ID}</p>
        </div>
        <SampleChip />
      </div>
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
    <DashboardLayout>
      <div className="min-h-full bg-black p-4 sm:p-6" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", system-ui, sans-serif' }}>
        <div className="mx-auto max-w-[1200px] space-y-4">
          <TopBar />
          <EventExplorerSection />
          <ProvenanceSection />
        </div>
      </div>
    </DashboardLayout>
  );
}