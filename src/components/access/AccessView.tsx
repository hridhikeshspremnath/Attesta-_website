"use client";
// src/components/access/AccessView.tsx
// Attesta — Trust decision log and OPA policy explorer. /trust-decisions and
// /access-policies are the two views of this data, addressable by URL.

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import PageHeader from "@/src/components/ui/PageHeader";
import {
  Badge, Button, ButtonLink, Card, Drawer, EmptyState, SampleBadge, SearchField, SortHeader, useSort,
} from "@/src/components/ui/primitives";

/* ------------------------- types + tokens ------------------------- */

type Effect = "ALLOW" | "DENY";
type ViewMode = "decision" | "json";
export type AccessViewId = "decisions" | "policies";

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

type EffectFilter = "any" | Effect;
type Filters = { hours: number; effect: EffectFilter; callQuery: string; principalQuery: string };

const INITIAL_FILTERS: Filters = { hours: 24, effect: "any", callQuery: "", principalQuery: "" };

function matchesFilters(e: Entry, f: Filters): boolean {
  if (e.hoursAgo > f.hours) return false;
  if (f.effect !== "any" && e.effect !== f.effect) return false;
  if (f.callQuery && !e.callId.toLowerCase().includes(f.callQuery.toLowerCase())) return false;
  if (f.principalQuery && !e.principalId.toLowerCase().includes(f.principalQuery.toLowerCase())) return false;
  return true;
}

/* --------------------------- primitives --------------------------- */

function Chevron({ open }: { open: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className={`text-muted ${open ? "" : "rotate-180"}`}>
      <path d="M6 15l6-6 6 6" />
    </svg>
  );
}

function EffectBadge({ effect }: { effect: Effect }) {
  return <Badge tone={effect === "ALLOW" ? "ok" : "crit"}>{effect}</Badge>;
}

/* ------------------------------ controls ------------------------------ */

const VIEWS: { id: AccessViewId; label: string; href: string }[] = [
  { id: "decisions", label: "Decision logs", href: "/trust-decisions" },
  { id: "policies", label: "Policy explorer", href: "/access-policies" },
];

function ViewNav({ view }: { view: AccessViewId }) {
  return (
    <nav aria-label="Access views" className="tabs">
      {VIEWS.map((v) => (
        <Link key={v.id} href={v.href} aria-current={view === v.id ? "page" : undefined} className="tab">
          {v.label}
        </Link>
      ))}
    </nav>
  );
}

function ViewToggle({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
  return (
    <div role="group" aria-label="Display mode" className="flex gap-1">
      <button type="button" aria-pressed={mode === "decision"} onClick={() => onChange("decision")} className="chip">Table</button>
      <button type="button" aria-pressed={mode === "json"} onClick={() => onChange("json")} className="chip">JSON</button>
    </div>
  );
}

function DecisionFilters({ filters, onChange }: { filters: Filters; onChange: (f: Filters) => void }) {
  const dirty = filters.hours !== INITIAL_FILTERS.hours || filters.effect !== "any" || !!filters.callQuery || !!filters.principalQuery;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        aria-label="Filter time range"
        value={filters.hours}
        onChange={(e) => onChange({ ...filters, hours: Number(e.target.value) })}
        className="field h-8 w-auto text-2xs"
      >
        {TIME_RANGES.map((r) => <option key={r.hours} value={r.hours}>{r.label}</option>)}
      </select>
      <select
        aria-label="Filter by effect"
        value={filters.effect}
        onChange={(e) => onChange({ ...filters, effect: e.target.value as EffectFilter })}
        data-active={filters.effect !== "any"}
        className="field h-8 w-auto text-2xs"
      >
        <option value="any">Effect: any</option>
        <option value="ALLOW">Effect: ALLOW</option>
        <option value="DENY">Effect: DENY</option>
      </select>
      <SearchField
        value={filters.principalQuery}
        onChange={(principalQuery) => onChange({ ...filters, principalQuery })}
        placeholder="Principal…"
        label="Filter by principal"
        className="w-full sm:w-52"
      />
      <SearchField
        value={filters.callQuery}
        onChange={(callQuery) => onChange({ ...filters, callQuery })}
        placeholder="Decision ID…"
        label="Filter by decision ID"
        className="w-full sm:w-52"
      />
      {dirty && <Button size="sm" onClick={() => onChange(INITIAL_FILTERS)}>Reset</Button>}
    </div>
  );
}

