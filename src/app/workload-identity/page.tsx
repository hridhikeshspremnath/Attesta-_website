"use client";

// src/app/workload-identity/page.tsx
// Attesta — Workload Identity (workload detail).
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
const DIVIDER = "border-white/[0.06]";

type Field    = { label: string; value: string; tone?: Tone; mono?: boolean };
type Activity = { time: string; text: string; outcome: string; tone: Tone; href?: string };

/* ----------------------------- data ----------------------------- */

const WORKLOAD = "build-runner-1842";

const IDENTITY: Field[] = [
  { label: "SPIFFE ID",     value: "spiffe://[trust-domain]/[workload]", mono: true },
  { label: "Trust domain",  value: "[trust-domain]",                     mono: true },
  { label: "Attestation",   value: "Verified",                           tone: "green" },
];

const CREDENTIAL: Field[] = [
  { label: "SVID type", value: "X.509-SVID", mono: true },
  { label: "Issued",    value: "14:08:42",   mono: true },
  { label: "Expires",   value: "14:15:42",   mono: true, tone: "amber" },
];

const LIFETIME_ELAPSED_PERCENT = 55;
const REVOCATION: Field = { label: "Revocation", value: "None" };

const PIPELINE: Field[] = [
  { label: "Repository",   value: "[org/repo]", mono: true },
  { label: "Commit",       value: "[sha]",      mono: true },
  { label: "Workflow run", value: "#1842",       mono: true },
];

const TRUST_HISTORY: Activity[] = [
  { time: "14:08:40", text: "Trust gate evaluated",   outcome: "Review", tone: "amber", href: "/access-policies" },
  { time: "Yesterday", text: "Previous run decision", outcome: "Issued", tone: "green", href: "/trust-ledger" },
];

const RUNTIME_ACTIVITY: Activity[] = [
  { time: "14:02:11", text: "Read protected secret",     outcome: "Denied",  tone: "red",   href: "/runtime-monitoring" },
  { time: "14:01:38", text: "Fetch dependency manifest", outcome: "Allowed", tone: "green", href: "/runtime-monitoring" },
];

const AUDIT: Field[] = [
  { label: "Signed decision", value: "Valid", tone: "green" },
  { label: "Ledger tx",       value: "[ID]",  mono: true },
];

/* --------------------------- primitives --------------------------- */

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-white/[0.07] bg-[#0D1117] px-5 pb-4 pt-4">
      <h2 className="mb-2 text-sm font-semibold text-white">{title}</h2>
      {children}
    </section>
  );
}

/* ----------------------------- rows ----------------------------- */

function FieldRow({ f }: { f: Field }) {
  return (
    <div className={`flex items-start justify-between gap-4 py-2 text-xs border-t first:border-t-0 ${DIVIDER}`}>
      <dt className={`shrink-0 ${MUTED}`}>{f.label}</dt>
      <dd className={`break-all text-right ${f.mono ? "font-mono font-bold" : "font-medium"} ${TONE_TEXT[f.tone ?? "white"]}`}>
        {f.value}
      </dd>
    </div>
  );
}

function FieldList({ fields }: { fields: Field[] }) {
  return <dl className="mt-1">{fields.map((f) => <FieldRow key={f.label} f={f} />)}</dl>;
}

function ActivityRow({ a }: { a: Activity }) {
  const content = (
    <li className={`grid grid-cols-[72px_1fr_auto] items-center gap-3 border-t py-2.5 text-xs ${DIVIDER}`}>
      <span className={`font-mono text-[11px] ${MUTED}`}>{a.time}</span>
      <span className="font-medium text-white/90">{a.text}</span>
      <span className={`font-semibold ${TONE_TEXT[a.tone]}`}>{a.outcome}</span>
    </li>
  );

  if (a.href) {
    return (
      <Link href={a.href} className="block hover:bg-white/[0.025] rounded transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500">
        {content}
      </Link>
    );
  }
  return content;
}

function ActivityList({ items }: { items: Activity[] }) {
  return <ul className="mt-1">{items.map((a) => <ActivityRow key={a.time + a.text} a={a} />)}</ul>;
}

/* ----------------------------- cards ----------------------------- */

function IdentityCard() {
  return <Card title="Identity"><FieldList fields={IDENTITY} /></Card>;
}

function LifetimeBar({ percent }: { percent: number }) {
  const color = percent > 75 ? "bg-red-400" : percent > 50 ? "bg-amber-400" : "bg-emerald-400";
  return (
    <div
      role="progressbar"
      aria-label="SVID lifetime elapsed"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className="my-2 h-1.5 rounded-full bg-white/[0.06]"
    >
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${percent}%` }} />
    </div>
  );
}

function CredentialLifecycleCard() {
  return (
    <Card title="Credential lifecycle">
      <FieldList fields={CREDENTIAL} />
      <div className="mt-1 mb-1">
        <LifetimeBar percent={LIFETIME_ELAPSED_PERCENT} />
        <p className="text-[10px] text-[#6B7280]">{LIFETIME_ELAPSED_PERCENT}% of SVID lifetime elapsed</p>
      </div>
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
  return (
    <Card title="Audit evidence">
      <FieldList fields={AUDIT} />
      <div className="mt-3">
        <Link
          href="/trust-ledger"
          className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          View in Trust Ledger →
        </Link>
      </div>
    </Card>
  );
}

/* --------------------------------- page --------------------------------- */

export default function WorkloadIdentityPage() {
  return (
    <div className="space-y-4 p-4 sm:p-6">
      {/* Page header */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-bold tracking-tight text-white">{WORKLOAD}</h1>
          <div className="flex gap-2 flex-wrap">
            <span className="rounded-full border border-emerald-400/60 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400">Attested</span>
            <span className="rounded-full border border-amber-400/60 px-2.5 py-0.5 text-[10px] font-medium text-amber-300">Trust: review</span>
            <span className="rounded-full border border-amber-400 px-2.5 py-0.5 text-[10px] font-medium text-amber-300">Sample data</span>
          </div>
        </div>
      </div>

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
  );
}
