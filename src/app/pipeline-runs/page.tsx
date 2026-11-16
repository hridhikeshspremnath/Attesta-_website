"use client";

// src/app/pipeline-runs/page.tsx
// Attesta — Pipeline Runs (run detail).
// Tailwind only; no new dependencies.

import PageHeader from "@/src/components/ui/PageHeader";
import { Badge, Card, SampleBadge, TONE_BG, TONE_TEXT, type Tone } from "@/src/components/ui/primitives";

/* ------------------------- design tokens ------------------------- */

type Status = "verified" | "flagged" | "review" | "waiting" | "skipped" | "clean" | "unscored";

const STATUS: Record<Status, { label: string; tone: Tone; color: string }> = {
  verified: { label: "Verified",   tone: "ok",      color: "var(--success)" },
  clean:    { label: "Clean",      tone: "ok",      color: "var(--success)" },
  flagged:  { label: "1 flagged",  tone: "warn",    color: "var(--warning)" },
  review:   { label: "Review",     tone: "warn",    color: "var(--warning)" },
  waiting:  { label: "Waiting",    tone: "neutral", color: "var(--text-secondary)" },
  skipped:  { label: "Skipped",    tone: "neutral", color: "var(--text-secondary)" },
  unscored: { label: "Not scored", tone: "neutral", color: "var(--text-secondary)" },
};

/* ----------------------------- data ----------------------------- */

const RUN = { id: 1842, repo: "org/repo", gate: "Trust gate: review" };

const TIMELINE: { step: string; duration: string; status: Status; start: number; width: number }[] = [
  { step: "Webhook received", duration: "0.1 s",  status: "verified", start: 0,  width: 3 },
  { step: "Dependency scan",  duration: "12 s",   status: "flagged",  start: 3,  width: 30 },
  { step: "Trust gate",       duration: "1.4 s",  status: "review",   start: 33, width: 8 },
  { step: "Build",            duration: "Pending", status: "waiting", start: 0,  width: 0 },
  { step: "Publish",          duration: "–",       status: "skipped", start: 0,  width: 0 },
];

const RISK_META = { model: "v1.4.2", scoredAt: "14:08:52" };

const RISK: { pkg: string; registry: string; status: Status; verdict: string; evidence: string }[] = [
  {
    pkg: "[package-a]@[ver]", registry: "npm", status: "flagged", verdict: "Suspicious · [score]",
    evidence: "Name close to [popular-pkg] · new install script · recent publish",
  },
  { pkg: "[package-b]@[ver]", registry: "PyPI", status: "clean", verdict: "Clean", evidence: "No flagged signals" },
  {
    pkg: "[package-c]@[ver]", registry: "npm", status: "unscored", verdict: "Not scored",
    evidence: "Model unavailable for this package",
  },
];

type GraphNode = { id: string; label: string; col: number; row: number; status: Status; meta: string };

const GRAPH_NODES: GraphNode[] = [
  { id: "webhook",  label: "webhook-receive",  col: 0, row: 1, status: "verified", meta: "0.1s" },
  { id: "deps",     label: "dependency-scan",  col: 1, row: 0, status: "flagged",  meta: "12s" },
  { id: "secrets",  label: "secret-scan",      col: 1, row: 1, status: "verified", meta: "8s" },
  { id: "license",  label: "license-check",    col: 1, row: 2, status: "verified", meta: "4s" },
  { id: "gate",     label: "trust-gate",       col: 2, row: 1, status: "review",   meta: "1.4s" },
  { id: "build",    label: "build",            col: 3, row: 0, status: "waiting",  meta: "–" },
  { id: "sign",     label: "sign-artifact",    col: 3, row: 2, status: "waiting",  meta: "–" },
  { id: "publish",  label: "publish",          col: 4, row: 1, status: "skipped",  meta: "–" },
];

const GRAPH_EDGES: [string, string][] = [
  ["webhook", "deps"], ["webhook", "secrets"], ["webhook", "license"],
  ["deps", "gate"], ["secrets", "gate"], ["license", "gate"],
  ["gate", "build"], ["gate", "sign"], ["build", "publish"], ["sign", "publish"],
];