/* ------------------------------- tables ------------------------------- */

function DecisionRow({ e, selected, onSelect }: { e: Entry; selected: boolean; onSelect: () => void }) {
  return (
    <tr
      tabIndex={0}
      aria-current={selected ? "true" : undefined}
      onClick={onSelect}
      onKeyDown={(ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); onSelect(); } }}
      className="cursor-pointer font-mono text-2xs"
    >
      <td className="tabnum whitespace-nowrap text-muted">{e.timestamp}</td>
      <td className="whitespace-nowrap text-fg">{e.callId}</td>
      <td className="whitespace-nowrap text-muted">{e.kind}</td>
      <td className="whitespace-nowrap text-fg">{e.principalId}</td>
      <td className="whitespace-nowrap text-fg">{e.resourceKind}/{e.resourceId}</td>
      <td className="whitespace-nowrap text-muted">{e.policy} {e.version}</td>
      <td className="whitespace-nowrap font-sans"><EffectBadge effect={e.effect} /></td>
    </tr>
  );
}

type SortKey = "timestamp" | "principal" | "effect";

const SORT_ACCESSORS: Record<SortKey, (e: Entry) => string> = {
  timestamp: (e) => e.timestamp,
  principal: (e) => e.principalId,
  effect:    (e) => e.effect,
};

function DecisionTable({
  rows, selectedId, onSelect, onReset,
}: { rows: Entry[]; selectedId: string | null; onSelect: (id: string) => void; onReset: () => void }) {
  const { sorted, sort, toggle } = useSort(rows, SORT_ACCESSORS, { key: "timestamp", dir: "desc" });
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="data-table min-w-[1040px]">
          <thead>
            <tr>
              <SortHeader label="Timestamp" sortKey="timestamp" sort={sort} onSort={toggle} />
              <th scope="col">Decision ID</th>
              <th scope="col">Request kind</th>
              <SortHeader label="Principal" sortKey="principal" sort={sort} onSort={toggle} />
              <th scope="col">Resource</th>
              <th scope="col">Policy</th>
              <SortHeader label="Effect" sortKey="effect" sort={sort} onSort={toggle} />
            </tr>
          </thead>
          <tbody>
            {sorted.map((e) => <DecisionRow key={e.callId} e={e} selected={e.callId === selectedId} onSelect={() => onSelect(e.callId)} />)}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && (
        <EmptyState title="No decisions match these filters" action={<Button size="sm" onClick={onReset}>Reset filters</Button>}>
          Widen the time range or clear a filter. This does not mean no decisions were made.
        </EmptyState>
      )}
      <p className="border-t border-line px-5 py-3 text-2xs text-muted">{rows.length} of {ENTRIES.length} decisions</p>
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
    <pre tabIndex={0} aria-label="Decisions as JSON" className="well m-4 max-h-[480px] overflow-auto p-4 font-mono text-2xs leading-relaxed text-fg">
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
      <table className="data-table min-w-[680px]">
        <thead>
          <tr>
            {["Policy", "Version", "Resource kind", "Allowed", "Denied", "Last evaluated"].map((h) => (
              <th key={h} scope="col">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {stats.map((s) => (
            <tr key={s.policy + s.version} className="font-mono text-2xs">
              <td className="text-fg">{s.policy}</td>
              <td className="text-muted">{s.version}</td>
              <td className="text-muted">{s.kind}</td>
              <td className="tabnum text-fg">{s.allow}</td>
              <td className={`tabnum ${s.deny > 0 ? "text-crit" : "text-muted"}`}>{s.deny}</td>
              <td className="tabnum whitespace-nowrap text-muted">{s.last}</td>
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
  if (!m) return <span className="text-muted">{line}</span>;
  const [, indent, key, colon, value] = m;
  return (
    <>
      <span>{indent}</span><span className="text-accent-light">{key}</span><span className="text-muted">{colon}</span><span className="text-fg">{value}</span>
    </>
  );
}

function JsonBlock({ value }: { value: unknown }) {
  const lines = JSON.stringify(value, null, 2).split("\n");
  return (
    <pre className="well mt-3 overflow-x-auto p-3 font-mono text-2xs leading-5">
      {lines.map((line, i) => (
        <div key={i} className="flex gap-4">
          <span aria-hidden className="w-3 shrink-0 select-none text-right text-muted">{i + 1}</span>
          <code className="whitespace-pre"><JsonLine line={line} /></code>
        </div>
      ))}
    </pre>
  );
}

function Pair({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-2 py-1.5 text-2xs">
      <dt className="text-muted">{label}</dt>
      <dd className="min-w-0 break-words font-mono text-fg">{children}</dd>
    </div>
  );
}

function DrawerSection({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <section className="border-t border-line px-5 py-4">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center justify-between rounded text-left">
        <span className="flex items-center gap-2 text-sm font-semibold text-fg">{icon}{title}</span>
        <Chevron open={open} />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </section>
  );
}

const SECTION_ICON = "text-muted";

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
        <dl key={d.action} className="well mb-2 px-3 py-1">
          <Pair label="Action">{d.action}</Pair>
          <div className="grid grid-cols-[120px_1fr] items-center gap-2 py-1.5 text-2xs">
            <dt className="text-muted">Effect</dt>
            <dd><EffectBadge effect={d.effect} /></dd>
          </div>
          <Pair label="Policy">{d.policy}</Pair>
        </dl>
      ))}
    </DrawerSection>
  );
}

