// Chart inputs derived from ledger records. One place so every page counts the same way.
import type { BarRow, Slice } from "@/src/components/charts/charts";
import { effectiveDecision } from "@/src/lib/ledger";
import type { Decision, LedgerEntry } from "@/src/types";

const DECISIONS: { d: Decision; tone: Slice["tone"] }[] = [
  { d: "ALLOW", tone: "ok" }, { d: "WARN", tone: "warn" }, { d: "REVIEW", tone: "accent" }, { d: "BLOCK", tone: "crit" },
];

export const decisionSlices = (records: LedgerEntry[]): Slice[] =>
  DECISIONS.map(({ d, tone }) => ({ label: d, tone, value: records.filter((r) => effectiveDecision(r) === d).length }));

const FLAGS: [keyof LedgerEntry["record"], string][] = [
  ["flag_install_exec", "Runs code at install"], ["flag_network", "Network access"], ["flag_cred_access", "Credential access"],
  ["flag_obfuscation", "Obfuscated code"], ["flag_process_spawn", "Spawns processes"],
];

export const flagBars = (records: LedgerEntry[]): BarRow[] =>
  FLAGS.map(([key, label]) => ({ label, value: records.filter((e) => e.record[key]).length, tone: key === "flag_cred_access" || key === "flag_obfuscation" ? "crit" : "warn" }));

export const severityBars = (counts: { High: number; Medium: number; Info: number }): BarRow[] => [
  { label: "High", value: counts.High, tone: "crit" }, { label: "Medium", value: counts.Medium, tone: "warn" }, { label: "Info", value: counts.Info, tone: "muted" },
];