const SUMMARY = [
  { label: "Triggered via push", value: "org/repo · main" },
  { label: "Status",             value: "Review" },
  { label: "Total duration",     value: "13.5 s" },
  { label: "Artifacts",          value: "0" },
];

/* --------------------------- primitives --------------------------- */

function StatusBadge({ status }: { status: Status }) {
  const s = STATUS[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

// Passed, attention and not-yet-run states stay distinct without relying on colour.
function StatusGlyph({ status, size = 14 }: { status: Status; size?: number }) {
  const s = STATUS[status];
  const passed = s.tone === "ok";
  const attention = s.tone === "warn";
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={`shrink-0 ${TONE_TEXT[s.tone]}`}>
      <circle cx="8" cy="8" r="6.5" strokeDasharray={passed || attention ? undefined : "2 2.4"} />
      {passed && <path d="M5 8.3l2.1 2.1 3.9-4.3" />}
      {attention && <path d="M8 4.8v3.6M8 11h.01" />}
    </svg>
  );
}

/* ------------------------- execution timeline ------------------------- */

function TimelineRow({ row }: { row: (typeof TIMELINE)[number] }) {
  const s = STATUS[row.status];
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 border-t border-line py-3 text-xs first:border-t-0 sm:grid-cols-[160px_64px_minmax(0,1fr)_96px]">
      <span className="flex min-w-0 items-center gap-2 font-medium text-fg">
        <StatusGlyph status={row.status} />
        <span className="truncate">{row.step}</span>
      </span>
      <span className="tabnum hidden font-mono text-2xs text-muted sm:block">{row.duration}</span>
      <div className="relative col-span-2 row-start-2 h-1.5 rounded-full bg-raised/60 sm:col-span-1 sm:row-start-auto" role="img" aria-label={`${row.step}: ${s.label}`}>
        {row.width > 0 && (
          <div
            className={`absolute top-0 h-full rounded-full ${TONE_BG[s.tone]}`}
            style={{ left: `${row.start}%`, width: `${row.width}%` }}
          />
        )}
      </div>
      <span className="justify-self-end sm:justify-self-start"><StatusBadge status={row.status} /></span>
    </li>
  );
}

function ExecutionTimeline() {
  return (
    <Card title="Execution timeline">
      <ol>
        {TIMELINE.map((r) => <TimelineRow key={r.step} row={r} />)}
      </ol>
    </Card>
  );
}

/* --------------------------- dependency risk --------------------------- */

function RiskRow({ r }: { r: (typeof RISK)[number] }) {
  return (
    <tr>
      <td className="whitespace-nowrap font-mono text-fg">{r.pkg}</td>
      <td className="font-mono text-muted">{r.registry}</td>
      <td className={`whitespace-nowrap font-medium ${TONE_TEXT[STATUS[r.status].tone]}`}>{r.verdict}</td>
      <td className={r.status === "unscored" ? "text-muted" : "text-fg"}>{r.evidence}</td>
    </tr>
  );
}

function DependencyRisk() {
  return (
    <Card
      flush
      title="Dependency risk · ML model"
      aside={<span className="font-mono text-2xs text-muted">model [{RISK_META.model}] · scored {RISK_META.scoredAt}</span>}
    >
      <div className="overflow-x-auto">
        <table className="data-table min-w-[680px]">
          <thead>
            <tr>
              {["Package", "Registry", "Verdict", "Evidence"].map((h) => <th key={h} scope="col">{h}</th>)}
            </tr>
          </thead>
          <tbody>{RISK.map((r) => <RiskRow key={r.pkg} r={r} />)}</tbody>
        </table>
      </div>
      <p className="border-t border-line px-5 py-3 text-xs leading-relaxed text-muted">
        A score with evidence, not a confirmed verdict. Flagged packages feed the trust gate as one piece of evidence and can open an incident.
      </p>
    </Card>
  );
}

/* ----------------------------- pipeline graph ----------------------------- */

const NODE_W = 180, NODE_H = 36, COL_GAP = 48, ROW_GAP = 16, PAD = 16;

function nodePos(n: GraphNode) {
  return { x: PAD + n.col * (NODE_W + COL_GAP), y: PAD + n.row * (NODE_H + ROW_GAP) };
}

