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
    risk_band: string;
    decision: Decision;
    artifact_digest: string;
    flag_install_exec: boolean;
    flag_network: boolean;
    flag_obfuscation: boolean;
    flag_cred_access: boolean;
    flag_process_spawn: boolean;
    llm_verdict: "BENIGN" | "SUSPICIOUS" | "MALICIOUS" | "NOT_RUN";
    llm_evidence_hash: string | null;
    model_version_hash: string;
    policy_version: string;
    policy_bundle_hash?: string | null; // set once decisions are signed by the policy service
    decision_key_id?: string | null;
    runner_class: string;
    node_attestor: string;
    attestation_verified: boolean;
    attestation_digest: string | null;
    evidence_hash: string;
    scorer_key_id: string;
    submitted_by_spiffe_id: string;
  };
  block_number?: number | null;
  overrides?: { decision: Decision; previous_decision: Decision; reason: string; by_msp: string; tx_time: number }[];
}

export type Checkpoint =
  | { kind: "fabric"; channel: string; height: number; current_block_hash: string }
  | { kind: "merkle"; record_count: number; merkle_root: string; timestamp: number };

/** GET /policy on the gateway. */
export interface PolicyBand { name: string; min_score: number; max_score: number; decision: Decision }
export interface PolicyView {
  local: {
    policy_version: string; bands: PolicyBand[]; bundle_hash: string | null; rego: string | null;
    signed_decisions_required: boolean; allowed_scorer_spiffe_id: string;
  };
  onchain: { policy_version: string; bundle_hash?: string; allowed_scorer_spiffe_id: string; bands: PolicyBand[] } | null;
  matches: boolean;
}

/** SPIRE snapshot written by deploy/spire-demo/scripts/identity-snapshot.sh. */
export interface IdentitySnapshot {
  taken_at: number; // unix seconds
  trust_domain: string;
  entries: { id: string; spiffe_id: string; parent_id: string; selectors: string[]; x509_svid_ttl: number; admin: boolean; created_at: number }[];
  agents: { id: string; attestation_type: string; version: string; banned: boolean; can_reattest: boolean; svid_expires_at: number }[];
}

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