function EntryDrawer({ entry, onClose }: { entry: Entry; onClose: () => void }) {
  return (
    <Drawer title="Audit log entry" description={<span className="font-mono">{entry.timestamp}</span>} onClose={onClose}>
      <PrincipalSection p={entry.principal} />
      <ResourceSection r={entry.resource} />
      <DecisionsSection items={entry.decisions} />
      {entry.effect === "DENY" && (
        <section className="border-t border-line px-5 py-4">
          <p className="text-xs text-muted">Denied by {entry.policy} {entry.version}. Review the policy and related events before retrying.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <ButtonLink href="/access-policies" size="sm">View policies</ButtonLink>
            <ButtonLink href="/event-explorer" size="sm">Inspect events</ButtonLink>
          </div>
        </section>
      )}
    </Drawer>
  );
}

/* --------------------------------- page --------------------------------- */

const VIEW_HEADER: Record<AccessViewId, { title: string; subtitle: string }> = {
  decisions: { title: "Trust Decisions", subtitle: "Allow and deny outcomes evaluated by OPA and committed to the Trust Ledger. All times UTC." },
  policies:  { title: "Access Policies", subtitle: "OPA/Rego policies and how each evaluated across recent decisions." },
};

export default function AccessView({ view }: { view: AccessViewId }) {
  const [mode, setMode] = useState<ViewMode>("decision");
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const rows = useMemo(() => ENTRIES.filter((e) => matchesFilters(e, filters)), [filters]);
  const selected = ENTRIES.find((e) => e.callId === selectedId) ?? null;

  return (
    <div className="page">
      <PageHeader {...VIEW_HEADER[view]} badges={<SampleBadge />} />
      <ViewNav view={view} />

      {view === "decisions" ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <ViewToggle mode={mode} onChange={setMode} />
            <DecisionFilters filters={filters} onChange={setFilters} />
          </div>
          <div className="card overflow-hidden">
            {mode === "decision"
              ? <DecisionTable rows={rows} selectedId={selectedId} onSelect={setSelectedId} onReset={() => setFilters(INITIAL_FILTERS)} />
              : <JsonView rows={rows} />}
          </div>
        </>
      ) : (
        <Card flush className="overflow-hidden"><PolicyTable /></Card>
      )}

      {selected && <EntryDrawer entry={selected} onClose={() => setSelectedId(null)} />}
    </div>
  );
}