function GraphEdge({ from, to }: { from: GraphNode; to: GraphNode }) {
  const a = nodePos(from), b = nodePos(to);
  const x1 = a.x + NODE_W, y1 = a.y + NODE_H / 2, x2 = b.x, y2 = b.y + NODE_H / 2;
  const mid = x1 + COL_GAP / 2;
  return <path d={`M${x1} ${y1} H${mid} V${y2} H${x2}`} fill="none" stroke="var(--border)" strokeWidth="1.5" />;
}

function GraphNodeBox({ n }: { n: GraphNode }) {
  const { x, y } = nodePos(n);
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={NODE_W} height={NODE_H} rx="8" fill="var(--surface)" stroke="var(--border)" />
      <circle cx="16" cy={NODE_H / 2} r="4" fill={STATUS[n.status].color} />
      <text x="28" y={NODE_H / 2 + 4} fontSize="12" fill="var(--text-primary)">{n.label}</text>
      <text x={NODE_W - 10} y={NODE_H / 2 + 4} fontSize="12" textAnchor="end" fill="var(--text-secondary)" fontFamily="var(--font-geist-mono), monospace">{n.meta}</text>
    </g>
  );
}

function JobList() {
  return (
    <aside className="p-4">
      <h3 className="px-1.5 text-2xs font-medium text-muted">Jobs</h3>
      <ul aria-label="Jobs" className="mt-2 space-y-0.5">
        {GRAPH_NODES.map((n) => (
          <li key={n.id} className="flex items-center gap-2 rounded-lg px-1.5 py-1.5 text-xs text-fg">
            <StatusGlyph status={n.status} />
            <span className="min-w-0 flex-1 truncate">{n.label}</span>
            <span className="sr-only">{STATUS[n.status].label}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function SummaryStrip() {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
      {SUMMARY.map((s) => (
        <div key={s.label} className="min-w-0">
          <dt className="text-2xs text-muted">{s.label}</dt>
          <dd className="mt-0.5 truncate text-xs font-medium text-fg">{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function WorkflowGraph() {
  const byId = Object.fromEntries(GRAPH_NODES.map((n) => [n.id, n]));
  const cols = Math.max(...GRAPH_NODES.map((n) => n.col)) + 1;
  const rows = Math.max(...GRAPH_NODES.map((n) => n.row)) + 1;
  const w = PAD * 2 + cols * NODE_W + (cols - 1) * COL_GAP;
  const h = PAD * 2 + rows * NODE_H + (rows - 1) * ROW_GAP;
  return (
    <div className="well min-w-0">
      <div className="px-4 pb-1 pt-3">
        <p className="font-mono text-xs text-fg">attesta-ci.yml</p>
        <p className="text-2xs text-muted">on push</p>
      </div>
      <div className="overflow-x-auto">
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Pipeline job dependency graph" className="block">
          {GRAPH_EDGES.map(([f, t]) => <GraphEdge key={f + t} from={byId[f]} to={byId[t]} />)}
          {GRAPH_NODES.map((n) => <GraphNodeBox key={n.id} n={n} />)}
        </svg>
      </div>
    </div>
  );
}

function PipelineGraph() {
  return (
    <Card flush title="Workflow jobs" className="overflow-hidden">
      <div className="grid border-t border-line lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="border-b border-line lg:border-b-0 lg:border-r">
          <JobList />
        </div>
        <div className="min-w-0 space-y-4 p-4">
          <SummaryStrip />
          <WorkflowGraph />
        </div>
      </div>
    </Card>
  );
}

/* --------------------------------- page --------------------------------- */

export default function PipelineRunsPage() {
  return (
    <div className="page">
      <PageHeader
        title={<>Run #{RUN.id} <span className="font-mono text-lg font-normal text-muted">[{RUN.repo}]</span></>}
        subtitle="Stage timeline, dependency risk and job graph for this GitHub Actions run"
        badges={
          <>
            <SampleBadge />
            <Badge tone="warn">{RUN.gate}</Badge>
          </>
        }
      />
      <ExecutionTimeline />
      <DependencyRisk />
      <PipelineGraph />
    </div>
  );
}
