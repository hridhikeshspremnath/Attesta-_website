"use client";
// src/components/ui/TopBar.tsx
// Attesta — Global top bar: breadcrumbs, search, shield status, notifications, profile.
// Includes mobile hamburger button and notification/profile dropdowns.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type KeyboardEvent, type ReactNode } from "react";
import { MobileMenuButton } from "@/src/components/layout/Sidebar";
import { Badge, StatusDot, TONE_TEXT, useModal } from "@/src/components/ui/primitives";
import { useFeed } from "@/src/lib/feeds";
import { useLedger } from "@/src/lib/ledger";
import { NAVIGATION_SECTIONS } from "@/src/lib/navigation";
import { findings, serviceHealth, type Alert, type Health } from "@/src/lib/status";
import type { IdentitySnapshot, PolicyView } from "@/src/types";

/* ------------------------------------------------------------------ */
/*  Icons                                                               */
/* ------------------------------------------------------------------ */

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 8a6 6 0 1112 0c0 7 3 8 3 8H3s3-1 3-8M10 21h4" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" />
    </svg>
  );
}

function SearchIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function AlertTriangleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
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
  onMenuOpen: () => void;
}

type MenuId = "security" | "notifications" | "profile";

/* ------------------------------------------------------------------ */
/*  Dropdown shell                                                      */
/* ------------------------------------------------------------------ */

const PANEL = "popover anim-pop fixed inset-x-4 top-16 z-50 overflow-hidden sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2";

