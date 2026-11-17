"use client";

// src/app/workload-identity/page.tsx — SPIRE registration entries and agents (snapshot), joined with the ledger.
import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/src/components/ui/PageHeader";
import { Badge, Button, Card, EmptyState } from "@/src/components/ui/primitives";
import { useLedger, utc } from "@/src/lib/ledger";
import type { IdentitySnapshot } from "@/src/types";

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; snapshot: IdentitySnapshot; now: number };

const STALE_AFTER = 120; // seconds: the exporter refreshes every 30 s

function useIdentity(): { state: State; reload: () => void } {
  const [state, setState] = useState<State>({ status: "loading" });
  const [reloads, setReloads] = useState(0);
  useEffect(() => {
    let live = true;
    fetch("/api/identity", { cache: "no-store" })
      .then(async (res): Promise<State> => {
        const body = await res.json();
        return res.ok ? { status: "ready", snapshot: body.snapshot, now: body.now } : { status: "error", message: body.error ?? `HTTP ${res.status}` };
      })
      .catch((): State => ({ status: "error", message: "Dashboard server is unreachable" }))
      .then((next) => { if (live) setState(next); });
    return () => { live = false; };
  }, [reloads]);
  return { state, reload: () => setReloads((n) => n + 1) };
}

const short = (id: string) => id.replace(/^spiffe:\/\/[^/]+/, "");
const ttl = (s: number) => (s === 0 ? "default" : s % 3600 === 0 ? `${s / 3600} h` : `${Math.round(s / 60)} min`);

function Workloads({ snapshot, signed }: { snapshot: IdentitySnapshot; signed: Map<string, { n: number; last: number }> }) {
  // Entries whose selector is another SPIFFE ID are node aliases for an agent, not workloads.
  const rows = snapshot.entries.filter((e) => !e.selectors.some((s) => s.startsWith("spiffe_id:")));
  return (
    <Card flush title="Registered workloads" aside={<span className="text-2xs text-muted">{rows.length} entries</span>}>
      <div className="overflow-x-auto">
        <table className="data-table min-w-[820px]">
          <thead>
            <tr>{["SPIFFE ID", "Selectors", "SVID lifetime", "Ledger records signed", "Last record (UTC)"].map((h) => <th key={h} scope="col">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((e) => {
              const s = signed.get(e.spiffe_id);
              return (
                <tr key={e.id}>
                  <td className="font-mono text-fg" title={e.spiffe_id}>{short(e.spiffe_id)}{e.admin && <Badge tone="warn">admin</Badge>}</td>
                  <td className="font-mono text-muted">{e.selectors.join(", ")}</td>
                  <td className="tabnum text-muted">{ttl(e.x509_svid_ttl)}</td>
                  <td className="tabnum font-mono text-fg">{s ? s.n : "–"}</td>
                  <td className="tabnum whitespace-nowrap font-mono text-muted">{s ? utc(s.last) : "–"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Agents({ snapshot, now }: { snapshot: IdentitySnapshot; now: number }) {
  const rows = [...snapshot.agents].sort((a, b) => b.svid_expires_at - a.svid_expires_at);
  const live = rows.filter((a) => a.svid_expires_at > now && !a.banned).length;
  return (
    <Card flush title="Node agents" aside={<span className="text-2xs text-muted">{live} active, {rows.length - live} expired or banned</span>}>
      <div className="overflow-x-auto">
        <table className="data-table min-w-[720px]">
          <thead>
            <tr>{["Agent", "Attestation", "Version", "Agent SVID expires (UTC)", "Status"].map((h) => <th key={h} scope="col">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((a) => {
              const active = a.svid_expires_at > now && !a.banned;
              return (
                <tr key={a.id}>
                  <td className="font-mono text-fg" title={a.id}>{short(a.id).slice(0, 44)}</td>
                  <td className="text-muted">{a.attestation_type}{!a.can_reattest && " · one-time"}</td>
                  <td className="font-mono text-muted">{a.version}</td>
                  <td className="tabnum whitespace-nowrap font-mono text-muted">{utc(a.svid_expires_at)}</td>
                  <td><Badge tone={a.banned ? "crit" : active ? "ok" : "neutral"}>{a.banned ? "Banned" : active ? "Active" : "Expired"}</Badge></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="border-t border-line px-5 py-3 text-xs leading-relaxed text-muted">
        Join-token agents are one-time: after a restart the demo registers a new agent and the old one stays listed as expired. See scripts/agent-reset.sh.
      </p>
    </Card>
  );
}

export default function WorkloadIdentityPage() {
  const { state, reload } = useIdentity();
  const ledger = useLedger().state;
  const signed = useMemo(() => {
    const m = new Map<string, { n: number; last: number }>();
    if (ledger.status === "ready") {
      for (const e of ledger.data.records) {
        const id = e.record.submitted_by_spiffe_id;
        const cur = m.get(id);
        m.set(id, { n: (cur?.n ?? 0) + 1, last: Math.max(cur?.last ?? 0, e.timestamp) });
      }
    }
    return m;
  }, [ledger]);

  const age = state.status === "ready" ? state.now - state.snapshot.taken_at : 0;
  const stale = age > STALE_AFTER;
  return (
    <div className="page">
      <PageHeader
        title="Workload identity"
        subtitle="SPIRE registration entries and node agents, with the ledger records each identity has signed"
        badges={state.status === "ready" && (
          <>
            <Badge tone="info">{state.snapshot.trust_domain}</Badge>
            <Badge tone={stale ? "warn" : "ok"}>{stale ? `Snapshot ${Math.round(age / 60)} min old` : "Snapshot current"}</Badge>
          </>
        )}
        actions={<Button onClick={reload}>Refresh</Button>}
      />
      {state.status === "loading" && <Card flush title="Registered workloads"><EmptyState title="Loading…" /></Card>}
      {state.status === "error" && (
        <Card flush title="Registered workloads">
          <EmptyState title="No identity data" action={<Button onClick={reload}>Retry</Button>}>{state.message}</EmptyState>
        </Card>
      )}
      {state.status === "ready" && (
        <>
          {stale && (
            <p role="status" className="card px-4 py-3 text-xs text-warn">
              The snapshot has not been refreshed for {Math.round(age / 60)} minutes. Run scripts/identity-snapshot.sh --loop on the host.
            </p>
          )}
          <Workloads snapshot={state.snapshot} signed={signed} />
          <Agents snapshot={state.snapshot} now={state.now} />
        </>
      )}
    </div>
  );
}
