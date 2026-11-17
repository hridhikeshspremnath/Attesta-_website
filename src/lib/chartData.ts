// Chart inputs derived from ledger records. One place so every page counts the same way.
import type { BarRow, Point, Slice } from "@/src/components/charts/charts";
import type { FlowStats } from "@/src/components/diagrams/PipelineDiagram";
import { effectiveDecision, subject, utc } from "@/src/lib/ledger";
import type { Checkpoint, Decision, LedgerEntry } from "@/src/types";

const DECISIONS: { d: Decision; tone: Slice["tone"] }[] = [
  { d: "ALLOW", tone: "ok" }, { d: "WARN", tone: "warn" }, { d: "REVIEW", tone: "accent" }, { d: "BLOCK", tone: "crit" },
];

export const decisionSlices = (records: LedgerEntry[]): Slice[] =>
  DECISIONS.map(({ d, tone }) => ({ label: d, tone, value: records.filter((r) => effectiveDecision(r) === d).length }));

export function flowStats(records: LedgerEntry[], cp: Checkpoint | null): FlowStats {
  const n = (d: Decision) => records.filter((r) => effectiveDecision(r) === d).length;
  return {
    scored: records.length,
    reviewed: records.filter((r) => r.record.llm_verdict !== "NOT_RUN").length,
    allow: n("ALLOW"), review: n("REVIEW") + n("WARN"), block: n("BLOCK"),
    height: cp?.kind === "fabric" ? cp.height : null,
    attested: records.filter((r) => r.record.attestation_verified).length,
  };
}

/** One point per record: its risk score over time, coloured by the decision in force. */
export const riskPoints = (records: LedgerEntry[]): Point[] =>
  records.map((e) => ({
    t: e.timestamp, v: e.record.risk_score, label: `${subject(e)} · ${e.record.risk_score}/1000 · ${effectiveDecision(e)} · ${utc(e.timestamp)}`,
    tone: DECISIONS.find((x) => x.d === effectiveDecision(e))?.tone ?? "muted",
  }));

const FLAGS: [keyof LedgerEntry["record"], string][] = [
  ["flag_install_exec", "Runs code at install"], ["flag_network", "Network access"], ["flag_cred_access", "Credential access"],
  ["flag_obfuscation", "Obfuscated code"], ["flag_process_spawn", "Spawns processes"],
];

export const flagBars = (records: LedgerEntry[]): BarRow[] =>
  FLAGS.map(([key, label]) => ({ label, value: records.filter((e) => e.record[key]).length, tone: key === "flag_cred_access" || key === "flag_obfuscation" ? "crit" : "warn" }));

export const severityBars = (counts: { High: number; Medium: number; Info: number }): BarRow[] => [
  { label: "High", value: counts.High, tone: "crit" }, { label: "Medium", value: counts.Medium, tone: "warn" }, { label: "Info", value: counts.Info, tone: "muted" },
];
