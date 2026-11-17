"use client";

// src/components/ui/primitives.tsx
// Attesta — Shared UI primitives. Visual rules live in globals.css; these
// components add the semantics and behaviour every page would otherwise repeat.

import Link from "next/link";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";

/* ------------------------------------------------------------------ */
/*  Tones                                                               */
/* ------------------------------------------------------------------ */

export type Tone = "ok" | "warn" | "crit" | "info" | "neutral";

export const TONE_TEXT: Record<Tone, string> = {
  ok:      "text-ok",
  warn:    "text-warn",
  crit:    "text-crit",
  info:    "text-info",
  neutral: "text-muted",
};

export const TONE_BG: Record<Tone, string> = {
  ok:      "bg-ok",
  warn:    "bg-warn",
  crit:    "bg-crit",
  info:    "bg-info",
  neutral: "bg-muted",
};

/* ------------------------------------------------------------------ */
/*  Status                                                              */
/* ------------------------------------------------------------------ */

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`badge ${TONE_TEXT[tone]}`}>{children}</span>;
}

export function SampleBadge() {
  return <Badge tone="info">Sample data</Badge>;
}

export function StatusDot({ tone }: { tone: Tone }) {
  return <span aria-hidden className={`h-1.5 w-1.5 shrink-0 rounded-full ${TONE_BG[tone]}`} />;
}

/* ------------------------------------------------------------------ */
/*  Card                                                                */
/* ------------------------------------------------------------------ */

interface CardProps {
  title?: string;
  aside?: ReactNode;
  /** Remove body padding so tables can run edge to edge. */
  flush?: boolean;
  className?: string;
  children: ReactNode;
}

