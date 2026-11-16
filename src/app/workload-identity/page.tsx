"use client";

// src/app/workload-identity/page.tsx
// Attesta — Workload Identity (workload detail).
// Tailwind only; no new dependencies.

import Link from "next/link";
import PageHeader from "@/src/components/ui/PageHeader";
import { Badge, Card, SampleBadge, TONE_BG, TONE_TEXT, type Tone } from "@/src/components/ui/primitives";

/* ------------------------- tokens + types ------------------------- */

type Field    = { label: string; value: string; tone?: Tone; mono?: boolean };
type Activity = { time: string; text: string; outcome: string; tone: Tone; href?: string };

/* ----------------------------- data ----------------------------- */

const WORKLOAD = "build-runner-1842";

const IDENTITY: Field[] = [
  { label: "SPIFFE ID",     value: "spiffe://[trust-domain]/[workload]", mono: true },
  { label: "Trust domain",  value: "[trust-domain]",                     mono: true },
  { label: "Attestation",   value: "Verified",                           tone: "ok" },
];

const CREDENTIAL: Field[] = [
  { label: "SVID type", value: "X.509-SVID", mono: true },
  { label: "Issued",    value: "14:08:42",   mono: true },
  { label: "Expires",   value: "14:15:42",   mono: true, tone: "warn" },
];

const LIFETIME_ELAPSED_PERCENT = 55;
const REVOCATION: Field = { label: "Revocation", value: "None" };

const PIPELINE: Field[] = [
  { label: "Repository",   value: "[org/repo]", mono: true },
  { label: "Commit",       value: "[sha]",      mono: true },
  { label: "Workflow run", value: "#1842",       mono: true },
];

const TRUST_HISTORY: Activity[] = [
  { time: "14:08:40", text: "Trust gate evaluated",   outcome: "Review", tone: "warn", href: "/trust-decisions" },
  { time: "Yesterday", text: "Previous run decision", outcome: "Issued", tone: "ok", href: "/trust-ledger" },
];

const RUNTIME_ACTIVITY: Activity[] = [
  { time: "14:02:11", text: "Read protected secret",     outcome: "Denied",  tone: "crit", href: "/runtime-monitoring" },
  { time: "14:01:38", text: "Fetch dependency manifest", outcome: "Allowed", tone: "ok",   href: "/runtime-monitoring" },
];

const AUDIT: Field[] = [
  { label: "Signed decision", value: "Valid", tone: "ok" },
  { label: "Ledger tx",       value: "[ID]",  mono: true },
];

/* ----------------------------- rows ----------------------------- */

function FieldRow({ f }: { f: Field }) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-line py-2 text-xs first:border-t-0">
      <dt className="shrink-0 text-muted">{f.label}</dt>
      <dd className={`min-w-0 break-all text-right ${f.mono ? "font-mono" : "font-medium"} ${f.tone ? TONE_TEXT[f.tone] : "text-fg"}`}>
        {f.value}
      </dd>
    </div>
  );
}

function FieldList({ fields }: { fields: Field[] }) {
  return <dl>{fields.map((f) => <FieldRow key={f.label} f={f} />)}</dl>;
}

function ActivityRow({ a }: { a: Activity }) {
  const row = "grid grid-cols-[72px_minmax(0,1fr)_auto] items-center gap-3 py-2.5 text-xs";
  const content = (
    <>
      <span className="tabnum font-mono text-2xs text-muted">{a.time}</span>
      <span className="text-fg">{a.text}</span>
      <span className={`font-medium ${TONE_TEXT[a.tone]}`}>{a.outcome}</span>
    </>
  );

  return (
    <li className="border-t border-line first:border-t-0">
      {a.href
        ? <Link href={a.href} className={`${row} -mx-2 rounded-lg px-2 transition-colors hover:bg-raised/50`}>{content}</Link>
        : <div className={row}>{content}</div>}
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
  const tone: Tone = percent > 75 ? "crit" : percent > 50 ? "warn" : "ok";
  return (
    <div
      role="progressbar"
      aria-label="SVID lifetime elapsed"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className="my-2 h-1.5 overflow-hidden rounded-full bg-raised/60"
    >
      <div className={`h-full rounded-full ${TONE_BG[tone]}`} style={{ width: `${percent}%` }} />
    </div>
  );
}

function CredentialLifecycleCard() {
  return (
    <Card title="Credential lifecycle">
      <FieldList fields={CREDENTIAL} />
      <div className="mt-1 mb-1">
        <LifetimeBar percent={LIFETIME_ELAPSED_PERCENT} />
        <p className="text-2xs text-muted">{LIFETIME_ELAPSED_PERCENT}% of SVID lifetime elapsed</p>
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
        <Link href="/trust-ledger" className="link text-xs">View in Trust Ledger</Link>
      </div>
    </Card>
  );
}

/* --------------------------------- page --------------------------------- */

export default function WorkloadIdentityPage() {
  return (
    <div className="page">
      <PageHeader
        title={<span className="font-mono">{WORKLOAD}</span>}
        subtitle="SPIFFE identity, short-lived SVID and trust history for this workload"
        badges={
          <>
            <SampleBadge />
            <Badge tone="ok">Attested</Badge>
            <Badge tone="warn">Trust: review</Badge>
          </>
        }
      />

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
