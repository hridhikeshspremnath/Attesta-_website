export type NavItem = {
  label: string;
  href: string;
  badge?: number;
  /** Extra terms that find this page in global search. */
  keywords?: string;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export const NAVIGATION_SECTIONS: NavSection[] = [
  {
    title: "Monitor",
    items: [
      { label: "Overview", href: "/", keywords: "dashboard posture health" },
      { label: "Pipeline Runs", href: "/pipeline-runs", keywords: "github actions workflow dependency risk" },
      { label: "Event Explorer", href: "/event-explorer", keywords: "events audit correlated evidence" },
    ],
  },
  {
    title: "Zero-Trust Security",
    items: [
      { label: "Workload Identity", href: "/workload-identity", keywords: "spiffe spire svid attestation credential" },
      { label: "Trust Decisions", href: "/trust-decisions", keywords: "allow deny decision log" },
      { label: "Access Policies", href: "/access-policies", keywords: "opa rego policy authorization" },
      { label: "Runtime Monitoring", href: "/runtime-monitoring", keywords: "ebpf kernel agent syscall" },
    ],
  },
  {
    title: "Investigate",
    items: [
      { label: "Incidents & Response", href: "/incidents", keywords: "incident alert remediation" },
      { label: "Trust Ledger", href: "/trust-ledger", keywords: "hyperledger fabric block transaction tx" },
      { label: "Provenance & Verification", href: "/provenance", keywords: "slsa signature attestation build" },
    ],
  },
  {
    title: "Administration",
    items: [
      { label: "Integrations & Settings", href: "/integrations", keywords: "github spire opa alerting users roles" },
      { label: "Documentation", href: "/doc", keywords: "docs glossary architecture api" },
    ],
  },
];

/** Routes that render another destination's page. */
const ROUTE_ALIASES: Record<string, string> = {
  "/overview": "/",
  "/docs": "/doc",
};

export function isActiveRoute(pathname: string, href: string): boolean {
  const canonical = ROUTE_ALIASES[pathname] ?? pathname;
  if (href === "/") return canonical === "/";
  return canonical === href || canonical.startsWith(`${href}/`);
}

export function findRoute(pathname: string): { section: NavSection; item: NavItem } | null {
  for (const section of NAVIGATION_SECTIONS) {
    const item = section.items.find((i) => isActiveRoute(pathname, i.href));
    if (item) return { section, item };
  }
  return null;
}
