// Live service health and open findings, derived from the same feeds the pages use (shown in the top bar).
import type { Tone } from "@/src/components/ui/primitives";
import type { Feed } from "@/src/lib/feeds";
import { effectiveDecision, subject, type LedgerState } from "@/src/lib/ledger";
import type { IdentitySnapshot, PolicyView } from "@/src/types";

export type Health = { name: string; ok: boolean; note: string };
export type Alert = { id: string; tone: Tone; message: string; time: string; href: string };

const SNAPSHOT_STALE_S = 120;

export function serviceHealth(
  ledger: LedgerState, policy: Feed<PolicyView>, identity: Feed<{ snapshot: IdentitySnapshot; now: number }>,
): Health[] {
  const note = (ok: boolean, good: string, bad: string, pending: boolean) => (pending ? "Checking…" : ok ? good : bad);
  const ledgerOk = ledger.status === "ready";
  const policyOk = policy.status === "ready" && (policy.data.matches || policy.data.onchain === null);
  const spireOk = identity.status === "ready" && identity.data.now - identity.data.snapshot.taken_at <= SNAPSHOT_STALE_S;
  return [
    { name: "Gateway", ok: ledgerOk, note: note(ledgerOk, "Live", "Unreachable", ledger.status === "loading") },
    { name: "Ledger", ok: ledgerOk && ledger.data.checkpoint !== null, note: note(ledgerOk && ledger.data.checkpoint !== null, "Live", ledgerOk ? "Empty" : "Unreachable", ledger.status === "loading") },
    { name: "Policy engine", ok: policyOk, note: note(policyOk, policy.status === "ready" && policy.data.matches ? "Pinned" : "Live", policy.status === "ready" ? "Differs from chain" : "Unreachable", policy.status === "loading") },
    { name: "SPIRE identity", ok: spireOk, note: note(spireOk, "Live", identity.status === "ready" ? "Snapshot stale" : "No snapshot", identity.status === "loading") },
  ];
}

const ago = (s: number) => (s < 90 ? "just now" : s < 5400 ? `${Math.round(s / 60)} min ago` : s < 172800 ? `${Math.round(s / 3600)} h ago` : `${Math.round(s / 86400)} d ago`);

/** Newest open findings (REVIEW or BLOCK in force) as notifications. */
export function findings(ledger: LedgerState, limit = 4): { alerts: Alert[]; open: number } {
  if (ledger.status !== "ready") return { alerts: [], open: 0 };
  const open = ledger.data.records.filter((e) => ["REVIEW", "BLOCK"].includes(effectiveDecision(e)));
  const now = ledger.loadedAt / 1000;
  return {
    open: open.length,
    alerts: open.slice(0, limit).map((e) => ({
      id: e.record.record_id, href: "/incidents", time: ago(now - e.timestamp),
      tone: effectiveDecision(e) === "BLOCK" ? "crit" : "warn",
      message: `${subject(e)}: ${effectiveDecision(e)}${effectiveDecision(e) === "BLOCK" ? " (deploy refused)" : " (needs a decision)"}`,
    })),
  };
}
