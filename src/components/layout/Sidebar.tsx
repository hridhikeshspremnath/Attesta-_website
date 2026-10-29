"use client";

// src/components/layout/Sidebar.tsx
// Attesta — Responsive sidebar with mobile drawer, desktop collapsible panel.
// Dark fintech SaaS design: floating panel, frosted glass, selective accents.

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Icons                                                               */
/* ------------------------------------------------------------------ */

function MonitorIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
    </svg>
  );
}
function PipelineIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="5" r="2" /><circle cx="5" cy="19" r="2" /><circle cx="19" cy="19" r="2" />
      <path d="M12 7v4M9.5 17.5l-2.5-6M14.5 17.5l2.5-6" />
    </svg>
  );
}
function EventIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}
function IdentityIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" />
    </svg>
  );
}
function TrustIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  );
}
function PolicyIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 9h6M9 12h6M9 15h4" />
    </svg>
  );
}
function RuntimeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="3" /><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}
function IncidentIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
function LedgerIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  );
}
function ProvenanceIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
    </svg>
  );
}
function IntegrationsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="5" r="3" /><circle cx="19" cy="19" r="3" /><circle cx="5" cy="19" r="3" />
      <path d="M12 8v13M12 21l-7-7M12 21l7-7" />
    </svg>
  );
}
function DocsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
    </svg>
  );
}
function ChevronLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
function ChevronRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Nav data                                                            */
/* ------------------------------------------------------------------ */

