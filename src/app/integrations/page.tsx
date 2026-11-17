"use client";

// src/app/integrations/page.tsx — live status of every part the system is built from, measured, not configured here.
import PageHeader from "@/src/components/ui/PageHeader";
import { Badge, Button, Card, type Tone } from "@/src/components/ui/primitives";
import { useFeed } from "@/src/lib/feeds";
import { effectiveDecision, shortHash, useLedger, utc } from "@/src/lib/ledger";
import type { IdentitySnapshot, PolicyView } from "@/src/types";

type Status = { name: string; tone: Tone; label: string; lines: string[]; where: string };

export default function IntegrationsPage() {
  const ledger = useLedger();
  const identity = useFeed<{ snapshot: IdentitySnapshot; now: number }>("/api/identity");
  const policy = useFeed<PolicyView>("/api/policy");
  const records = ledger.state.status === "ready" ? ledger.state.data.records : [];
  const cp = ledger.state.status === "ready" ? ledger.state.data.checkpoint : null;

  const down = (label = "Unreachable"): Pick<Status, "tone" | "label"> => ({ tone: "crit", label });
  const wait = { tone: "neutral" as Tone, label: "Checking…" };

  const fabric: Status = {
    name: "Hyperledger Fabric", where: "network/ (3 organisations, 2-of-3 endorsement)",
    ...(ledger.state.status === "ready" ? (cp?.kind === "fabric" ? { tone: "ok" as Tone, label: "Connected" } : { tone: "warn" as Tone, label: "Dev ledger" }) : ledger.state.status === "error" ? down() : wait),
    lines: cp?.kind === "fabric" ? [`Channel ${cp.channel}`, `Block height ${cp.height}`, `${records.length} records`] : [],
  };

  let spire: Status = { name: "SPIRE", where: "deploy/spire-demo (scripts/identity-snapshot.sh)", ...wait, lines: [] };
  if (identity.state.status === "ready") {
    const { snapshot: s, now } = identity.state.data;
    const age = now - s.taken_at;
    const active = s.agents.filter((a) => a.svid_expires_at > now && !a.banned).length;
    spire = { ...spire, tone: age > 120 ? "warn" : "ok", label: age > 120 ? "Snapshot stale" : "Connected",
      lines: [`Trust domain ${s.trust_domain}`, `${s.entries.filter((e) => !e.selectors.some((x) => x.startsWith("spiffe_id:"))).length} workloads, ${active} active agent${active === 1 ? "" : "s"}`, `Snapshot ${Math.max(0, age)} s old`] };
  } else if (identity.state.status === "error") spire = { ...spire, ...down("No snapshot"), lines: [identity.state.message] };

  let opa: Status = { name: "Policy: OPA rules and signed decisions", where: "config/policy.yaml, config/policy.rego", ...wait, lines: [] };
  if (policy.state.status === "ready") {
    const p = policy.state.data;
    opa = { ...opa, tone: p.matches ? "ok" : "warn", label: p.matches ? "Pinned on-chain" : p.onchain ? "Differs from chain" : "Chain not checked",
      lines: [`Version ${p.local.policy_version}`, `Bundle ${shortHash(p.local.bundle_hash ?? "–")}`, p.local.signed_decisions_required ? "Decisions must be signed" : "Signing not required"] };
  } else if (policy.state.status === "error") opa = { ...opa, ...down(), lines: [policy.state.message] };

  const latest = records[0];
  const detector: Status = {
    name: "ML package detector", where: "attesta_DL, config/scoring.yaml (model_factory)",
    ...(ledger.state.status === "error" ? down("No data") : records.length ? { tone: "ok" as Tone, label: "Scoring" } : { tone: "warn" as Tone, label: "No scores yet" }),
    lines: latest ? [`${records.length} packages scored`, `Model ${shortHash(latest.record.model_version_hash)}`, `Last ${utc(latest.timestamp)} UTC`] : [],
  };

  const reviewed = records.filter((e) => e.record.llm_verdict !== "NOT_RUN");
  const llm: Status = {
    name: "LLM review", where: "ATTESTA_LLM_MODEL in deploy/spire-demo/.env",
    ...(ledger.state.status === "error" ? down("No data") : reviewed.length ? { tone: "ok" as Tone, label: "Active" } : { tone: "warn" as Tone, label: "No reviews yet" }),
    lines: reviewed.length ? [`${reviewed.length} borderline packages reviewed`, `Latest verdict ${reviewed[0].record.llm_verdict}`] : ["Reviews packages scoring 300+ or with flags"],
  };

  const attested = records.filter((e) => e.record.attestation_verified).length;
  const oidc: Status = {
    name: "Runner attestation (GitHub OIDC)", where: "attestation_mode in config/scoring.yaml",
    ...(ledger.state.status === "error" ? down("No data") : attested ? { tone: "ok" as Tone, label: "Verifying" } : { tone: "warn" as Tone, label: "Not verifying yet" }),
    lines: [`${attested} of ${records.length} runs attested`, attested ? "ALLOW is possible for attested runs" : "Unattested runs are held at REVIEW"],
  };

  const allowed = records.filter((e) => effectiveDecision(e) === "ALLOW").length;
  const gate: Status = {
    name: "Deploy gate", where: "scripts/deploy-gate.sh",
    ...(ledger.state.status === "error" ? down("No data") : { tone: "ok" as Tone, label: "Enforcing" }),
    lines: [`${allowed} artifact${allowed === 1 ? "" : "s"} may deploy`, `${records.length - allowed} refused until the decision changes`],
  };

  const cards = [fabric, spire, opa, detector, llm, oidc, gate];
  const reload = () => { ledger.reload(); identity.reload(); policy.reload(); };
  const bad = cards.filter((c) => c.tone === "crit").length;

  return (
    <div className="page">
      <PageHeader
        title="Integrations"
        subtitle="Live status of each part of the system, measured from the ledger, the policy and the identity feed"
        badges={<Badge tone={bad ? "crit" : "ok"}>{bad ? `${bad} unreachable` : "All reachable"}</Badge>}
        actions={<Button onClick={reload}>Refresh</Button>}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.name} title={c.name} aside={<Badge tone={c.tone}>{c.label}</Badge>}>
            <ul className="space-y-1 text-xs text-fg">{c.lines.map((l) => <li key={l} className="break-words">{l}</li>)}</ul>
            <p className="mt-3 text-2xs text-muted">Configured in {c.where}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
