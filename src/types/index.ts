export type Severity = "High" | "Medium" | "Low" | "Info";

export type DecisionEffect = "ALLOW" | "DENY";

export type WorkloadStatus = "Verified" | "Review" | "Rejected" | "Waiting";

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

