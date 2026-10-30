"use client";
// src/components/ui/TopBar.tsx
// Attesta — Global top bar: breadcrumbs, search, shield status, notifications, profile.
// Includes mobile hamburger button and notification/profile dropdowns.

import Link from "next/link";
import { useState, useRef, useEffect, type ReactNode } from "react";
import { MobileMenuButton } from "@/src/components/layout/Sidebar";

/* ------------------------------------------------------------------ */
/*  Icons                                                               */
/* ------------------------------------------------------------------ */

function BellIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 8a6 6 0 1112 0c0 7 3 8 3 8H3s3-1 3-8M10 21h4" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function AlertTriangleIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export type Crumb = { label: string; href?: string };

interface TopBarProps {
  crumbs?: Crumb[];
  actions?: ReactNode;
  demo?: boolean;
  onMenuOpen: () => void;
}

/* ------------------------------------------------------------------ */
/*  Notification panel                                                  */
/* ------------------------------------------------------------------ */

const NOTIFICATIONS = [
  { id: 1, type: "alert", message: "Incident INC-12456: Ransomware detected", time: "2m ago", href: "/incidents" },
  { id: 2, type: "warning", message: "3 SVIDs expiring within 15 minutes", time: "5m ago", href: "/workload-identity" },
  { id: 3, type: "alert", message: "Access denied: build-runner-1842 reading secrets", time: "10m ago", href: "/event-explorer" },
];

