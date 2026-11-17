"use client";

// Decision rows with a detail drawer. Used by Trust Decisions and Incidents.
import { useState } from "react";
import RecordDetail, { raisedFlags } from "@/src/components/ledger/RecordDetail";
import { Badge, Button, Drawer, EmptyState } from "@/src/components/ui/primitives";
import { DECISION_TONE, effectiveDecision, subject, utc } from "@/src/lib/ledger";
import type { LedgerEntry } from "@/src/types";

export default function DecisionTable({ rows, empty }: { rows: LedgerEntry[]; empty: React.ReactNode }) {
  const [open, setOpen] = useState<LedgerEntry | null>(null);
  if (!rows.length) return <EmptyState title="Nothing to show">{empty}</EmptyState>;
  return (
    <>
      <div className="overflow-x-auto">
        <table className="data-table min-w-[820px]">
          <thead>
            <tr>
              {["Time (UTC)", "Package", "Decision", "Risk", "Flags", "LLM", "Attested", ""].map((h) => <th key={h} scope="col">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.record.record_id}>
                <td className="tabnum whitespace-nowrap font-mono text-muted">{utc(e.timestamp)}</td>
                <td className="whitespace-nowrap font-mono text-fg">{subject(e)}</td>
                <td className="whitespace-nowrap"><Badge tone={DECISION_TONE[effectiveDecision(e)]}>{effectiveDecision(e)}</Badge></td>
                <td className="tabnum font-mono text-fg">{e.record.risk_score}</td>
                <td className="text-muted">{raisedFlags(e).join(", ") || "none"}</td>
                <td className="text-muted">{e.record.llm_verdict}</td>
                <td><Badge tone={e.record.attestation_verified ? "ok" : "warn"}>{e.record.attestation_verified ? "Yes" : "No"}</Badge></td>
                <td className="text-right"><Button size="sm" onClick={() => setOpen(e)}>Details</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {open && (
        <Drawer title={subject(open)} description="Signed record as committed to the ledger" onClose={() => setOpen(null)}>
          <RecordDetail e={open} />
        </Drawer>
      )}
    </>
  );
}
