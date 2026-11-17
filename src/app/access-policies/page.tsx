"use client";

// src/app/access-policies/page.tsx — the policy that decides ALLOW/WARN/REVIEW/BLOCK, and who may do what.
// Bands and rules come from the gateway (what it enforces); the pinned hash comes from the chain.
import { useMemo } from "react";
import PageHeader from "@/src/components/ui/PageHeader";
import { useFeed } from "@/src/lib/feeds";
import { Badge, Button, Card, CopyButton, EmptyState, type Tone } from "@/src/components/ui/primitives";
import { TONE_COLOR, type ChartTone } from "@/src/components/charts/charts";
import type { Decision, PolicyView } from "@/src/types";

const TONE: Record<Decision, ChartTone> = { ALLOW: "ok", WARN: "warn", REVIEW: "accent", BLOCK: "crit" };
const BADGE: Record<Decision, Tone> = { ALLOW: "ok", WARN: "warn", REVIEW: "warn", BLOCK: "crit" };
const short = (h: string | null | undefined) => (h ? `${h.replace("sha256:", "").slice(0, 16)}…` : "–");

/** Evidence rules are written as `floors contains {"decision": "X", "reason": "Y"}` in policy.rego. */
function parseRules(rego: string | null): { decision: Decision; reason: string }[] {
  if (!rego) return [];
  return [...rego.matchAll(/floors contains \{"decision": "(\w+)", "reason": "([^"]+)"\}/g)]
    .map((m) => ({ decision: m[1] as Decision, reason: m[2] }))
    .sort((a, b) => (a.decision === b.decision ? a.reason.localeCompare(b.reason) : a.decision === "BLOCK" ? -1 : 1));
}

function Bands({ p }: { p: PolicyView }) {
  return (
    <Card title="Score bands" aside={<span className="text-2xs text-muted">risk score 0 (safe) to 1000 (dangerous)</span>}>
      <div className="flex h-9 overflow-hidden rounded-lg border border-line" role="img"
        aria-label={p.local.bands.map((b) => `${b.min_score} to ${b.max_score}: ${b.decision}`).join(", ")}>
        {p.local.bands.map((b) => (
          <div key={b.name} className="grid place-items-center text-2xs font-semibold text-black/80" title={`${b.name}: ${b.min_score}–${b.max_score} → ${b.decision}`}
            style={{ flex: b.max_score - b.min_score + 1, background: `linear-gradient(180deg, ${TONE_COLOR[TONE[b.decision]]}, color-mix(in srgb, ${TONE_COLOR[TONE[b.decision]]} 70%, black))` }}>
            {b.decision}
          </div>
        ))}
      </div>
      <div className="mt-1 flex text-2xs text-muted">
        {p.local.bands.map((b) => <div key={b.name} className="tabnum" style={{ flex: b.max_score - b.min_score + 1 }}>{b.min_score}</div>)}
        <span className="tabnum">1000</span>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted">
        The band gives the starting decision. Two things can only make it stricter: a runner that is not attested downgrades ALLOW and WARN to REVIEW, and the evidence rules below can raise it further. Nothing lowers a decision.
      </p>
    </Card>
  );
}

function Rules({ p }: { p: PolicyView }) {
  const rules = useMemo(() => parseRules(p.local.rego), [p.local.rego]);
  return (
    <Card flush title="Evidence rules (OPA)" aside={<span className="text-2xs text-muted">stricter-only: they can raise a decision, never lower one</span>}>
      <table className="data-table">
        <thead><tr><th scope="col">Minimum decision</th><th scope="col">When the evidence shows</th></tr></thead>
        <tbody>
          {rules.map((r) => (
            <tr key={r.decision + r.reason}><td><Badge tone={BADGE[r.decision]}>{r.decision}</Badge></td><td className="text-fg">{r.reason}</td></tr>
          ))}
        </tbody>
      </table>
      {rules.length === 0 && <EmptyState title="No rules available">The gateway could not read policy.rego.</EmptyState>}
      {p.local.rego && (
        <details className="border-t border-line px-5 py-3">
          <summary className="cursor-pointer text-xs text-muted hover:text-fg">Show the Rego source</summary>
          <pre className="well mt-3 max-h-80 overflow-auto p-3 text-2xs leading-relaxed text-fg">{p.local.rego}</pre>
        </details>
      )}
    </Card>
  );
}

function Bundle({ p }: { p: PolicyView }) {
  const rows: [string, React.ReactNode][] = [
    ["Policy version", <span key="v" className="font-mono">{p.local.policy_version}</span>],
    ["Bundle hash (gateway)", p.local.bundle_hash ? <span key="h" className="inline-flex items-center gap-2 font-mono" title={p.local.bundle_hash}>{short(p.local.bundle_hash)}<CopyButton text={p.local.bundle_hash} label="Copy hash" size="sm" /></span> : "–"],
    ["Bundle hash (on-chain)", p.onchain ? <span key="o" className="font-mono" title={p.onchain.bundle_hash}>{short(p.onchain.bundle_hash)}</span> : <span key="o" className="text-muted">not available</span>],
    ["Decisions must be signed", <Badge key="s" tone={p.local.signed_decisions_required ? "ok" : "warn"}>{p.local.signed_decisions_required ? "Required" : "Not required"}</Badge>],
    ["Allowed scorer", <span key="a" className="break-all font-mono">{p.local.allowed_scorer_spiffe_id.replace("spiffe://", "")}</span>],
  ];
  return (
    <Card title="Policy bundle" aside={p.onchain ? <Badge tone={p.matches ? "ok" : "crit"}>{p.matches ? "Gateway and chain agree" : "Gateway and chain differ"}</Badge> : <Badge tone="warn">Chain not checked</Badge>}>
      <dl className="divide-y divide-line">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-start justify-between gap-4 py-2 text-xs"><dt className="shrink-0 text-muted">{k}</dt><dd className="min-w-0 text-right text-fg">{v}</dd></div>
        ))}
      </dl>
      <p className="mt-3 text-xs leading-relaxed text-muted">
        The bundle is the score bands plus the Rego rules. The chain pins its hash: a decision made under any other policy is refused, and changing the policy needs a new version approved by two organisations.
      </p>
    </Card>
  );
}

