"use client";

// src/app/incidents/page.tsx — open findings: decisions still REVIEW or BLOCK after any auditor override.
import DecisionTable from "@/src/components/ledger/DecisionTable";
import LedgerGate from "@/src/components/ledger/LedgerGate";
import PageHeader from "@/src/components/ui/PageHeader";
import { Badge, Button, Card } from "@/src/components/ui/primitives";
import { effectiveDecision } from "@/src/lib/ledger";
import type { LedgerEntry } from "@/src/types";

function Findings({ records, reload }: { records: LedgerEntry[]; reload: () => void }) {
  const open = records.filter((e) => ["REVIEW", "BLOCK"].includes(effectiveDecision(e)));
  const blocked = open.filter((e) => effectiveDecision(e) === "BLOCK").length;
  const cleared = records.filter((e) => e.overrides?.length && !open.includes(e)).length;
  return (
    <>
      <PageHeader
        title="Incidents & response"
        subtitle="Open findings: artifacts the deploy gate will refuse until the decision changes"
        badges={<>
          <Badge tone={blocked ? "crit" : "neutral"}>{blocked} blocked</Badge>
          <Badge tone={open.length - blocked ? "warn" : "neutral"}>{open.length - blocked} awaiting review</Badge>
          <Badge tone="ok">{cleared} cleared by auditor</Badge>
        </>}
        actions={<Button onClick={reload}>Refresh</Button>}
      />
      <Card flush title="Open findings" aside={<span className="text-2xs text-muted">Resolve with an auditor override: scripts/auditor-override.sh</span>}>
        <DecisionTable rows={open} empty="Every recorded artifact is allowed or has been cleared by the auditor." />
      </Card>
    </>
  );
}

export default function IncidentsPage() {
  return (
    <div className="page">
      <LedgerGate title="Open findings">{(l, reload) => <Findings records={l.records} reload={reload} />}</LedgerGate>
    </div>
  );
}
