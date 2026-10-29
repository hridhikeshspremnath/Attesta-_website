// src/app/workload-identity/page.tsx
// Attesta — Workload Identity (workload detail), matched to the reference image.
// Black canvas, navy panel + cards, dense small type. Tailwind only; no new dependencies.

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

type Field = { label: string; value: string; tone?: Tone; mono?: boolean };
type Activity = { time: string; text: string; outcome: string; tone: Tone };

/* ----------------------------- data ----------------------------- */

const WORKLOAD = "build-runner-1842";

const IDENTITY: Field[] = [
  { label: "SPIFFE ID", value: "spiffe://[trust-domain]/[workload]", mono: true },
  { label: "Trust domain", value: "[trust-domain]", mono: true },
  { label: "Attestation", value: "Verified", tone: "green" },
];

const CREDENTIAL: Field[] = [
  { label: "SVID type", value: "X.509-SVID", mono: true },
  { label: "Issued", value: "14:08:42", mono: true },
  { label: "Expires", value: "14:15:42", mono: true, tone: "amber" },
];

const LIFETIME_ELAPSED_PERCENT = 55;
const REVOCATION: Field = { label: "Revocation", value: "None" };

const PIPELINE: Field[] = [
  { label: "Repository", value: "[org/repo]", mono: true },
  { label: "Commit", value: "[sha]", mono: true },
  { label: "Workflow run", value: "#1842", mono: true },
];

const TRUST_HISTORY: Activity[] = [
  { time: "14:08:40", text: "Trust gate evaluated", outcome: "Review", tone: "amber" },
  { time: "Yesterday", text: "Previous run decision", outcome: "Issued", tone: "green" },
];

const RUNTIME_ACTIVITY: Activity[] = [
  { time: "14:02:11", text: "Read protected secret", outcome: "Denied", tone: "red" },
  { time: "14:01:38", text: "Fetch dependency manifest", outcome: "Allowed", tone: "green" },
];

const AUDIT: Field[] = [
  { label: "Signed decision", value: "Valid", tone: "green" },
  { label: "Ledger tx", value: "[ID]", mono: true },
];

/* --------------------------- primitives --------------------------- */

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-white/5 bg-[#0e1a30] px-4 pb-3 pt-3.5">
      <h2 className="mb-1 text-xs font-bold text-white">{title}</h2>
      {children}
    </section>
  );
}

function OutlineChip({ children, tone }: { children: ReactNode; tone: "green" | "amber" | "amberStrong" }) {
  const cls = {
    green: "border-emerald-400/60 text-emerald-400",
    amber: "border-amber-400/60 text-amber-300",
    amberStrong: "border-amber-400 text-amber-300",
  }[tone];
  return <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${cls}`}>{children}</span>;
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

function WorkloadTitle() {
  return (
    <div>
      <nav aria-label="Breadcrumb" className="text-[10px] text-slate-400">
        <a href="/workload-identity" className={`hover:text-slate-200 ${FOCUS}`}>Workloads</a>
        <span aria-hidden> / </span>
        <span aria-current="page">{WORKLOAD}</span>
      </nav>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold tracking-tight text-white">{WORKLOAD}</h1>
        <div className="flex gap-2">
          <OutlineChip tone="green">Attested</OutlineChip>
          <OutlineChip tone="amber">Trust: review</OutlineChip>
          <OutlineChip tone="amberStrong">Sample data</OutlineChip>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- rows ----------------------------- */

function FieldRow({ f }: { f: Field }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-xs">
      <dt className={`shrink-0 ${MUTED}`}>{f.label}</dt>
      <dd className={`break-all text-right ${f.mono ? "font-mono font-bold" : "font-medium"} ${TONE_TEXT[f.tone ?? "white"]}`}>
        {f.value}
      </dd>
    </div>
  );
}

function FieldList({ fields }: { fields: Field[] }) {
  return <dl>{fields.map((f) => <FieldRow key={f.label} f={f} />)}</dl>;
}

function ActivityRow({ a }: { a: Activity }) {
  return (
    <li className={`grid grid-cols-[72px_1fr_auto] items-center gap-3 border-t py-2.5 text-xs ${DIVIDER}`}>
      <span className={`font-mono text-[11px] ${MUTED}`}>{a.time}</span>
      <span className="font-medium text-white">{a.text}</span>
      <span className={`font-medium ${TONE_TEXT[a.tone]}`}>{a.outcome}</span>
    </li>
  );
}

function ActivityList({ items }: { items: Activity[] }) {
  return <ul>{items.map((a) => <ActivityRow key={a.time + a.text} a={a} />)}</ul>;
}

/* ----------------------------- cards ----------------------------- */

function IdentityCard() {
  return <Card title="Identity"><FieldList fields={IDENTITY} /></Card>;
}

function LifetimeBar({ percent }: { percent: number }) {
  return (
    <div
      role="progressbar"
      aria-label="SVID lifetime elapsed"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className="my-2 h-[3px] rounded-full bg-[#1a2a45]"
    >
      <div className="h-full rounded-full bg-cyan-300" style={{ width: `${percent}%` }} />
    </div>
  );
}

function CredentialLifecycleCard() {
  return (
    <Card title="Credential lifecycle">
      <FieldList fields={CREDENTIAL} />
      <LifetimeBar percent={LIFETIME_ELAPSED_PERCENT} />
      <FieldList fields={[REVOCATION]} />
    </Card>
  );
}

function PipelineContextCard() {
  return <Card title="Pipeline context"><FieldList fields={PIPELINE} /></Card>;
}

function TrustHistoryCard() {
  return <Card title="Trust history"><ActivityList items={TRUST_HISTORY} /></Card>;
}

function RuntimeActivityCard() {
  return <Card title="Runtime activity"><ActivityList items={RUNTIME_ACTIVITY} /></Card>;
}

function AuditEvidenceCard() {
  return <Card title="Audit evidence"><FieldList fields={AUDIT} /></Card>;
}

/* --------------------------------- page --------------------------------- */

export default function WorkloadIdentityPage() {
  return (
    <DashboardLayout>
      <div className="min-h-full bg-black p-4 sm:p-6" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", system-ui, sans-serif' }}>
        <div className="mx-auto max-w-[1200px] space-y-4">
          <TopBar />
          <div className="space-y-4 rounded-xl bg-[#0b1426] p-4 sm:p-6">
            <WorkloadTitle />
            <div className="grid items-start gap-4 lg:grid-cols-2">
              <div className="space-y-4">
                <IdentityCard />
                <CredentialLifecycleCard />
                <PipelineContextCard />
              </div>
              <div className="space-y-4">
                <TrustHistoryCard />
                <RuntimeActivityCard />
                <AuditEvidenceCard />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}