const WHO: { who: string; can: string; by: string }[] = [
  { who: "Scoring service", can: "Submit scored records", by: "Gateway (caller identity) and chaincode (allowed scorer, registered key)" },
  { who: "Policy service", can: "Sign decisions", by: "Chaincode: registered policy key under the pinned bundle" },
  { who: "Auditor organisation", can: "Override a decision (append-only, reason required)", by: "Chaincode: only the Auditor identity" },
  { who: "Attesta, Auditor and Release organisations", can: "Endorse and record on the ledger", by: "Fabric: any 2 of the 3 must agree" },
  { who: "Any workload in the trust domain", can: "Read the ledger and ask the deploy gate", by: "Gateway: mutual TLS with a SPIFFE identity" },
  { who: "Dashboard users", can: "View everything, change nothing", by: "Sign-in; the dashboard has read-only access" },
];

function Who() {
  return (
    <Card flush title="Who may do what" aside={<span className="text-2xs text-muted">as enforced by the system</span>}>
      <div className="overflow-x-auto">
        <table className="data-table min-w-[640px]">
          <thead><tr>{["Identity", "Can", "Enforced by"].map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
          <tbody>{WHO.map((r) => <tr key={r.who}><td className="font-medium text-fg">{r.who}</td><td className="text-fg">{r.can}</td><td className="text-muted">{r.by}</td></tr>)}</tbody>
        </table>
      </div>
    </Card>
  );
}

export default function AccessPoliciesPage() {
  const { state, reload } = useFeed<PolicyView>("/api/policy");
  return (
    <div className="page">
      <PageHeader title="Access policies" subtitle="How a score becomes a decision, and which identities may do what"
        badges={state.status === "ready" && <Badge tone="info">{state.data.local.policy_version}</Badge>}
        actions={<Button onClick={reload}>Refresh</Button>} />
      {state.status === "loading" && <Card flush title="Policy"><EmptyState title="Loading…" /></Card>}
      {state.status === "error" && <Card flush title="Policy"><EmptyState title="Could not load the policy" action={<Button onClick={reload}>Retry</Button>}>{state.message}</EmptyState></Card>}
      {state.status === "ready" && (
        <>
          <Bands p={state.data} />
          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <Rules p={state.data} />
            <Bundle p={state.data} />
          </div>
          <Who />
        </>
      )}
    </div>
  );
}