type NavItem = {
  label: string;
  href: string;
  badge?: number;
  icon: React.ReactNode;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const NAV: NavSection[] = [
  {
    title: "Monitor",
    items: [
      { label: "Overview", href: "/", icon: <MonitorIcon /> },
      { label: "Pipeline Runs", href: "/pipeline-runs", icon: <PipelineIcon /> },
      { label: "Event Explorer", href: "/event-explorer", icon: <EventIcon /> },
    ],
  },
  {
    title: "Zero-Trust Security",
    items: [
      { label: "Workload Identity", href: "/workload-identity", icon: <IdentityIcon /> },
      { label: "Trust Decisions", href: "/access-policies", icon: <TrustIcon /> },
      { label: "Access Policies", href: "/access-policies", icon: <PolicyIcon /> },
      { label: "Runtime Monitoring", href: "/runtime-monitoring", icon: <RuntimeIcon /> },
    ],
  },
  {
    title: "Investigate",
    items: [
      { label: "Incidents & Response", href: "/incidents", icon: <IncidentIcon />, badge: 3 },
      { label: "Trust Ledger", href: "/trust-ledger", icon: <LedgerIcon /> },
      { label: "Provenance & Verification", href: "/provenance", icon: <ProvenanceIcon /> },
    ],
  },
  {
    title: "Administration",
    items: [
      { label: "Integrations & Settings", href: "/integrations", icon: <IntegrationsIcon /> },
      { label: "Documentation", href: "/doc", icon: <DocsIcon /> },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Sidebar Panel (shared by both desktop + mobile drawer)            */
/* ------------------------------------------------------------------ */

interface SidebarPanelProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onClose?: () => void;
  isMobileDrawer?: boolean;
}

function SidebarPanel({ collapsed, onToggleCollapse, onClose, isMobileDrawer }: SidebarPanelProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      {/* top white gradient sheen */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 rounded-t-2xl bg-gradient-to-b from-white/[0.055] to-transparent" />

      {/* ── Logo ── */}
      <div
        className={[
          "relative flex shrink-0 items-center gap-2.5 pt-5 pb-4 transition-all duration-300",
          collapsed && !isMobileDrawer ? "justify-center px-0" : "px-3.5",
        ].join(" ")}
      >
        <div className="relative h-7 w-7 shrink-0 rounded-[8px] overflow-hidden ring-1 ring-white/10">
          <Image src="/logo.png" alt="Attesta" fill sizes="28px" className="object-contain" />
        </div>
        <div
          className={[
            "flex flex-col leading-none overflow-hidden transition-all duration-300",
            collapsed && !isMobileDrawer ? "w-0 opacity-0" : "w-auto opacity-100",
          ].join(" ")}
        >
          <span className="whitespace-nowrap text-[12.5px] font-semibold tracking-[0.08em] text-white">
            ATTESTA
          </span>
          <span className="whitespace-nowrap text-[8.5px] font-medium tracking-[0.18em] text-white/28 uppercase mt-[3px]">
            CI/CD Zero-Trust
          </span>
        </div>

        {/* Mobile close button */}
        {isMobileDrawer && onClose && (
          <button
            onClick={onClose}
            aria-label="Close navigation"
            className="ml-auto grid h-7 w-7 place-items-center rounded-md text-white/40 hover:bg-white/[0.06] hover:text-white/70 transition-colors"
          >
            <XIcon />
          </button>
        )}
      </div>

      {/* divider */}
      <div className="mx-3 h-px bg-white/[0.07] shrink-0" />

      {/* ── Navigation ── */}
      <nav
        className="flex-1 overflow-y-auto py-2 no-scrollbar"
        aria-label="Main navigation"
      >
        {NAV.map((section, si) => (
          <div key={section.title} className={si > 0 ? "mt-1" : ""}>
            {/* Section label */}
            <div
              className={[
                "overflow-hidden transition-all duration-300",
                collapsed && !isMobileDrawer ? "h-0 opacity-0" : "h-auto opacity-100",
              ].join(" ")}
            >
              <p className="px-3.5 pt-3.5 pb-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/22">
                {section.title}
              </p>
            </div>
            {collapsed && !isMobileDrawer && si > 0 && (
              <div className="mx-2.5 my-2 h-px bg-white/[0.07]" />
            )}

            {/* Items */}
            {section.items.map((item) => {
              const active =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.label + item.href}
                  href={item.href}
                  title={collapsed && !isMobileDrawer ? item.label : undefined}
                  onClick={isMobileDrawer ? onClose : undefined}
                  className={[
                    "group relative flex items-center rounded-xl mx-2 mb-[2px]",
                    "transition-all duration-150 ease-out",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500",
                    collapsed && !isMobileDrawer
                      ? "w-9 h-9 mx-auto justify-center"
                      : "gap-2.5 px-2.5 py-[7px]",
                    active
                      ? [
                          "bg-white/[0.085]",
                          "shadow-[inset_0_1px_0_rgba(255,255,255,0.09),0_1px_3px_rgba(0,0,0,0.4)]",
                          "text-white",
                        ].join(" ")
                      : "text-white/38 hover:bg-white/[0.045] hover:text-white/75",
                  ].join(" ")}
                >
                  {/* active accent bar */}
                  {active && !(collapsed && !isMobileDrawer) && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-[18px] w-[2.5px] rounded-full bg-emerald-400/70" />
                  )}

                  {/* icon */}
                  <span
                    className={[
                      "shrink-0 transition-colors duration-150",
                      active ? "text-white" : "text-white/35 group-hover:text-white/65",
                    ].join(" ")}
                  >
                    {item.icon}
                  </span>

                  {/* label */}
                  {!(collapsed && !isMobileDrawer) && (
                    <span className="flex-1 truncate text-[12.5px] font-[450] leading-none">
                      {item.label}
                    </span>
                  )}

                  {/* badge (expanded) */}
                  {!(collapsed && !isMobileDrawer) && item.badge !== undefined && (
                    <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500/80 px-1.5 text-[10px] font-semibold text-white">
                      {item.badge}
                    </span>
                  )}

                  {/* badge (collapsed) */}
                  {collapsed && !isMobileDrawer && item.badge !== undefined && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-red-500/80 text-[8px] font-bold text-white">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── Collapse toggle (desktop only) ── */}
      {!isMobileDrawer && (
        <div className="shrink-0 px-2 pb-3">
          <div className="h-px bg-white/[0.07] mb-2" />
          <button
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={[
              "flex items-center rounded-xl transition-all duration-150 text-white/28 hover:bg-white/[0.05] hover:text-white/55",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500",
              collapsed ? "w-9 h-9 mx-auto justify-center" : "w-full gap-2 px-2.5 py-2",
            ].join(" ")}
          >
            {collapsed ? <ChevronRightIcon /> : (
              <>
                <ChevronLeftIcon />
                <span className="text-[11.5px]">Collapse</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mobile Hamburger Button (exported for use in TopBar)              */
/* ------------------------------------------------------------------ */

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Open navigation menu"
      className="grid h-9 w-9 place-items-center rounded-lg border border-white/[0.07] text-white/60 hover:bg-white/[0.05] hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 lg:hidden"
    >
      <MenuIcon />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Sidebar component                                                   */
/* ------------------------------------------------------------------ */

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const W = collapsed ? "w-[64px]" : "w-[224px]";
  const SPACER = collapsed ? "w-[76px]" : "w-[236px]";

  // Close mobile sidebar on Escape
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onMobileClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen, onMobileClose]);

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      {/* ════════════════════════════════════════════════════════════ */}
      {/*  MOBILE DRAWER                                               */}
      {/* ════════════════════════════════════════════════════════════ */}

      {/* Overlay backdrop */}
      {mobileOpen && (
        <div
          ref={overlayRef}
          aria-hidden
          onClick={onMobileClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        aria-label="Mobile navigation"
        className={[
          "fixed left-0 top-0 bottom-0 z-50 w-[260px]",
          "flex flex-col",
          "bg-[#000000]/90 backdrop-blur-3xl",
          "border-r border-white/[0.07]",
          "shadow-[0_24px_64px_-8px_rgba(0,0,0,0.95)]",
          "transition-transform duration-300 ease-in-out",
          "lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/[0.055] to-transparent" />
        <SidebarPanel
          collapsed={false}
          onToggleCollapse={() => {}}
          onClose={onMobileClose}
          isMobileDrawer
        />
      </aside>

      {/* ════════════════════════════════════════════════════════════ */}
      {/*  DESKTOP FLOATING SIDEBAR                                    */}
      {/* ════════════════════════════════════════════════════════════ */}

      <aside
        aria-label="Main navigation"
        className={[
          "hidden lg:flex",
          "fixed left-3 top-3 bottom-3 z-40 flex-col",
          "rounded-2xl border border-white/[0.07]",
          "bg-[#000000]/85 backdrop-blur-3xl",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.11),inset_1px_0_0_rgba(255,255,255,0.04),0_24px_64px_-8px_rgba(0,0,0,0.95)]",
          "transition-[width] duration-300 ease-in-out overflow-hidden",
          W,
        ].join(" ")}
      >
        <SidebarPanel
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((c) => !c)}
        />
      </aside>

      {/* ── Desktop layout spacer ── */}
      <div
        className={[
          "hidden lg:block shrink-0 transition-[width] duration-300 ease-in-out",
          SPACER,
        ].join(" ")}
        aria-hidden
      />
    </>
  );
}