// The outside-click boundary includes the trigger, so a second click closes the panel.
function Dropdown({
  trigger, open, onClose, children,
}: { trigger: ReactNode; open: boolean; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function keyHandler(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", keyHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", keyHandler);
    };
  }, [open, onClose]);

  return (
    <div ref={ref} className="sm:relative">
      {trigger}
      {open && children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Notification panel                                                  */
/* ------------------------------------------------------------------ */

function NotificationPanel({ onClose, alerts, open }: { onClose: () => void; alerts: Alert[]; open: number }) {
  return (
    <div role="dialog" aria-label="Notifications" className={`${PANEL} sm:w-[340px]`}>
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <span className="text-sm font-semibold text-fg">Notifications</span>
        <Badge tone={open ? "warn" : "ok"}>{open ? `${open} open` : "All clear"}</Badge>
      </div>
      {alerts.length === 0 && <p className="px-4 py-6 text-center text-xs text-muted">No open findings.</p>}
      <ul className="divide-y divide-line">
        {alerts.map((n) => (
          <li key={n.id}>
            <Link href={n.href} onClick={onClose} className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-raised/50">
              <span className={`mt-0.5 shrink-0 ${TONE_TEXT[n.tone]}`}><AlertTriangleIcon /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs text-fg">{n.message}</span>
                <span className="mt-0.5 block text-2xs text-muted">{n.time}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="border-t border-line px-4 py-3">
        <Link href="/incidents" onClick={onClose} className="link text-xs">View all findings</Link>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Profile panel                                                       */
/* ------------------------------------------------------------------ */

function ProfilePanel({ onClose }: { onClose: () => void }) {
  const [user, setUser] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    fetch("/api/auth/me").then((r) => (r.ok ? r.json() : null)).then((b) => { if (live && b) setUser(b.user); }).catch(() => {});
    return () => { live = false; };
  }, []);
  // Full reload on purpose: it drops all client state and re-runs the sign-in gate.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  const signOut = () => fetch("/api/auth/logout", { method: "POST" }).finally(() => { window.location.href = "/login"; });
  return (
    <div role="dialog" aria-label="User profile menu" className={`${PANEL} sm:w-[240px]`}>
      <div className="border-b border-line px-4 py-3">
        <p className="text-sm font-semibold text-fg">{user ?? "…"}</p>
        <p className="text-2xs text-muted">Signed in</p>
      </div>
      <ul className="py-1">
        {[
          { label: "Integrations & Settings", href: "/integrations" },
          { label: "Documentation", href: "/doc" },
        ].map((item) => (
          <li key={item.label}>
            <Link href={item.href} onClick={onClose} className="block px-4 py-2 text-xs text-muted transition-colors hover:bg-raised/50 hover:text-fg">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
      <div className="border-t border-line py-1">
        <button type="button" onClick={signOut} className="block w-full px-4 py-2 text-left text-xs text-muted transition-colors hover:bg-raised/50 hover:text-fg">
          Sign out
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Security status panel                                               */
/* ------------------------------------------------------------------ */

function SecurityPanel({ services }: { services: Health[] }) {
  const allOk = services.every((s) => s.ok);
  return (
    <div role="dialog" aria-label="Security status" className={`${PANEL} sm:w-[300px]`}>
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <StatusDot tone={allOk ? "ok" : "warn"} />
        <span className="text-sm font-semibold text-fg">Service status</span>
        <span className="ml-auto"><Badge tone={allOk ? "ok" : "warn"}>{allOk ? "Operational" : "Degraded"}</Badge></span>
      </div>
      <ul className="py-1">
        {services.map((s) => (
          <li key={s.name} className="flex items-center gap-3 px-4 py-2">
            <span className={s.ok ? "text-ok" : "text-warn"}>
              {s.ok ? <CheckCircleIcon /> : <AlertTriangleIcon />}
            </span>
            <span className="flex-1 text-xs text-fg">{s.name}</span>
            <span className={`text-2xs ${s.ok ? "text-muted" : "text-warn"}`}>{s.note}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Global search                                                       */
/* ------------------------------------------------------------------ */

const SEARCH_INDEX = NAVIGATION_SECTIONS.flatMap((section) =>
  section.items.map((item) => ({
    label: item.label,
    href: item.href,
    section: section.title,
    haystack: `${item.label} ${section.title} ${item.keywords ?? ""}`.toLowerCase(),
  })),
);

const noSubscribe = () => () => {};

function useShortcutLabel() {
  return useSyncExternalStore(
    noSubscribe,
    () => (/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘K" : "Ctrl K"),
    () => "Ctrl K",
  );
}

function SearchPalette({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  useModal(panelRef, onClose);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? SEARCH_INDEX.filter((r) => r.haystack.includes(q)) : SEARCH_INDEX;
  }, [query]);

  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (results.length === 0) return;
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((i) => (i + step + results.length) % results.length);
    }
    if (e.key === "Enter" && results[active]) go(results[active].href);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]">
      <div aria-hidden className="scrim anim-fade" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Search pages"
        tabIndex={-1}
        className="popover anim-pop relative w-full max-w-[560px] overflow-hidden focus:outline-none"
      >
        <div className="flex items-center gap-3 border-b border-line px-4 py-3 text-muted">
          <SearchIcon />
          <input
            data-autofocus
            type="search"
            role="combobox"
            aria-expanded="true"
            aria-controls="global-search-results"
            aria-activedescendant={results[active] ? `search-option-${active}` : undefined}
            aria-label="Search pages"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActive(0); }}
            onKeyDown={onKeyDown}
            placeholder="Go to a page, or search by SPIFFE, OPA, ledger…"
            className="min-w-0 flex-1 bg-transparent text-sm text-fg placeholder:text-muted focus:outline-none"
            autoComplete="off"
          />
          <button type="button" onClick={onClose} className="chip h-6 px-1.5 text-2xs">Esc</button>
        </div>
        <ul id="global-search-results" role="listbox" aria-label="Pages" className="max-h-[50vh] overflow-y-auto p-1.5">
          {results.map((r, i) => (
            <li
              key={r.href}
              id={`search-option-${i}`}
              role="option"
              aria-selected={i === active}
              onClick={() => go(r.href)}
              onMouseMove={() => setActive(i)}
              className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-xs ${i === active ? "bg-raised text-fg" : "text-muted"}`}
            >
              <span className="truncate">{r.label}</span>
              <span className="shrink-0 text-2xs text-muted">{r.section}</span>
            </li>
          ))}
        </ul>
        {results.length === 0 && (
          <p className="px-4 pb-6 pt-4 text-center text-xs text-muted">No page matches &ldquo;{query}&rdquo;. Search covers pages, not records.</p>
        )}
      </div>
    </div>
  );
}

function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const shortcut = useShortcutLabel();

  // Cmd/Ctrl+K to open search
  useEffect(() => {
    function handler(e: globalThis.KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <button
        type="button"
        aria-label={`Search pages (${shortcut})`}
        onClick={() => setOpen(true)}
        className="icon-btn sm:hidden"
      >
        <SearchIcon size={16} />
      </button>
      <button
        type="button"
        aria-label={`Search pages (${shortcut})`}
        onClick={() => setOpen(true)}
        className="hidden h-9 w-56 items-center gap-2 rounded-lg border border-line bg-card px-3 text-xs text-muted transition-colors hover:text-fg sm:flex"
      >
        <SearchIcon />
        <span className="flex-1 text-left">Search…</span>
        <kbd className="font-sans text-2xs text-muted">{shortcut}</kbd>
      </button>
      {open && <SearchPalette onClose={() => setOpen(false)} />}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  TopBar component                                                    */
/* ------------------------------------------------------------------ */

export default function TopBar({ crumbs, actions, onMenuOpen }: TopBarProps) {
  const [menu, setMenu] = useState<MenuId | null>(null);
  const closeMenu = useCallback(() => setMenu(null), []);
  const toggle = (id: MenuId) => setMenu((cur) => (cur === id ? null : id));
  const ledger = useLedger().state;
  const policy = useFeed<PolicyView>("/api/policy").state;
  const identity = useFeed<{ snapshot: IdentitySnapshot; now: number }>("/api/identity").state;
  const services = serviceHealth(ledger, policy, identity);
  const { alerts, open } = findings(ledger);
  const degraded = services.some((s) => !s.ok);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-line bg-canvas/60 px-4 backdrop-blur-xl sm:px-6">
      {/* Left: mobile menu + breadcrumbs */}
      <div className="flex min-w-0 items-center gap-2">
        <MobileMenuButton onClick={onMenuOpen} />

        <nav aria-label="Breadcrumb" className="min-w-0">
          <ol className="flex min-w-0 items-center gap-1.5 text-xs">
            {crumbs?.map((c, i) => {
              const last = i === crumbs.length - 1;
              return (
                <li key={c.label} className={`flex min-w-0 items-center gap-1.5 ${last ? "" : "hidden sm:flex"}`}>
                  {i > 0 && <span aria-hidden className="hidden select-none text-muted sm:inline">/</span>}
                  {last ? (
                    <span aria-current="page" className="truncate font-medium text-fg">{c.label}</span>
                  ) : c.href ? (
                    <Link href={c.href} className="truncate text-muted transition-colors hover:text-fg">{c.label}</Link>
                  ) : (
                    <span className="truncate text-muted">{c.label}</span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      {/* Right: utilities */}
      <div className="flex shrink-0 items-center gap-1">
        <GlobalSearch />

        {/* Shield status */}
        <Dropdown
          open={menu === "security"}
          onClose={closeMenu}
          trigger={
            <button
              type="button"
              aria-label={degraded ? "Service status: degraded" : "Service status: operational"}
              aria-expanded={menu === "security"}
              onClick={() => toggle("security")}
              className="icon-btn relative"
            >
              <ShieldIcon />
              {degraded && <span aria-hidden className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-warn" />}
            </button>
          }
        >
          <SecurityPanel services={services} />
        </Dropdown>

        {/* Notifications */}
        <Dropdown
          open={menu === "notifications"}
          onClose={closeMenu}
          trigger={
            <button
              type="button"
              aria-label={`Notifications (${open} open)`}
              aria-expanded={menu === "notifications"}
              onClick={() => toggle("notifications")}
              className="icon-btn relative"
            >
              <BellIcon />
              {open > 0 && <span aria-hidden className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-crit" />}
            </button>
          }
        >
          <NotificationPanel onClose={closeMenu} alerts={alerts} open={open} />
        </Dropdown>

        {/* Additional actions slot */}
        {actions}

        {/* Profile */}
        <Dropdown
          open={menu === "profile"}
          onClose={closeMenu}
          trigger={
            <button
              type="button"
              aria-label="User profile menu"
              aria-expanded={menu === "profile"}
              onClick={() => toggle("profile")}
              className="ml-1 grid h-8 w-8 place-items-center rounded-full bg-raised text-xs font-medium text-accent-light transition-colors hover:text-fg"
            >
              A
            </button>
          }
        >
          <ProfilePanel onClose={closeMenu} />
        </Dropdown>
      </div>
    </header>
  );
}
