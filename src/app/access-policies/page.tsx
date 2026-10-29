"use client";
// src/app/access-policies/page.tsx
// Attesta — Access decisions and policy explorer, matched to the reference image.
// Neutral dark panel on a black canvas, amber IDs, slide-over "Audit log entry" drawer.
// Tailwind only; no new dependencies.

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";

/* ------------------------- types + tokens ------------------------- */

type Effect = "ALLOW" | "DENY";
type TabId = "decisions" | "policies";
type ViewMode = "decision" | "json";

type Spec = {
  timestamp: string; callId: string; kind: string; principalId: string;
  resourceKind: string; resourceId: string; action: string; effect: Effect;
  policy: string; version: string; hoursAgo: number;
};

type Entry = Spec & {
  principal: {
    id: string; scope: string; policyVersion: string; roles: string[];
    derivedRoles: string[]; attributes: Record<string, unknown>;
  };
  resource: {
    kind: string; policyVersion: string; id: string; scope: string;
    attributes: Record<string, unknown>;
  };
  decisions: { action: string; effect: Effect; policy: string }[];
};

const MUTED = "text-zinc-400";
const DIVIDER = "border-white/[0.07]";
const FOCUS = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400";
const FONT = 'Inter, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", system-ui, sans-serif';

/* ----------------------------- data ----------------------------- */

const SPECS: Spec[] = [
  { timestamp: "2026-02-26 14:02:11.352", callId: "01J4NYPC3RT24HCF554Z9H83QK", kind: "CheckAccess", principalId: "build-runner-1842", resourceKind: "secret", resourceId: "prod-signing-key", action: "read", effect: "DENY", policy: "secrets.read", version: "v7", hoursAgo: 0.1 },
  { timestamp: "2026-02-26 14:02:10.836", callId: "01J4NYPBKKB3CYATF0HP6Z8AZQ", kind: "CheckAccess", principalId: "build-runner-1842", resourceKind: "secret", resourceId: "registry-token", action: "read", effect: "DENY", policy: "secrets.read", version: "v7", hoursAgo: 0.1 },
  { timestamp: "2026-02-26 14:01:48.675", callId: "01J4NYJFDT7919ERPQJ94EJK0K", kind: "CheckAccess", principalId: "deploy-runner-1841", resourceKind: "deployment", resourceId: "staging", action: "publish", effect: "ALLOW", policy: "deploy.publish", version: "v3", hoursAgo: 0.1 },
  { timestamp: "2026-02-26 14:01:38.367", callId: "01J4NYPB4YM7QXKI23RDVTW7QH", kind: "CheckAccess", principalId: "build-runner-1842", resourceKind: "repo", resourceId: "dependency-manifest", action: "fetch", effect: "ALLOW", policy: "repo.read", version: "v5", hoursAgo: 0.1 },
  { timestamp: "2026-02-26 14:00:38.366", callId: "01J4NYJF4520XG7WYN0AR19CJ6", kind: "CheckAccess", principalId: "test-runner-1840", resourceKind: "secret", resourceId: "test-db-password", action: "read", effect: "DENY", policy: "secrets.read", version: "v7", hoursAgo: 0.2 },
  { timestamp: "2026-02-26 13:58:02.204", callId: "01J4NYJEZ34S4JKPRHZS1H0X2Q", kind: "PlanQuery", principalId: "build-runner-1839", resourceKind: "artifact", resourceId: "*", action: "sign", effect: "ALLOW", policy: "artifact.sign", version: "v2", hoursAgo: 0.2 },
  { timestamp: "2026-02-26 13:55:19.255", callId: "01J4NYJD25CEZ7C73YEQ9F6AG0", kind: "CheckAccess", principalId: "build-runner-1838", resourceKind: "artifact", resourceId: "web-bundle", action: "sign", effect: "ALLOW", policy: "artifact.sign", version: "v2", hoursAgo: 0.3 },
  { timestamp: "2026-02-25 18:39:50.342", callId: "01J4IXWQDPK96HE9H2VJ56KFPI", kind: "PlanQuery", principalId: "build-runner-1790", resourceKind: "artifact", resourceId: "*", action: "sign", effect: "ALLOW", policy: "artifact.sign", version: "v2", hoursAgo: 19.5 },
  { timestamp: "2026-02-25 08:38:27.321", callId: "01J4IXT6BK1V5IQCGF64YWEKB5", kind: "CheckAccess", principalId: "deploy-runner-1781", resourceKind: "deployment", resourceId: "production", action: "publish", effect: "DENY", policy: "deploy.publish", version: "v3", hoursAgo: 30 },
  { timestamp: "2026-02-22 10:14:00.515", callId: "01J4IXSC5WA4WT9WFAYYVRAQ5X", kind: "CheckAccess", principalId: "build-runner-1702", resourceKind: "repo", resourceId: "dependency-manifest", action: "fetch", effect: "ALLOW", policy: "repo.read", version: "v5", hoursAgo: 100 },
];

