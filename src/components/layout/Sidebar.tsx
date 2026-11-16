"use client";

// src/components/layout/Sidebar.tsx
// Attesta — Responsive sidebar with mobile drawer, desktop collapsible rail.
// Destinations come from NAVIGATION_SECTIONS; this file owns only their icons.

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { NAVIGATION_SECTIONS, isActiveRoute } from "@/src/lib/navigation";

/* ------------------------------------------------------------------ */
/*  Icons                                                               */
/* ------------------------------------------------------------------ */

function Icon({ size = 16, strokeWidth = 1.7, children }: { size?: number; strokeWidth?: number; children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  );
}

const NAV_ICONS: Record<string, ReactNode> = {
  "/":                   <Icon><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></Icon>,
  "/pipeline-runs":      <Icon><circle cx="12" cy="5" r="2" /><circle cx="5" cy="19" r="2" /><circle cx="19" cy="19" r="2" /><path d="M12 7v4M9.5 17.5l-2.5-6M14.5 17.5l2.5-6" /></Icon>,
  "/event-explorer":     <Icon><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></Icon>,
  "/workload-identity":  <Icon><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" /></Icon>,
  "/trust-decisions":    <Icon><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></Icon>,
  "/access-policies":    <Icon><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 9h6M9 12h6M9 15h4" /></Icon>,
  "/runtime-monitoring": <Icon><circle cx="12" cy="12" r="3" /><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></Icon>,
  "/incidents":          <Icon><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></Icon>,
  "/trust-ledger":       <Icon><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></Icon>,
  "/provenance":         <Icon><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></Icon>,
  "/integrations":       <Icon><circle cx="12" cy="5" r="3" /><circle cx="19" cy="19" r="3" /><circle cx="5" cy="19" r="3" /><path d="M12 8v13M12 21l-7-7M12 21l7-7" /></Icon>,
  "/doc":                <Icon><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" /></Icon>,
};

/* ------------------------------------------------------------------ */
/*  Logo                                                                */
/* ------------------------------------------------------------------ */

// logo.png is an opaque black wordmark: screen blending lets the sidebar show through.
function Logo({ compact, onNavigate }: { compact: boolean; onNavigate?: () => void }) {
  return (
    <Link href="/" onClick={onNavigate} aria-label="Attesta overview" className="block rounded-md">
      <span className={`relative block overflow-hidden ${compact ? "h-[30px] w-12" : "h-[46px] w-[188px]"}`}>
        <Image
          src="/logo.png"
          alt="Attesta"
          fill
          sizes="188px"
          loading="eager"
          className={`mix-blend-screen brightness-150 grayscale ${compact ? "object-cover" : "object-contain"}`}
          style={compact ? { objectPosition: "17% 50%" } : undefined}
        />
      </span>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Sidebar Panel (shared by both desktop + mobile drawer)            */
/* ------------------------------------------------------------------ */

interface SidebarPanelProps {
  collapsed: boolean;
  onToggleCollapse?: () => void;
  onClose?: () => void;
}

function SidebarPanel({ collapsed, onToggleCollapse, onClose }: SidebarPanelProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      {/* ── Logo ── */}
      <div className={`flex h-[72px] shrink-0 items-center border-b border-line ${collapsed ? "justify-center" : "justify-between pl-3.5 pr-3"}`}>
        <Logo compact={collapsed} onNavigate={onClose} />
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Close navigation" className="icon-btn">
            <Icon strokeWidth={2}><path d="M6 6l12 12M18 6L6 18" /></Icon>
          </button>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="no-scrollbar flex-1 overflow-y-auto px-3 pb-3" aria-label="Main navigation">
        {NAVIGATION_SECTIONS.map((section, si) => (
          <div key={section.title}>
            {collapsed ? (
              si > 0 && <div className="mx-2 mt-3 h-px bg-line" />
            ) : (
              <p className="px-2.5 pb-1.5 pt-5 text-2xs font-medium text-muted">{section.title}</p>
            )}
            <ul className={collapsed ? "mt-3 space-y-0.5" : "space-y-0.5"}>
              {section.items.map((item) => {
                const active = isActiveRoute(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      aria-label={collapsed ? (item.badge ? `${item.label}, ${item.badge} open` : item.label) : undefined}
                      aria-current={active ? "page" : undefined}
                      onClick={onClose}
                      className={[
                        "group relative flex h-9 items-center rounded-lg transition-colors duration-150",
                        collapsed ? "justify-center" : "gap-2.5 px-2.5",
                        active ? "bg-raised font-medium text-fg" : "text-muted hover:bg-raised/50 hover:text-fg",
                      ].join(" ")}
                    >
                      {active && <span aria-hidden className="absolute -left-3 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-accent" />}
                      <span className={`shrink-0 ${active ? "text-accent-light" : ""}`}>{NAV_ICONS[item.href]}</span>
                      {!collapsed && <span className="min-w-0 flex-1 truncate text-xs">{item.label}</span>}
                      {!collapsed && item.badge !== undefined && (
                        <span aria-label={`${item.badge} open`} className="badge tabnum text-crit">{item.badge}</span>
                      )}
                      {collapsed && item.badge !== undefined && (
                        <span aria-hidden className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-crit" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* ── Collapse toggle (desktop only) ── */}
      {onToggleCollapse && (
        <div className="shrink-0 border-t border-line p-3">
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            className={`flex h-9 w-full items-center rounded-lg text-muted transition-colors duration-150 hover:bg-raised/50 hover:text-fg ${collapsed ? "justify-center" : "gap-2.5 px-2.5"}`}
          >
            <Icon strokeWidth={2}><polyline points={collapsed ? "9 18 15 12 9 6" : "15 18 9 12 15 6"} /></Icon>
            {!collapsed && <span className="text-xs">Collapse</span>}
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
    <button type="button" onClick={onClick} aria-label="Open navigation menu" className="icon-btn -ml-2 lg:hidden">
      <Icon size={18} strokeWidth={2}><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></Icon>
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
      {/* Overlay backdrop */}
      {mobileOpen && <div aria-hidden onClick={onMobileClose} className="scrim anim-fade z-40 lg:hidden" />}

      {/* Mobile sidebar drawer: inert while closed so its links leave the tab order */}
      <aside
        aria-label="Mobile navigation"
        inert={!mobileOpen}
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-[272px] max-w-[85vw] flex-col border-r border-line bg-sidebar backdrop-blur-xl",
          "transition-transform duration-200 ease-out lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <SidebarPanel collapsed={false} onClose={onMobileClose} />
      </aside>

      {/* Desktop rail */}
      <aside
        aria-label="Sidebar"
        style={{ width: collapsed ? "var(--sidebar-w-collapsed)" : "var(--sidebar-w)" }}
        className="fixed inset-y-0 left-0 z-30 hidden flex-col overflow-hidden border-r border-line bg-sidebar backdrop-blur-xl transition-[width] duration-200 ease-out lg:flex"
      >
        <SidebarPanel collapsed={collapsed} onToggleCollapse={() => setCollapsed((c) => !c)} />
      </aside>

      {/* Desktop layout spacer */}
      <div
        aria-hidden
        style={{ width: collapsed ? "var(--sidebar-w-collapsed)" : "var(--sidebar-w)" }}
        className="hidden shrink-0 transition-[width] duration-200 ease-out lg:block"
      />
    </>
  );
}
