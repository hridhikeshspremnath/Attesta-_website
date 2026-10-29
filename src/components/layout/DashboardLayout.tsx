"use client";

// src/components/layout/DashboardLayout.tsx
// Attesta — Root dashboard shell: sidebar + top bar + main content area.
// Mobile-responsive: sidebar collapses to hamburger drawer on small screens.

import Sidebar from "@/src/components/layout/Sidebar";
import TopBar, { type Crumb } from "@/src/components/ui/TopBar";
import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

/* ------------------------------------------------------------------ */
/*  Route → breadcrumb mapping                                          */
/* ------------------------------------------------------------------ */

function useBreadcrumbs(): Crumb[] {
  const pathname = usePathname();

  const ROUTE_MAP: Record<string, Crumb[]> = {
    "/":                  [{ label: "Attesta", href: "/" }, { label: "Overview" }],
    "/overview":          [{ label: "Attesta", href: "/" }, { label: "Overview" }],
    "/pipeline-runs":     [{ label: "Monitor", href: "/" }, { label: "Pipeline Runs" }],
    "/event-explorer":    [{ label: "Monitor", href: "/" }, { label: "Event Explorer" }],
    "/workload-identity": [{ label: "Zero-Trust", href: "/" }, { label: "Workload Identity" }],
    "/access-policies":   [{ label: "Zero-Trust", href: "/" }, { label: "Access Policies" }],
    "/runtime-monitoring":[{ label: "Zero-Trust", href: "/" }, { label: "Runtime Monitoring" }],
    "/incidents":         [{ label: "Investigate", href: "/" }, { label: "Incidents & Response" }],
    "/trust-ledger":      [{ label: "Investigate", href: "/" }, { label: "Trust Ledger" }],
    "/provenance":        [{ label: "Investigate", href: "/" }, { label: "Provenance & Verification" }],
    "/integrations":      [{ label: "Admin", href: "/" }, { label: "Integrations & Settings" }],
    "/doc":               [{ label: "Admin", href: "/" }, { label: "Documentation" }],
  };

  return ROUTE_MAP[pathname] ?? [{ label: "Attesta", href: "/" }, { label: pathname.replace("/", "").replace(/-/g, " ") }];
}

/* ------------------------------------------------------------------ */
/*  DashboardLayout                                                     */
/* ------------------------------------------------------------------ */

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const crumbs = useBreadcrumbs();

  return (
    <div className="flex min-h-screen bg-[#080C14]">
      <Sidebar
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />

      {/* Main content column */}
      <div className="flex flex-1 min-w-0 flex-col">
        <TopBar
          crumbs={crumbs}
          onMenuOpen={() => setMobileNavOpen(true)}
        />
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