function runnerRole(principalId: string): string {
  if (principalId.startsWith("deploy")) return "DEPLOY_RUNNER";
  if (principalId.startsWith("test")) return "TEST_RUNNER";
  return "BUILD_RUNNER";
}

function buildEntry(s: Spec): Entry {
  return {
    ...s,
    principal: {
      id: s.principalId, scope: "-", policyVersion: "-",
      roles: ["WORKLOAD", runnerRole(s.principalId)],
      derivedRoles: ["ATTESTED_WORKLOAD", `${runnerRole(s.principalId)}_TRUSTED`],
      attributes: { repo: "[org/repo]", branch: "main", attested: true, trust: s.effect === "DENY" ? "review" : "trusted" },
    },
    resource: {
      kind: s.resourceKind, policyVersion: "-", id: s.resourceId, scope: "-",
      attributes: { environment: s.resourceKind === "deployment" ? s.resourceId : "prod", owner: "[team]", classification: "protected" },
    },
    decisions: [{ action: s.action, effect: s.effect, policy: `${s.policy} ${s.version}` }],
  };
}

const ENTRIES: Entry[] = SPECS.map(buildEntry);
const TIME_RANGES = [
  { label: "Last 1 h", hours: 1 },
  { label: "Last 24 h", hours: 24 },
  { label: "Last 7 d", hours: 168 },
];

/* --------------------------- filtering --------------------------- */

type Filters = { hours: number; callQuery: string; principalQuery: string };

function matchesFilters(e: Entry, f: Filters): boolean {
  if (e.hoursAgo > f.hours) return false;
  if (f.callQuery && !e.callId.toLowerCase().includes(f.callQuery.toLowerCase())) return false;
  if (f.principalQuery && !e.principalId.toLowerCase().includes(f.principalQuery.toLowerCase())) return false;
  return true;
}

/* --------------------------- primitives --------------------------- */

function IconButton({ label, children }: { label: string; children: ReactNode }) {
  return (
    <button
      aria-label={label}
      className={`grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/5 text-zinc-300 transition hover:bg-white/10 motion-reduce:transition-none ${FOCUS}`}
    >
      {children}
    </button>
  );
}

function FunnelIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M3 5h18l-7 8v6l-4-2v-4L3 5z" />
    </svg>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className={open ? "" : "rotate-180"}>
      <path d="M6 15l6-6 6 6" />
    </svg>
  );
}

