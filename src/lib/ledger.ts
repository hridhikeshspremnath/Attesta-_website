"use client";

// Shared client access to /api/ledger plus the small formatters every ledger view needs.
import { useEffect, useState } from "react";
import { REFRESH_MS, usePolling } from "@/src/lib/live";
import type { Tone } from "@/src/components/ui/primitives";
import type { Checkpoint, Decision, LedgerEntry } from "@/src/types";

export type Ledger = { records: LedgerEntry[]; checkpoint: Checkpoint | null; truncated: boolean };
export type LedgerState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: Ledger; loadedAt: number }; // loadedAt: ms, so renders stay pure

export const DECISION_TONE: Record<Decision, Tone> = { ALLOW: "ok", WARN: "warn", REVIEW: "warn", BLOCK: "crit" };

export const utc = (seconds: number) => new Date(seconds * 1000).toISOString().replace("T", " ").slice(0, 19);
export const shortHash = (hash: string) => `${hash.slice(0, 12)}…`;
export const subject = (e: LedgerEntry) => `${e.record.ecosystem}/${e.record.package}@${e.record.version}`;
/** The decision in force: an auditor override replaces the scorer's decision. */
export const effectiveDecision = (e: LedgerEntry): Decision => e.effective_decision ?? e.record.decision;

export function useLedger(): { state: LedgerState; reload: () => void } {
  const [state, setState] = useState<LedgerState>({ status: "loading" });
  const [reloads, setReloads] = useState(0);
  const tick = usePolling(REFRESH_MS);

  useEffect(() => {
    let live = true;
    fetch("/api/ledger", { cache: "no-store" })
      .then(async (res): Promise<LedgerState> => {
        const body = await res.json();
        return res.ok
          ? { status: "ready", data: body, loadedAt: Date.now() }
          : { status: "error", message: body.error ?? `HTTP ${res.status}` };
      })
      .catch((): LedgerState => ({ status: "error", message: "Dashboard server is unreachable" }))
      .then((next) => { if (live) setState(next); });
    return () => { live = false; };
  }, [reloads, tick]);

  return { state, reload: () => setReloads((n) => n + 1) };
}
