"use client";

// src/app/trust-ledger/page.tsx
// Attesta — Trust Ledger. Live data from the gateway via /api/ledger.
// Tailwind only; no new dependencies.

import { useEffect, useState } from "react";
import PageHeader from "@/src/components/ui/PageHeader";
import { Badge, Button, Card, EmptyState, type Tone } from "@/src/components/ui/primitives";
import { downloadFile, toCsv } from "@/src/lib/download";
import type { Checkpoint, Decision, LedgerEntry } from "@/src/types";

/* ------------------------- tokens + types ------------------------- */

type Ledger = { records: LedgerEntry[]; checkpoint: Checkpoint | null; truncated: boolean };
type State = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; data: Ledger };

const DECISION_TONE: Record<Decision, Tone> = { ALLOW: "ok", WARN: "warn", REVIEW: "warn", BLOCK: "crit" };
const COLUMNS = ["Transaction", "Time (UTC)", "Subject", "Run", "Risk", "Decision"];

const utc = (seconds: number) => new Date(seconds * 1000).toISOString().replace("T", " ").slice(0, 19);
const short = (hash: string) => `${hash.slice(0, 12)}…`;
const subject = (e: LedgerEntry) => `${e.record.ecosystem}/${e.record.package}@${e.record.version}`;
// Fabric entries are identified by transaction id; the SQLite dev backend only has a record hash.
const txRef = (e: LedgerEntry) => e.tx_id ?? e.record_hash;
const decision = (e: LedgerEntry) => e.effective_decision ?? e.record.decision;

/* ----------------------------- ledger ----------------------------- */

function LedgerTable({ records }: { records: LedgerEntry[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="data-table min-w-[760px]">
        <thead>
          <tr>
            {COLUMNS.map((c) => <th key={c} scope="col">{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {records.map((e) => (
            <tr key={e.record.record_id}>
              <td className="font-mono" title={txRef(e)}>{short(txRef(e))}</td>
              <td className="tabnum font-mono text-muted">{utc(e.timestamp)}</td>
              <td className="font-mono text-fg">{subject(e)}</td>
              <td className="font-mono text-muted">{e.record.run_id}</td>
              <td className="tabnum font-mono text-fg">{e.record.risk_score}</td>
              <td>
                <Badge tone={DECISION_TONE[decision(e)]}>{decision(e)}</Badge>
                {decision(e) !== e.record.decision && <span className="ml-2 text-2xs text-muted">overrides {e.record.decision}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function checkpointFields(c: Checkpoint | null): { label: string; value: string; title?: string }[] {
  if (!c) return [{ label: "Records", value: "0" }];
  if (c.kind === "fabric") {
    return [
      { label: "Ledger", value: "Hyperledger Fabric" },
      { label: "Channel", value: c.channel },
      { label: "Block height", value: String(c.height) },
      { label: "Tip block hash", value: short(c.current_block_hash), title: c.current_block_hash },
    ];
  }
  return [
    { label: "Ledger", value: "Merkle log (dev)" },
    { label: "Records", value: String(c.record_count) },
    { label: "Merkle root", value: short(c.merkle_root), title: c.merkle_root },
    { label: "Signed at (UTC)", value: utc(c.timestamp) },
  ];
}

function CheckpointCard({ checkpoint }: { checkpoint: Checkpoint | null }) {
  return (
    <Card title="Ledger state">
      <dl className="divide-y divide-line">
        {checkpointFields(checkpoint).map((f) => (
          <div key={f.label} className="flex items-center justify-between gap-4 py-2 text-xs">
            <dt className="shrink-0 text-muted">{f.label}</dt>
            <dd className="min-w-0 break-words text-right font-mono text-fg" title={f.title}>{f.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function LedgerNote() {
  return (
    <Card title="Ledger guarantee">
      <p className="text-xs leading-relaxed text-muted">
        Every record is a scorer-signed trust decision. The gateway checks the caller, signature and policy, and on Fabric the chaincode re-checks them on each organisation&apos;s peer before the record is committed.
      </p>
    </Card>
  );
}

/* --------------------------------- page --------------------------------- */

function exportLedger(records: LedgerEntry[]) {
  const rows = records.map((e) => [txRef(e), utc(e.timestamp), subject(e), e.record.run_id, e.record.risk_score, decision(e)]);
  downloadFile("trust-ledger.csv", "text/csv", toCsv(COLUMNS, rows));
}

export default function TrustLedgerPage() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [reloads, setReloads] = useState(0);
  const load = () => setReloads((n) => n + 1);

  useEffect(() => {
    let live = true;
    fetch("/api/ledger", { cache: "no-store" })
      .then(async (res): Promise<State> => {
        const body = await res.json();
        return res.ok ? { status: "ready", data: body } : { status: "error", message: body.error ?? `HTTP ${res.status}` };
      })
      .catch((): State => ({ status: "error", message: "Dashboard server is unreachable" }))
      .then((next) => { if (live) setState(next); });
    return () => { live = false; };
  }, [reloads]);

  const records = state.status === "ready" ? state.data.records : [];
  const truncated = state.status === "ready" && state.data.truncated;

  return (
    <div className="page">
      <PageHeader
        title="Trust Ledger"
        subtitle="Signed trust decisions recorded by the Attesta gateway"
        actions={
          <>
            <Button onClick={load}>Refresh</Button>
            <Button onClick={() => exportLedger(records)} disabled={records.length === 0}>Export ledger</Button>
          </>
        }
      />

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <Card flush title="Ledger records" aside={<span className="text-2xs text-muted">{truncated ? `Newest first, first ${records.length} loaded` : "Newest first"}</span>}>
          {state.status === "loading" && <EmptyState title="Loading ledger…" />}
          {state.status === "error" && (
            <EmptyState title="Could not load the ledger" action={<Button onClick={load}>Retry</Button>}>{state.message}</EmptyState>
          )}
          {state.status === "ready" && (records.length ? <LedgerTable records={records} /> : <EmptyState title="No records yet">The ledger is empty until the scoring service submits a signed record.</EmptyState>)}
        </Card>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
          <CheckpointCard checkpoint={state.status === "ready" ? state.data.checkpoint : null} />
          <LedgerNote />
        </div>
      </div>
    </div>
  );
}
