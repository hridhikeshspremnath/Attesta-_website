export type NavItem = {
  label: string;
  href: string;
  badge?: number;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export const NAVIGATION_SECTIONS: NavSection[] = [
  {
    title: "Monitor",
    items: [
      { label: "Overview", href: "/" },
      { label: "Pipeline Runs", href: "/pipeline-runs" },
      { label: "Event Explorer", href: "/event-explorer" },
    ],
  },
  {
    title: "Zero-Trust Security",
    items: [
      { label: "Workload Identity", href: "/workload-identity" },
      { label: "Trust Decisions", href: "/trust-decisions" },
      { label: "Access Policies", href: "/access-policies" },
      { label: "Runtime Monitoring", href: "/runtime-monitoring" },
    ],
  },
  {
    title: "Investigate",
    items: [
      { label: "Incidents & Response", href: "/incidents", badge: 3 },
      { label: "Trust Ledger", href: "/trust-ledger" },
      { label: "Provenance & Verification", href: "/provenance" },
    ],
  },
  {
    title: "Administration",
    items: [
      { label: "Integrations & Settings", href: "/integrations" },
      { label: "Documentation", href: "/doc" },
    ],
  },
];

