"use client";
// src/components/ui/TopBar.tsx
// Shared page-level top bar: page title/breadcrumb + right-side utilities

import Link from "next/link";
import type { ReactNode } from "react";

const FOCUS = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500";

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

export type Crumb = { label: string; href?: string };

interface TopBarProps {
  crumbs?: Crumb[];
  actions?: ReactNode;
  /** Show the "Sample data" pill */
  demo?: boolean;
}

export default function TopBar({ crumbs, actions, demo }: TopBarProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] bg-[#080C14]/80 px-4 py-3 backdrop-blur-sm sm:px-6">
      {/* Left: breadcrumbs / page title */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 min-w-0">
        {crumbs?.map((c, i) => (
          <span key={c.label} className="flex items-center gap-1.5 min-w-0">
            {i > 0 && <span className="text-white/20 text-xs select-none">/</span>}
            {c.href ? (
              <Link
                href={c.href}
                className={`text-xs text-[#9CA3AF] hover:text-white transition-colors truncate ${FOCUS}`}
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

      {/* Right: utilities */}
      <div className="flex items-center gap-2">
        {/* Global search */}
        <button
          aria-label="Global search"
          className={`hidden sm:flex items-center gap-2 h-8 rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 text-xs text-[#6B7280] hover:border-white/[0.12] hover:text-white/70 transition-colors ${FOCUS}`}
        >
          <SearchIcon />
          <span>Search…</span>
          <kbd className="ml-2 rounded border border-white/[0.07] px-1 py-px text-[9px] text-white/25">⌘K</kbd>
        </button>

        {/* Shield status */}
        <button
          aria-label="Security status"
          className={`grid h-8 w-8 place-items-center rounded-lg border border-white/[0.07] text-[#9CA3AF] hover:bg-white/[0.04] hover:text-white transition-colors ${FOCUS}`}
        >
          <ShieldIcon />
        </button>

        {/* Notifications */}
        <button
          aria-label="Notifications"
          className={`relative grid h-8 w-8 place-items-center rounded-lg border border-white/[0.07] text-[#9CA3AF] hover:bg-white/[0.04] hover:text-white transition-colors ${FOCUS}`}
        >
          <BellIcon />
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#EF4444] ring-1 ring-[#080C14]" aria-hidden />
        </button>

        {/* Additional actions slot */}
        {actions}

        {/* Profile */}
        <button
          aria-label="User profile"
          className={`grid h-7 w-7 place-items-center rounded-full bg-white/10 text-xs font-semibold text-white hover:bg-white/20 transition-colors ${FOCUS}`}
        >
          A
        </button>
      </div>
    </header>
  );
}