function EffectPill({ effect }: { effect: Effect }) {
  const allow = effect === "ALLOW";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${allow ? "bg-emerald-900/50 text-emerald-300" : "bg-red-900/40 text-red-300"}`}>
      {allow && (
        <svg width="10" height="10" viewBox="0 0 16 16" aria-hidden><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      )}
      {effect}
    </span>
  );
}

/* ----------------------------- header ----------------------------- */

function TopBar() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/5 bg-[#0a0d14] px-4 py-3">
      <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-100">
        <span className="font-medium">Company health overview</span>
        <span className="text-xs text-zinc-500">· Thu, 26 Feb 2026</span>
        <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-zinc-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> synced 3 min ago
        </span>
      </div>
      <div className="flex items-center gap-2">
        <IconButton label="Security status">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" /></svg>
        </IconButton>
        <IconButton label="Notifications">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 8a6 6 0 1112 0c0 7 3 8 3 8H3s3-1 3-8M10 21h4" /></svg>
        </IconButton>
        <button className={`flex h-8 items-center gap-2 rounded-lg bg-zinc-100 px-3 text-xs font-medium text-zinc-900 transition hover:bg-white motion-reduce:transition-none ${FOCUS}`}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16" /></svg>
          Export
        </button>
      </div>
    </header>
  );
}

function PageTitle() {
  return (
    <div>
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-white">Access decisions</h1>
        <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-300">SAMPLE</span>
      </div>
      <p className={`mt-2 text-[11px] ${MUTED}`}>All times are shown in UTC. Decisions come from the policy engine and are signed to the trust ledger.</p>
    </div>
  );
}

/* ------------------------------ controls ------------------------------ */

const TABS: { id: TabId; label: string }[] = [
  { id: "decisions", label: "Decision logs" },
  { id: "policies", label: "Policy explorer" },
];

function TabBar({ tab, onChange }: { tab: TabId; onChange: (t: TabId) => void }) {
  return (
    <div role="tablist" aria-label="Access views" className={`flex gap-6 border-b ${DIVIDER}`}>
      {TABS.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={tab === t.id}
          onClick={() => onChange(t.id)}
          className={`-mb-px border-b-2 px-1 py-3 text-xs ${FOCUS} ${tab === t.id ? "border-amber-400 text-white" : "border-transparent text-zinc-400 hover:text-zinc-200"}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function ViewToggle({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
  const base = `flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium ${FOCUS}`;
  return (
    <div role="group" aria-label="Display mode" className="flex rounded-lg border border-white/10 bg-white/[0.04] p-0.5">
      <button aria-pressed={mode === "decision"} onClick={() => onChange("decision")} className={`${base} ${mode === "decision" ? "bg-emerald-900/50 text-emerald-300" : "text-zinc-300"}`}>
        {mode === "decision" && <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
        Decision
      </button>
      <button aria-pressed={mode === "json"} onClick={() => onChange("json")} className={`${base} ${mode === "json" ? "bg-emerald-900/50 text-emerald-300" : "text-zinc-300"}`}>
        JSON
      </button>
    </div>
  );
}

function TimeRangeSelect({ hours, onChange }: { hours: number; onChange: (h: number) => void }) {
  return (
    <select
      aria-label="Filter time range"
      value={hours}
      onChange={(e) => onChange(Number(e.target.value))}
      className={`h-8 min-w-[200px] rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs text-zinc-300 ${FOCUS}`}
    >
      {TIME_RANGES.map((r) => <option key={r.hours} value={r.hours} className="bg-[#151515]">{r.label}</option>)}
    </select>
  );
}

/* ------------------------------- tables ------------------------------- */

type FilterKey = "call" | "principal";

function FilterHeader({ label, active, onToggle }: { label: string; active: boolean; onToggle: () => void }) {
  return (
    <span className="inline-flex items-center gap-2">
      {label}
      <button onClick={onToggle} aria-label={`Filter by ${label}`} aria-pressed={active} className={`rounded p-1 hover:bg-white/10 ${active ? "text-amber-300" : "text-zinc-500"} ${FOCUS}`}>
        <FunnelIcon />
      </button>
    </span>
  );
}

function FilterInputs({ open, filters, onChange }: { open: FilterKey | null; filters: Filters; onChange: (f: Filters) => void }) {
  if (!open) return null;
  const isCall = open === "call";
  return (
    <div className={`border-b px-4 py-2 ${DIVIDER}`}>
      <input
        autoFocus
        value={isCall ? filters.callQuery : filters.principalQuery}
        onChange={(e) => onChange({ ...filters, [isCall ? "callQuery" : "principalQuery"]: e.target.value })}
        placeholder={isCall ? "Filter by decision ID…" : "Filter by principal…"}
        aria-label={isCall ? "Filter by decision ID" : "Filter by principal"}
        className={`h-8 w-full max-w-sm rounded-md border border-white/10 bg-white/[0.04] px-3 font-mono text-xs text-zinc-200 placeholder:text-zinc-500 ${FOCUS}`}
      />
    </div>
  );
}

function DecisionRow({ e, selected, onSelect }: { e: Entry; selected: boolean; onSelect: () => void }) {
  return (
    <tr
      tabIndex={0}
      aria-selected={selected}
      onClick={onSelect}
      onKeyDown={(ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); onSelect(); } }}
      className={`cursor-pointer border-t font-mono text-[11px] transition motion-reduce:transition-none ${DIVIDER} ${FOCUS} ${selected ? "bg-white/[0.07]" : "hover:bg-white/[0.04]"}`}
    >
      <td className="whitespace-nowrap px-4 py-3 text-zinc-200">{e.timestamp}</td>
      <td className="whitespace-nowrap px-3 py-3 text-amber-500">{e.callId}</td>
      <td className="whitespace-nowrap px-3 py-3 text-zinc-200">{e.kind}</td>
      <td className="whitespace-nowrap px-3 py-3 text-amber-500">{e.principalId}</td>
      <td className="whitespace-nowrap px-3 py-3 text-zinc-300">{e.resourceKind}/{e.resourceId}</td>
      <td className="whitespace-nowrap px-3 py-3 pr-4"><EffectPill effect={e.effect} /></td>
    </tr>
  );
}

function DecisionTable({
  rows, selectedId, onSelect, filters, onFilters,
}: { rows: Entry[]; selectedId: string | null; onSelect: (id: string) => void; filters: Filters; onFilters: (f: Filters) => void }) {
  const [openFilter, setOpenFilter] = useState<FilterKey | null>(null);
  const toggle = (k: FilterKey) => setOpenFilter((cur) => (cur === k ? null : k));
  return (
    <div>
      <FilterInputs open={openFilter} filters={filters} onChange={onFilters} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left">
          <thead>
            <tr className="text-[11px] font-semibold text-zinc-200">
              <th scope="col" className="px-4 py-3">Timestamp</th>
              <th scope="col" className="px-3 py-3"><FilterHeader label="Decision ID" active={openFilter === "call" || !!filters.callQuery} onToggle={() => toggle("call")} /></th>
              <th scope="col" className="px-3 py-3">Request kind</th>
              <th scope="col" className="px-3 py-3"><FilterHeader label="Principal" active={openFilter === "principal" || !!filters.principalQuery} onToggle={() => toggle("principal")} /></th>
              <th scope="col" className="px-3 py-3">Resource</th>
              <th scope="col" className="px-3 py-3 pr-4">Effect</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => <DecisionRow key={e.callId} e={e} selected={e.callId === selectedId} onSelect={() => onSelect(e.callId)} />)}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && <p className={`px-4 py-8 text-center text-xs ${MUTED}`}>No decisions match these filters.</p>}
      <p className={`border-t px-4 py-3 text-[10px] ${DIVIDER} ${MUTED}`}>{rows.length} of {ENTRIES.length} decisions</p>
    </div>
  );
}

