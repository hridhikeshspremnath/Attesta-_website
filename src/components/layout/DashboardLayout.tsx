"use client";

// src/components/layout/DashboardLayout.tsx
// Attesta — Root dashboard shell: sidebar + top bar + main content area.
// Mobile-responsive: sidebar collapses to hamburger drawer on small screens.

import Sidebar from "@/src/components/layout/Sidebar";
import WaveBackground from "@/src/components/layout/WaveBackground";
import TopBar, { type Crumb } from "@/src/components/ui/TopBar";
import { findRoute } from "@/src/lib/navigation";
import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

/* ------------------------------------------------------------------ */
/*  Route → breadcrumb mapping                                          */
/* ------------------------------------------------------------------ */

function useBreadcrumbs(): Crumb[] {
  const route = findRoute(usePathname());
  if (!route) return [{ label: "Attesta", href: "/" }, { label: "Page not found" }];
  return [{ label: route.section.title }, { label: route.item.label }];
}

/* ------------------------------------------------------------------ */
/*  DashboardLayout                                                     */
/* ------------------------------------------------------------------ */

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const crumbs = useBreadcrumbs();

  return (
    <div className="flex min-h-screen text-fg">
      <WaveBackground />
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
