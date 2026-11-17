"use client";

// src/app/provenance/page.tsx — what the ledger proves about one artifact: digest, evidence, attestation, signer.
import { useMemo, useState } from "react";
import RecordDetail from "@/src/components/ledger/RecordDetail";
import LedgerGate from "@/src/components/ledger/LedgerGate";
import PageHeader from "@/src/components/ui/PageHeader";
import { Badge, Button, Card, SearchField } from "@/src/components/ui/primitives";
import { DECISION_TONE, effectiveDecision, subject } from "@/src/lib/ledger";
import type { LedgerEntry } from "@/src/types";

function Provenance({ records, reload }: { records: LedgerEntry[]; reload: () => void }) {
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState(records[0]?.record.record_id ?? "");
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter((e) => !q || `${subject(e)} ${e.record.artifact_digest}`.toLowerCase().includes(q));
  }, [records, query]);
  const selected = records.find((e) => e.record.record_id === picked) ?? rows[0];

  return (
    <>
      <PageHeader title="Provenance & verification" subtitle="What the signed ledger record says about an artifact"
        actions={<Button onClick={reload}>Refresh</Button>} />
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_420px]">
        <Card title="Artifacts" aside={<SearchField value={query} onChange={setQuery} placeholder="Package or digest…" label="Filter artifacts" className="w-56" />}>
          <ul className="divide-y divide-line">
            {rows.map((e) => (
              <li key={e.record.record_id}>
                <button
                  type="button"
                  onClick={() => setPicked(e.record.record_id)}
                  aria-current={selected?.record.record_id === e.record.record_id}
                  className="flex w-full items-center justify-between gap-3 py-2.5 text-left text-xs hover:text-fg aria-[current=true]:text-fg"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-mono text-fg">{subject(e)}</span>
                    <span className="block truncate font-mono text-2xs text-muted">{e.record.artifact_digest}</span>
                  </span>
                  <Badge tone={DECISION_TONE[effectiveDecision(e)]}>{effectiveDecision(e)}</Badge>
                </button>
              </li>
            ))}
            {rows.length === 0 && <li className="py-6 text-center text-xs text-muted">No artifacts match.</li>}
          </ul>
        </Card>
        <Card title={selected ? "Record" : "No record"}>
          {selected ? <RecordDetail e={selected} /> : <p className="text-xs text-muted">Select an artifact.</p>}
        </Card>
      </div>
    </>
  );
}

export default function ProvenancePage() {
  return (
    <div className="page">
      <LedgerGate title="Artifacts">{(l, reload) => <Provenance records={l.records} reload={reload} />}</LedgerGate>
    </div>
  );
}
