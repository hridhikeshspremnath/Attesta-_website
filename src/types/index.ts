export type Severity = "High" | "Medium" | "Low" | "Info";

export type DecisionEffect = "ALLOW" | "DENY";

export type WorkloadStatus = "Verified" | "Review" | "Rejected" | "Waiting";

/* Gateway API shapes (attesta.backends.models); only the fields the UI reads. */
export type Decision = "ALLOW" | "WARN" | "REVIEW" | "BLOCK";

export interface LedgerEntry {
  timestamp: number; // unix seconds (Fabric transaction time)
  record_hash: string;
  tx_id: string | null; // Fabric backend only
  effective_decision: Decision | null; // differs from record.decision after an auditor override
  record: {
    record_id: string;
    run_id: string;
    ecosystem: string;
    package: string;
    version: string;
    risk_score: number; // permille
    decision: Decision;
  };
}

export type Checkpoint =
  | { kind: "fabric"; channel: string; height: number; current_block_hash: string }
  | { kind: "merkle"; record_count: number; merkle_root: string; timestamp: number };

export interface WorkloadRecord {
  id: string;
  name: string;
  spiffeId: string;
  attestationStatus: WorkloadStatus;
  issuedAt: string;
  expiresAt: string;
}

export interface SecurityIncident {
  id: string;
  severity: Severity;
  status: "Active" | "Contained" | "Resolved";
  title: string;
  affectedSystems: string[];
  detectedAt: string;
}