function JsonView({ rows }: { rows: Entry[] }) {
  const text = JSON.stringify(
    rows.map(({ callId, timestamp, kind, principalId, resourceKind, resourceId, action, effect, policy, version }) => ({
      callId, timestamp, kind, principalId, resource: `${resourceKind}/${resourceId}`, action, effect, policy: `${policy} ${version}`,
    })),
    null,
    2,
  );
  return (
    <pre tabIndex={0} aria-label="Decisions as JSON" className={`m-4 max-h-[480px] overflow-auto rounded-lg bg-[#1d1d1d] p-4 font-mono text-[11px] leading-relaxed text-amber-200 ${FOCUS}`}>
      {text}
    </pre>
  );
}

function PolicyTable() {
  const stats = useMemo(() => {
    const map = new Map<string, { policy: string; version: string; kind: string; allow: number; deny: number; last: string }>();
    for (const e of ENTRIES) {
      const key = `${e.policy} ${e.version}`;
      const cur = map.get(key) ?? { policy: e.policy, version: e.version, kind: e.resourceKind, allow: 0, deny: 0, last: e.timestamp };
      if (e.effect === "ALLOW") cur.allow += 1; else cur.deny += 1;
      if (e.timestamp > cur.last) cur.last = e.timestamp;
      map.set(key, cur);
    }
    return Array.from(map.values());
  }, []);
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left">
        <thead>
          <tr className="text-[11px] font-semibold text-zinc-200">
            {["Policy", "Version", "Resource kind", "Allowed", "Denied", "Last evaluated"].map((h, i) => (
              <th key={h} scope="col" className={`py-3 ${i === 0 ? "px-4" : "px-3"}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {stats.map((s) => (
            <tr key={s.policy + s.version} className={`border-t font-mono text-[11px] ${DIVIDER}`}>
              <td className="px-4 py-3 text-amber-500">{s.policy}</td>
              <td className="px-3 py-3 text-zinc-200">{s.version}</td>
              <td className="px-3 py-3 text-zinc-300">{s.kind}</td>
              <td className="px-3 py-3 text-emerald-400">{s.allow}</td>
              <td className="px-3 py-3 text-red-400">{s.deny}</td>
              <td className="whitespace-nowrap px-3 py-3 text-zinc-300">{s.last}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------- drawer ------------------------------- */

function JsonLine({ line }: { line: string }) {
  const m = line.match(/^(\s*)("[^"]+")(:\s)(.*)$/);
  if (!m) return <span className="text-amber-200">{line}</span>;
  const [, indent, key, colon, value] = m;
  const valueColor = value.startsWith('"') ? "text-amber-300" : "text-sky-300";
  return (
    <>
      <span>{indent}</span><span className="text-amber-200">{key}</span><span className="text-zinc-300">{colon}</span><span className={valueColor}>{value}</span>
    </>
  );
}

function JsonBlock({ value }: { value: unknown }) {
  const lines = JSON.stringify(value, null, 2).split("\n");
  return (
    <pre className="mt-3 overflow-x-auto rounded-lg bg-[#1f1f1f] p-3 font-mono text-[10px] leading-5">
      {lines.map((line, i) => (
        <div key={i} className="flex gap-4">
          <span aria-hidden className="w-3 shrink-0 select-none text-right text-zinc-600">{i + 1}</span>
          <code className="whitespace-pre"><JsonLine line={line} /></code>
        </div>
      ))}
    </pre>
  );
}

function Pair({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-2 py-1.5 text-[10px]">
      <dt className={MUTED}>{label}</dt>
      <dd className="break-all font-mono text-zinc-100">{children}</dd>
    </div>
  );
}

function DrawerSection({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <section className={`border-t px-5 py-4 ${DIVIDER}`}>
      <button onClick={() => setOpen(!open)} aria-expanded={open} className={`flex w-full items-center justify-between text-left ${FOCUS}`}>
        <span className="flex items-center gap-2 text-[13px] font-bold text-white">{icon}{title}</span>
        <Chevron open={open} />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </section>
  );
}

const SECTION_ICON = "text-zinc-200";

function PrincipalSection({ p }: { p: Entry["principal"] }) {
  return (
    <DrawerSection title="Principal" icon={<svg className={SECTION_ICON} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>}>
      <dl>
        <Pair label="ID">{p.id}</Pair>
        <Pair label="Scope">{p.scope}</Pair>
        <Pair label="Policy version">{p.policyVersion}</Pair>
        <Pair label="Roles">{p.roles.join(", ")}</Pair>
        <Pair label="Effective derived roles">{p.derivedRoles.join(", ")}</Pair>
        <Pair label="Attributes"><span /></Pair>
      </dl>
      <JsonBlock value={p.attributes} />
    </DrawerSection>
  );
}

function ResourceSection({ r }: { r: Entry["resource"] }) {
  return (
    <DrawerSection title="Resource" icon={<svg className={SECTION_ICON} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zM12 12l8-4.5M12 12v9M12 12L4 7.5" /></svg>}>
      <dl>
        <Pair label="Kind">{r.kind}</Pair>
        <Pair label="Policy version">{r.policyVersion}</Pair>
        <Pair label="ID">{r.id}</Pair>
        <Pair label="Scope">{r.scope}</Pair>
        <Pair label="Attributes"><span /></Pair>
      </dl>
      <JsonBlock value={r.attributes} />
    </DrawerSection>
  );
}

function DecisionsSection({ items }: { items: Entry["decisions"] }) {
  return (
    <DrawerSection title="Decisions" icon={<svg className={SECTION_ICON} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M5 4l7 8v8M19 4l-7 8" /></svg>}>
      {items.map((d) => (
        <dl key={d.action} className={`rounded-lg border px-3 py-1 ${DIVIDER}`}>
          <Pair label="Action">{d.action}</Pair>
          <div className="grid grid-cols-[110px_1fr] items-center gap-2 py-1.5 text-[10px]">
            <dt className={MUTED}>Effect</dt>
            <dd><EffectPill effect={d.effect} /></dd>
          </div>
          <Pair label="Policy">{d.policy}</Pair>
        </dl>
      ))}
    </DrawerSection>
  );
}

function EntryDrawer({ entry, onClose }: { entry: Entry; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (ev: KeyboardEvent) => { if (ev.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <>
      <div aria-hidden onClick={onClose} className="fixed inset-0 z-30 bg-black/50" />
      <aside role="dialog" aria-modal="true" aria-label="Audit log entry" className="fixed inset-y-0 right-0 z-40 w-full max-w-[380px] overflow-y-auto border-l border-white/10 bg-[#151515] shadow-2xl">
        <div className="flex items-start justify-between px-5 pt-5">
          <h2 className="text-lg font-bold text-white">Audit log entry</h2>
          <button ref={closeRef} onClick={onClose} aria-label="Close" className={`grid h-8 w-8 place-items-center rounded-md text-zinc-300 hover:bg-white/10 ${FOCUS}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <dl className="px-5 pb-4"><Pair label="Timestamp">{entry.timestamp}</Pair></dl>
        <PrincipalSection p={entry.principal} />
        <ResourceSection r={entry.resource} />
        <DecisionsSection items={entry.decisions} />
      </aside>
    </>
  );
}

/* --------------------------------- page --------------------------------- */

export default function AccessPoliciesPage() {
  const [tab, setTab] = useState<TabId>("decisions");
  const [mode, setMode] = useState<ViewMode>("decision");
  const [filters, setFilters] = useState<Filters>({ hours: 24, callQuery: "", principalQuery: "" });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const rows = useMemo(() => ENTRIES.filter((e) => matchesFilters(e, filters)), [filters]);
  const selected = ENTRIES.find((e) => e.callId === selectedId) ?? null;

  return (
    <DashboardLayout>
      <div className="min-h-full bg-black p-4 sm:p-6" style={{ fontFamily: FONT }}>
        <div className="mx-auto max-w-[1200px] space-y-4">
          <TopBar />
          <div className="space-y-4 rounded-xl border border-white/5 bg-[#101010] p-4 sm:p-6">
            <PageTitle />
            <TabBar tab={tab} onChange={setTab} />
            {tab === "decisions" ? (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <ViewToggle mode={mode} onChange={setMode} />
                  <TimeRangeSelect hours={filters.hours} onChange={(hours) => setFilters({ ...filters, hours })} />
                </div>
                <div className={`overflow-hidden rounded-lg border ${DIVIDER} bg-[#141414]`}>
                  {mode === "decision"
                    ? <DecisionTable rows={rows} selectedId={selectedId} onSelect={setSelectedId} filters={filters} onFilters={setFilters} />
                    : <JsonView rows={rows} />}
                </div>
              </>
            ) : (
              <div className={`overflow-hidden rounded-lg border ${DIVIDER} bg-[#141414]`}><PolicyTable /></div>
            )}
          </div>
        </div>
      </div>
      {selected && <EntryDrawer entry={selected} onClose={() => setSelectedId(null)} />}
    </DashboardLayout>
  );
}