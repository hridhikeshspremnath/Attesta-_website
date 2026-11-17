"use client";

// Everything the ledger knows about one record: shared by Trust Decisions, Incidents and Provenance.
import { Badge, CopyButton } from "@/src/components/ui/primitives";
import { DECISION_TONE, effectiveDecision, subject, utc } from "@/src/lib/ledger";
import type { LedgerEntry } from "@/src/types";

const FLAGS = ["install_exec", "network", "obfuscation", "cred_access", "process_spawn"] as const;

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-xs">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="min-w-0 break-all text-right font-mono text-fg">{children}</dd>
    </div>
  );
}

export function Hash({ value }: { value: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span title={value}>{value.replace("sha256:", "").slice(0, 16)}…</span>
      <CopyButton text={value} label="Copy hash" size="sm" />
    </span>
  );
}

export function raisedFlags(e: LedgerEntry): string[] {
  return FLAGS.filter((f) => e.record[`flag_${f}`]);
}

export default function RecordDetail({ e }: { e: LedgerEntry }) {
  const r = e.record;
  const eff = effectiveDecision(e);
  return (
    <div className="space-y-5">
      <dl className="divide-y divide-line">
        <Row label="Package">{subject(e)}</Row>
        <Row label="Decision in force"><Badge tone={DECISION_TONE[eff]}>{eff}</Badge></Row>
        <Row label="Scorer decision">{r.decision} ({r.risk_band}, {r.risk_score}/1000)</Row>
        <Row label="Recorded (UTC)">{utc(e.timestamp)}</Row>
        <Row label="Run">{r.run_id}</Row>
        <Row label="Transaction">{e.tx_id ? <Hash value={e.tx_id} /> : "–"}</Row>
        <Row label="Block">{e.block_number ?? "–"}</Row>
        <Row label="Artifact digest"><Hash value={r.artifact_digest} /></Row>
      </dl>

      <section>
        <h3 className="mb-1 text-2xs font-medium text-muted">Evidence</h3>
        <dl className="divide-y divide-line">
          <Row label="Behaviour flags">{raisedFlags(e).join(", ") || "none"}</Row>
          <Row label="LLM review">{r.llm_verdict}{r.llm_evidence_hash && <> · <Hash value={r.llm_evidence_hash} /></>}</Row>
          <Row label="Model version"><Hash value={r.model_version_hash} /></Row>
          <Row label="Evidence hash"><Hash value={r.evidence_hash} /></Row>
          <Row label="Policy version">{r.policy_version}</Row>
        </dl>
      </section>

      <section>
        <h3 className="mb-1 text-2xs font-medium text-muted">Runner attestation</h3>
        <dl className="divide-y divide-line">
          <Row label="Verified">
            <Badge tone={r.attestation_verified ? "ok" : "warn"}>{r.attestation_verified ? "Verified" : "Not verified"}</Badge>
          </Row>
          <Row label="Attestor">{r.node_attestor}</Row>
          <Row label="Runner">{r.runner_class}</Row>
          <Row label="Attestation digest">{r.attestation_digest ? <Hash value={r.attestation_digest} /> : "–"}</Row>
        </dl>
      </section>

      <section>
        <h3 className="mb-1 text-2xs font-medium text-muted">Signed by</h3>
        <dl className="divide-y divide-line">
          <Row label="Scorer key">{r.scorer_key_id}</Row>
          <Row label="Scorer identity">{r.submitted_by_spiffe_id.replace("spiffe://", "")}</Row>
        </dl>
      </section>

      {!!e.overrides?.length && (
        <section>
          <h3 className="mb-1 text-2xs font-medium text-muted">Auditor overrides</h3>
          <ul className="divide-y divide-line text-xs">
            {e.overrides.map((o) => (
              <li key={o.tx_time} className="py-2">
                <span className="font-mono text-fg">{o.previous_decision} → {o.decision}</span>
                <span className="ml-2 text-muted">{utc(o.tx_time)} · {o.by_msp}</span>
                <p className="mt-1 text-muted">{o.reason}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