function NotificationPanel({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function keyHandler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", keyHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", keyHandler);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Notifications"
      className="absolute right-0 top-full mt-2 w-[340px] rounded-xl border border-emerald-500/30 bg-black/95 shadow-[0_0_25px_rgba(16,185,129,0.2)] z-50 overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07]">
        <span className="text-sm font-semibold text-white">Notifications</span>
        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500/80 px-1.5 text-[10px] font-bold text-white">
          {NOTIFICATIONS.length}
        </span>
      </div>
      <ul>
        {NOTIFICATIONS.map((n) => (
          <li key={n.id} className="border-b border-white/[0.05] last:border-0">
            <Link
              href={n.href}
              onClick={onClose}
              className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors"
            >
              <span className={`mt-0.5 shrink-0 ${n.type === "alert" ? "text-red-400" : "text-amber-400"}`}>
                <AlertTriangleIcon />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-white/90 leading-relaxed">{n.message}</p>
                <p className="mt-0.5 text-[10px] text-white/35">{n.time}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <div className="px-4 py-2.5 border-t border-white/[0.07]">
        <Link
          href="/incidents"
          onClick={onClose}
          className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
        >
          View all incidents →
        </Link>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Profile panel                                                       */
/* ------------------------------------------------------------------ */

function ProfilePanel({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function keyHandler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", keyHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", keyHandler);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="User profile menu"
      className="absolute right-0 top-full mt-2 w-[220px] rounded-xl border border-emerald-500/30 bg-black/95 shadow-[0_0_25px_rgba(16,185,129,0.2)] z-50 overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-white/[0.07]">
        <p className="text-sm font-semibold text-white">Admin</p>
        <p className="text-[11px] text-white/40">admin@attesta.dev</p>
      </div>
      <ul className="py-1">
        {[
          { label: "Profile settings", href: "/integrations" },
          { label: "Documentation", href: "/doc" },
          { label: "Integrations", href: "/integrations" },
        ].map((item) => (
          <li key={item.label}>
            <Link
              href={item.href}
              onClick={onClose}
              className="block px-4 py-2 text-xs text-white/70 hover:bg-white/[0.05] hover:text-white transition-colors"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
      <div className="border-t border-white/[0.07] py-1">
        <button
          onClick={onClose}
          className="block w-full px-4 py-2 text-left text-xs text-red-400/80 hover:bg-red-500/[0.08] hover:text-red-400 transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Security status panel                                               */
/* ------------------------------------------------------------------ */

const SECURITY_SERVICES = [
  { name: "Webhook ingestion", ok: true },
  { name: "Policy engine", ok: true },
  { name: "Runtime agent", ok: false, note: "Stale · 2 min" },
  { name: "Ledger", ok: true },
  { name: "SPIRE attestation", ok: true },
];

function SecurityPanel({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function keyHandler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", keyHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", keyHandler);
    };
  }, [onClose]);

  const allOk = SECURITY_SERVICES.every((s) => s.ok);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Security status"
      className="absolute right-0 top-full mt-2 w-[280px] rounded-xl border border-emerald-500/30 bg-black/95 shadow-[0_0_25px_rgba(16,185,129,0.2)] z-50 overflow-hidden"
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.07]">
        <span className={`h-2 w-2 rounded-full ${allOk ? "bg-emerald-400" : "bg-amber-400"}`} />
        <span className="text-sm font-semibold text-white">Security Status</span>
        <span className={`ml-auto text-xs font-medium ${allOk ? "text-emerald-400" : "text-amber-400"}`}>
          {allOk ? "All systems operational" : "Degraded"}
        </span>
      </div>
      <ul className="py-1">
        {SECURITY_SERVICES.map((s) => (
          <li key={s.name} className="flex items-center gap-3 px-4 py-2">
            <span className={s.ok ? "text-emerald-400" : "text-amber-400"}>
              {s.ok ? <CheckCircleIcon /> : <AlertTriangleIcon />}
            </span>
            <span className="flex-1 text-xs text-white/80">{s.name}</span>
            {s.note && <span className="text-[10px] text-amber-400">{s.note}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Global search                                                       */
/* ------------------------------------------------------------------ */

function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Cmd/Ctrl+K to open search
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <button
        aria-label="Global search (Ctrl+K)"
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
        className="hidden sm:flex items-center gap-2 h-8 rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 text-xs text-[#6B7280] hover:border-white/[0.12] hover:text-white/70 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
      >
        <SearchIcon />
        <span>Search…</span>
        <kbd className="ml-2 rounded border border-white/[0.07] px-1 py-px text-[9px] text-white/25">⌘K</kbd>
      </button>

      {open && (
        <>
          <div
            aria-hidden
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="fixed top-[20vh] left-1/2 -translate-x-1/2 z-50 w-full max-w-[560px] px-4">
            <div className="rounded-xl border border-emerald-500/35 bg-black/95 shadow-[0_0_30px_rgba(16,185,129,0.25)] overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.07]">
                <SearchIcon />
                <input
                  ref={inputRef}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search workloads, runs, events, policies…"
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
                  autoComplete="off"
                />
                <kbd
                  className="hidden sm:block rounded border border-white/[0.1] px-1.5 py-0.5 text-[10px] text-white/30 cursor-pointer hover:text-white/50"
                  onClick={() => setOpen(false)}
                >
                  ESC
                </kbd>
              </div>
              <div className="px-4 py-6 text-center text-xs text-white/30">
                {query ? `No results for "${query}"` : "Start typing to search across all resources"}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  TopBar component                                                    */
/* ------------------------------------------------------------------ */

export default function TopBar({ crumbs, actions, demo, onMenuOpen }: TopBarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] bg-black/95 px-4 py-3 backdrop-blur-md sm:px-6">
      {/* Left: mobile menu + breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <MobileMenuButton onClick={onMenuOpen} />

        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 min-w-0">
          {crumbs?.map((c, i) => (
            <span key={c.label} className="flex items-center gap-1.5 min-w-0">
              {i > 0 && <span className="text-white/20 text-xs select-none">/</span>}
              {c.href ? (
                <Link
                  href={c.href}
                  className="text-xs text-[#9CA3AF] hover:text-white transition-colors truncate focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                >
                  {c.label}
                </Link>
              ) : (
                <span className="text-xs font-medium text-white truncate" aria-current="page">
                  {c.label}
                </span>
              )}
            </span>
          ))}
          {demo && (
            <span className="ml-2 rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-amber-400 uppercase">
              Sample
            </span>
          )}
        </nav>
      </div>

      {/* Right: utilities */}
      <div className="flex items-center gap-2">
        <GlobalSearch />

        {/* Shield status */}
        <div className="relative">
          <button
            aria-label="Security status"
            aria-expanded={showSecurity}
            onClick={() => { setShowSecurity(!showSecurity); setShowNotifications(false); setShowProfile(false); }}
            className={`grid h-8 w-8 place-items-center rounded-lg border border-white/[0.07] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${showSecurity ? "bg-white/[0.08] text-emerald-400 border-white/[0.12]" : "text-[#9CA3AF] hover:bg-white/[0.04] hover:text-white"}`}
          >
            <ShieldIcon />
          </button>
          {showSecurity && <SecurityPanel onClose={() => setShowSecurity(false)} />}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            aria-label="Notifications (3 unread)"
            aria-expanded={showNotifications}
            onClick={() => { setShowNotifications(!showNotifications); setShowSecurity(false); setShowProfile(false); }}
            className={`relative grid h-8 w-8 place-items-center rounded-lg border border-white/[0.07] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${showNotifications ? "bg-white/[0.08] text-white border-white/[0.12]" : "text-[#9CA3AF] hover:bg-white/[0.04] hover:text-white"}`}
          >
            <BellIcon />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#EF4444] ring-1 ring-[#080C14]" aria-hidden />
          </button>
          {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} />}
        </div>

        {/* Additional actions slot */}
        {actions}

        {/* Profile */}
        <div className="relative">
          <button
            aria-label="User profile menu"
            aria-expanded={showProfile}
            onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); setShowSecurity(false); }}
            className={`grid h-7 w-7 place-items-center rounded-full text-xs font-semibold text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${showProfile ? "bg-white/25 ring-2 ring-white/20" : "bg-white/10 hover:bg-white/20"}`}
          >
            A
          </button>
          {showProfile && <ProfilePanel onClose={() => setShowProfile(false)} />}
        </div>
      </div>
    </header>
  );
}
