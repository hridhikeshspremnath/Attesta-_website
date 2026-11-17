"use client";

// src/app/pipeline-runs/page.tsx — scoring runs recorded on the ledger and how each runner was attested.
import { useMemo, useState } from "react";
import LedgerGate from "@/src/components/ledger/LedgerGate";
import PageHeader from "@/src/components/ui/PageHeader";
import { Badge, Button, Card, FilterSelect } from "@/src/components/ui/primitives";
import { Donut } from "@/src/components/charts/charts";
import { DECISION_TONE, effectiveDecision, subject, utc } from "@/src/lib/ledger";
import type { LedgerEntry } from "@/src/types";

function Runs({ records, reload }: { records: LedgerEntry[]; reload: () => void }) {
  const [attested, setAttested] = useState("any");
  const rows = useMemo(
    () => records.filter((e) => attested === "any" || String(e.record.attestation_verified) === (attested === "verified" ? "true" : "false")),
    [records, attested]);
  const verified = records.filter((e) => e.record.attestation_verified).length;

  return (
    <>
      <PageHeader
        title="Pipeline runs"
        subtitle="Dependency scoring runs and the identity of the runner that requested each one"
        badges={<Badge tone={verified ? "ok" : "warn"}>{verified} of {records.length} runs attested</Badge>}
        actions={<Button onClick={reload}>Refresh</Button>}
      />
      <Card title="Runner attestation" aside={<span className="text-2xs text-muted">only attested runs can be ALLOW</span>}>
        <Donut slices={[{ label: "Verified", value: verified, tone: "ok" }, { label: "Not verified", value: records.length - verified, tone: "warn" }]} center={`${verified}/${records.length}`} caption="attested" />
      </Card>
      <Card flush title="Runs" aside={<FilterSelect name="Attestation" value={attested} options={["any", "verified", "unverified"]} onChange={setAttested} />}>
        <div className="overflow-x-auto">
          <table className="data-table min-w-[780px]">
            <thead>
              <tr>{["Time (UTC)", "Run", "Package", "Runner", "Attestor", "Attestation", "Decision"].map((h) => <th key={h} scope="col">{h}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.record.record_id}>
                  <td className="tabnum whitespace-nowrap font-mono text-muted">{utc(e.timestamp)}</td>
                  <td className="font-mono text-fg">{e.record.run_id}</td>
                  <td className="whitespace-nowrap font-mono text-fg">{subject(e)}</td>
                  <td className="text-muted">{e.record.runner_class}</td>
                  <td className="text-muted">{e.record.node_attestor}</td>
                  <td><Badge tone={e.record.attestation_verified ? "ok" : "warn"}>{e.record.attestation_verified ? "Verified" : "Not verified"}</Badge></td>
                  <td><Badge tone={DECISION_TONE[effectiveDecision(e)]}>{effectiveDecision(e)}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-line px-5 py-3 text-xs leading-relaxed text-muted">
          Unverified runs cannot be ALLOW: the policy downgrades them to REVIEW. Verification needs the CI job to present a GitHub OIDC token (see docs/SCORING.md).
        </p>
      </Card>
    </>
  );
}

export default function PipelineRunsPage() {
  return (
    <div className="page">
      <LedgerGate title="Runs">{(l, reload) => <Runs records={l.records} reload={reload} />}</LedgerGate>
    </div>
  );
}