export function Card({ title, aside, flush, className = "", children }: CardProps) {
  return (
    <section className={`card min-w-0 ${className}`}>
      {(title || aside) && (
        <div className={`flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-5 pt-4 ${flush ? "pb-3" : "pb-2"}`}>
          {title && <h2 className="text-base font-semibold text-fg">{title}</h2>}
          {aside}
        </div>
      )}
      {flush ? children : <div className={`px-5 pb-5 ${title || aside ? "" : "pt-5"}`}>{children}</div>}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Buttons                                                             */
/* ------------------------------------------------------------------ */

type ButtonVariant = "primary" | "secondary";

function buttonClass(variant: ButtonVariant, size: "md" | "sm", extra = "") {
  return `btn ${variant === "primary" ? "btn-primary" : ""} ${size === "sm" ? "btn-sm" : ""} ${extra}`;
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "md" | "sm";
}

export function Button({ variant = "secondary", size = "md", className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />;
}

interface ButtonLinkProps extends ComponentProps<typeof Link> {
  variant?: ButtonVariant;
  size?: "md" | "sm";
}

export function ButtonLink({ variant = "secondary", size = "md", className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

/** Copies text to the clipboard and reports the real outcome. */
export function CopyButton({ text, label, size = "md" }: { text: string; label: string; size?: "md" | "sm" }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      setState("failed");
    }
    setTimeout(() => setState("idle"), 1500);
  };
  return (
    <Button size={size} onClick={copy} aria-live="polite">
      {state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : label}
    </Button>
  );
}

/* ------------------------------------------------------------------ */
/*  Inputs                                                              */
/* ------------------------------------------------------------------ */

export function SearchField({
  value, onChange, placeholder, label, className = "",
}: { value: string; onChange: (v: string) => void; placeholder: string; label: string; className?: string }) {
  return (
    <div className={`relative min-w-0 ${className}`}>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="field pl-9"
      />
    </div>
  );
}

/** Dropdown filter whose current value stays visible in the control. */
export function FilterSelect({
  name, value, options, onChange,
}: { name: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <select
      aria-label={`Filter by ${name.toLowerCase()}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      data-active={value !== "any"}
      className="field h-8 w-auto text-2xs"
    >
      {options.map((o) => <option key={o} value={o}>{name}: {o}</option>)}
    </select>
  );
}

/* ------------------------------------------------------------------ */
/*  Tabs                                                                */
/* ------------------------------------------------------------------ */

interface TabsProps<T extends string> {
  tabs: readonly T[];
  value: T;
  onChange: (tab: T) => void;
  label: string;
  panelId: string;
}

export function tabId(panelId: string, tab: string) {
  return `${panelId}-tab-${tab.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

export function Tabs<T extends string>({ tabs, value, onChange, label, panelId }: TabsProps<T>) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const onKeyDown = (e: KeyboardEvent) => {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = tabs[(tabs.indexOf(value) + step + tabs.length) % tabs.length];
    onChange(next);
    refs.current[next]?.focus();
  };

  return (
    <div role="tablist" aria-label={label} className="tabs" onKeyDown={onKeyDown}>
      {tabs.map((t) => (
        <button
          key={t}
          ref={(el) => { refs.current[t] = el; }}
          type="button"
          role="tab"
          id={tabId(panelId, t)}
          aria-selected={value === t}
          aria-controls={panelId}
          tabIndex={value === t ? 0 : -1}
          onClick={() => onChange(t)}
          className="tab"
        >
          {t}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty state                                                         */
/* ------------------------------------------------------------------ */

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="px-5 py-10 text-center">
      <p className="text-sm font-medium text-fg">{title}</p>
      {children && <p className="mx-auto mt-1 max-w-md text-xs text-muted">{children}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

/** Mirrors the common page shape so content does not shift when it arrives. */
export function PageSkeleton() {
  return (
    <div className="page" role="status" aria-label="Loading">
      <div className="space-y-2">
        <div className="skeleton h-7 w-56" />
        <div className="skeleton h-4 w-80 max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-24" />)}
      </div>
      <div className="skeleton h-80" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sortable table header                                               */
/* ------------------------------------------------------------------ */

export type SortState<K extends string> = { key: K; dir: "asc" | "desc" };

/** Sorts rows client-side; activating the current column reverses it. */
export function useSort<T, K extends string>(
  rows: T[],
  accessors: Record<K, (row: T) => string | number>,
  initial: SortState<NoInfer<K>>,
) {
  const [sort, setSort] = useState<SortState<K>>(initial);
  const sorted = useMemo(() => {
    const read = accessors[sort.key];
    const factor = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const x = read(a), y = read(b);
      return (x < y ? -1 : x > y ? 1 : 0) * factor;
    });
  }, [rows, accessors, sort]);
  const toggle = (key: K) =>
    setSort((cur) => ({ key, dir: cur.key === key && cur.dir === "asc" ? "desc" : "asc" }));
  return { sorted, sort, toggle };
}

interface SortHeaderProps<K extends string> {
  label: string;
  sortKey: K;
  sort: SortState<K>;
  onSort: (key: K) => void;
}

export function SortHeader<K extends string>({ label, sortKey, sort, onSort }: SortHeaderProps<K>) {
  const active = sort.key === sortKey;
  return (
    <th scope="col" aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
      <button type="button" onClick={() => onSort(sortKey)} className="sort-btn">
        {label}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={active ? (sort.dir === "asc" ? "rotate-180" : "") : "opacity-0"}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
    </th>
  );
}

/* ------------------------------------------------------------------ */
/*  Modal layers                                                        */
/* ------------------------------------------------------------------ */

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Shared modal behaviour: Escape, focus trap, focus restore and scroll lock. */
export function useModal(ref: RefObject<HTMLElement | null>, onClose: () => void) {
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const container = ref.current;
    (container?.querySelector<HTMLElement>("[data-autofocus]") ?? container)?.focus();

    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") { closeRef.current(); return; }
      if (e.key !== "Tab" || !container) return;
      const items = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) { e.preventDefault(); return; }
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };

    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [ref]);
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

interface LayerProps {
  title: string;
  description?: ReactNode;
  onClose: () => void;
  children: ReactNode;
}

export function Dialog({ title, description, onClose, children, footer }: LayerProps & { footer?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useModal(ref, onClose);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4">
      <div aria-hidden onClick={onClose} className="scrim anim-fade" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="popover anim-pop relative w-full max-w-md focus:outline-none"
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-semibold text-fg">{title}</h2>
            {description && <p className="mt-1 text-xs text-muted">{description}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" data-autofocus className="icon-btn -mr-2 -mt-1"><CloseIcon /></button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

export function Drawer({ title, description, onClose, children }: LayerProps) {
  const ref = useRef<HTMLElement>(null);
  const titleId = useId();
  useModal(ref, onClose);
  return (
    <>
      <div aria-hidden onClick={onClose} className="scrim anim-fade z-40" />
      <aside
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="anim-drawer fixed inset-y-0 right-0 z-50 w-full max-w-[420px] overflow-y-auto border-l border-line bg-card focus:outline-none"
      >
        <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-semibold text-fg">{title}</h2>
            {description && <div className="mt-1 text-xs text-muted">{description}</div>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" data-autofocus className="icon-btn -mr-2 -mt-1"><CloseIcon /></button>
        </div>
        {children}
      </aside>
    </>
  );
}
