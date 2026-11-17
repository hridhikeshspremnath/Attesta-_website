"use client";

// src/app/trust-decisions/page.tsx — every signed decision on the ledger, with the evidence behind it.
import { useMemo, useState } from "react";
import DecisionTable from "@/src/components/ledger/DecisionTable";
import LedgerGate from "@/src/components/ledger/LedgerGate";
import PageHeader from "@/src/components/ui/PageHeader";
import { Button, Card, FilterSelect, SearchField } from "@/src/components/ui/primitives";
import { Donut, HBars, RiskHistogram } from "@/src/components/charts/charts";
import { decisionSlices, flagBars } from "@/src/lib/chartData";
import { effectiveDecision, subject } from "@/src/lib/ledger";
import type { LedgerEntry } from "@/src/types";

function Decisions({ records, reload }: { records: LedgerEntry[]; reload: () => void }) {
  const [query, setQuery] = useState("");
  const [decision, setDecision] = useState("any");
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter((e) =>
      (decision === "any" || effectiveDecision(e) === decision) &&
      (!q || `${subject(e)} ${e.record.run_id}`.toLowerCase().includes(q)));
  }, [records, query, decision]);

  return (
    <>
      <PageHeader title="Trust decisions" subtitle="Signed decisions from the ledger, newest first"
        actions={<Button onClick={reload}>Refresh</Button>} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Decisions"><Donut slices={decisionSlices(records)} center={String(records.length)} caption="artifacts" /></Card>
        <Card title="Why packages get flagged" aside={<span className="text-2xs text-muted">artifacts per behaviour</span>}><HBars rows={flagBars(records)} /></Card>
        <Card title="Where scores land"><RiskHistogram scores={records.map((e) => e.record.risk_score)} /></Card>
      </div>
      <Card flush title="Decision log" aside={
        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect name="Decision" value={decision} options={["any", "ALLOW", "WARN", "REVIEW", "BLOCK"]} onChange={setDecision} />
          <SearchField value={query} onChange={setQuery} placeholder="Filter by package or run…" label="Filter decisions" className="w-56" />
        </div>
      }>
        <DecisionTable rows={rows} empty="No decisions match these filters." />
      </Card>
    </>
  );
}

export default function TrustDecisionsPage() {
  return (
    <div className="page">
      <LedgerGate title="Decision log">{(l, reload) => <Decisions records={l.records} reload={reload} />}</LedgerGate>
    </div>
  );
}
