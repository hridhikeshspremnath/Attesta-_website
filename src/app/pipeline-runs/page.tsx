"use client";

// src/app/pipeline-runs/page.tsx
// Attesta — Pipeline Runs (run detail).
// Dark fintech SaaS design. Tailwind only; no new dependencies.

import type { ReactNode } from "react";
import Link from "next/link";

/* ------------------------- design tokens ------------------------- */

type Status = "verified" | "flagged" | "review" | "waiting" | "skipped" | "clean" | "unscored";

const STATUS: Record<Status, { label: string; text: string; bar: string; hex: string; bg: string }> = {
  verified: { label: "Verified",   text: "text-emerald-400", bar: "bg-emerald-400", hex: "#34d399", bg: "bg-emerald-400/10" },
  clean:    { label: "Clean",      text: "text-emerald-400", bar: "bg-emerald-400", hex: "#34d399", bg: "bg-emerald-400/10" },
  flagged:  { label: "1 flagged",  text: "text-amber-400",   bar: "bg-amber-400",   hex: "#fbbf24", bg: "bg-amber-400/10" },
  review:   { label: "Review",     text: "text-amber-400",   bar: "bg-amber-400",   hex: "#fbbf24", bg: "bg-amber-400/10" },
  waiting:  { label: "Waiting",    text: "text-slate-400",   bar: "bg-slate-600",   hex: "#64748b", bg: "bg-slate-600/10" },
  skipped:  { label: "Skipped",    text: "text-slate-400",   bar: "bg-slate-600",   hex: "#64748b", bg: "bg-slate-600/10" },
  unscored: { label: "Not scored", text: "text-slate-400",   bar: "bg-slate-600",   hex: "#64748b", bg: "bg-slate-600/10" },
};

const MUTED    = "text-slate-400";
const DIVIDER  = "border-white/[0.06]";

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

function Card({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-white/[0.07] bg-[#0D1117]">
      <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const s = STATUS[status];
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${s.text} ${s.bg} border-current/20`}>
      {s.label}
    </span>
  );
}

function CheckIcon({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden>
      <circle cx="8" cy="8" r="7" fill={color} />
      <path d="M4.6 8.2l2.3 2.3 4.5-4.8" fill="none" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ----------------------------- page title ----------------------------- */

function RunTitle() {
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold tracking-tight text-white">
          Run #{RUN.id} · <span className="font-mono text-[#9CA3AF]">[{RUN.repo}]</span>
        </h1>
        <div className="flex gap-2 flex-wrap">
          <span className="rounded-full border border-amber-400/60 px-2.5 py-0.5 text-[10px] font-medium text-amber-300">
            {RUN.gate}
          </span>
          <span className="rounded-full border border-amber-400 px-2.5 py-0.5 text-[10px] font-medium text-amber-300">
            Sample data
          </span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------- execution timeline ------------------------- */

function TimelineRow({ row }: { row: (typeof TIMELINE)[number] }) {
  const s = STATUS[row.status];
  return (
    <li className={`grid grid-cols-[120px_1fr_80px] items-center gap-3 border-t py-3 text-xs sm:grid-cols-[140px_60px_1fr_80px] ${DIVIDER}`}>
      <span className="font-medium text-white">{row.step}</span>
      <span className={`hidden font-mono text-[11px] sm:block ${MUTED}`}>{row.duration}</span>
      <div className="relative h-1.5 rounded-full bg-white/[0.06]" role="img" aria-label={`${row.step}: ${s.label}`}>
        {row.width > 0 && (
          <div
            className={`absolute top-0 h-full rounded-full ${row.status === "verified" ? "bg-emerald-400" : s.bar}`}
            style={{ left: `${row.start}%`, width: `${row.width}%` }}
          />
        )}
      </div>
      <StatusBadge status={row.status} />
    </li>
  );
}

function ExecutionTimeline() {
  return (
    <Card title="Execution timeline">
      <ol className="px-5 pb-2">
        {TIMELINE.map((r) => <TimelineRow key={r.step} row={r} />)}
      </ol>
    </Card>
  );
}

/* --------------------------- dependency risk --------------------------- */

function RiskRow({ r }: { r: (typeof RISK)[number] }) {
  return (
    <tr className={`border-t align-top ${DIVIDER}`}>
      <td className="whitespace-nowrap px-5 py-3 font-mono text-[11px] font-bold text-white">{r.pkg}</td>
      <td className="px-3 py-3 font-mono text-[11px] font-bold text-white">{r.registry}</td>
      <td className={`px-3 py-3 text-xs font-medium ${STATUS[r.status].text}`}>{r.verdict}</td>
      <td className={`px-3 py-3 pr-5 text-xs ${r.status === "unscored" ? MUTED : "text-slate-200"}`}>{r.evidence}</td>
    </tr>
  );
}

function DependencyRisk() {
  return (
    <Card
      title="Dependency risk · ML model"
      aside={<span className={`font-mono text-[10px] ${MUTED}`}>model [{RISK_META.model}] · scored {RISK_META.scoredAt}</span>}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left">
          <thead>
            <tr className={`text-xs ${MUTED} border-t ${DIVIDER}`}>
              <th scope="col" className="px-5 py-2.5 font-normal">Package</th>
              <th scope="col" className="px-3 py-2.5 font-normal">Registry</th>
              <th scope="col" className="px-3 py-2.5 font-normal">Verdict</th>
              <th scope="col" className="px-3 py-2.5 pr-5 font-normal">Evidence</th>
            </tr>
          </thead>
          <tbody>{RISK.map((r) => <RiskRow key={r.pkg} r={r} />)}</tbody>
        </table>
      </div>
      <p className={`border-t px-5 py-3 text-[11px] leading-relaxed ${DIVIDER} ${MUTED}`}>
        A score with evidence, not a confirmed verdict. Flagged packages feed the trust gate as one piece of evidence and can open an incident.
      </p>
    </Card>
  );
}

/* ----------------------------- pipeline graph ----------------------------- */

const NODE_W = 156, NODE_H = 36, COL_GAP = 48, ROW_GAP = 16, PAD = 16;

function nodePos(n: GraphNode) {
  return { x: PAD + n.col * (NODE_W + COL_GAP), y: PAD + n.row * (NODE_H + ROW_GAP) };
}

function GraphEdge({ from, to }: { from: GraphNode; to: GraphNode }) {
  const a = nodePos(from), b = nodePos(to);
  const x1 = a.x + NODE_W, y1 = a.y + NODE_H / 2, x2 = b.x, y2 = b.y + NODE_H / 2;
  const mid = x1 + COL_GAP / 2;
  return <path d={`M${x1} ${y1} H${mid} V${y2} H${x2}`} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />;
}

function GraphNodeBox({ n }: { n: GraphNode }) {
  const { x, y } = nodePos(n);
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={NODE_W} height={NODE_H} rx="6" fill="#0D1117" stroke="rgba(255,255,255,0.1)" />
      <g transform={`translate(10 ${NODE_H / 2 - 7})`}>
        <circle cx="7" cy="7" r="6" fill={STATUS[n.status].hex} />
      </g>
      <text x="30" y={NODE_H / 2 + 4} fontSize="11" fill="#e6edf3">{n.label}</text>
      <text x={NODE_W - 10} y={NODE_H / 2 + 4} fontSize="9" textAnchor="end" fill="#7d8590" fontFamily="ui-monospace, monospace">{n.meta}</text>
    </g>
  );
}

function JobSidebar() {
  return (
    <aside className="p-4 text-[11px]">
      <div className="rounded-md border-l-2 border-emerald-400/60 bg-white/[0.04] px-3 py-1.5 font-semibold text-white">Summary</div>
      <div className={`mt-4 flex items-center justify-between px-1 ${MUTED}`}>
        <span>All jobs</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M3 5h18l-7 8v6l-4-2v-4L3 5z" />
        </svg>
      </div>
      <ul aria-label="Jobs" className="mt-2 space-y-0.5">
        {GRAPH_NODES.map((n) => (
          <li key={n.id} className="flex items-center gap-2 rounded-lg px-1.5 py-1.5 text-slate-200 hover:bg-white/[0.04] cursor-default">
            <CheckIcon color={STATUS[n.status].hex} size={12} />
            <span className="truncate">{n.label}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function SummaryStrip() {
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-white/[0.07] bg-white/[0.07] sm:grid-cols-4">
      {SUMMARY.map((s) => (
        <div key={s.label} className="bg-[#0D1117] px-3 py-2.5">
          <dt className="text-[10px] text-slate-400">{s.label}</dt>
          <dd className="mt-0.5 text-[11px] font-semibold text-white">{s.value}</dd>
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
    <div className="rounded-lg border border-white/[0.07] bg-[#080C14]">
      <div className="px-4 pt-3 pb-2">
        <p className="text-[11px] font-semibold text-white">attesta-ci.yml</p>
        <p className="text-[10px] text-slate-400">on push</p>
      </div>
      <div className="overflow-x-auto">
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Pipeline job dependency graph" className="block min-w-full">
          {GRAPH_EDGES.map(([f, t]) => <GraphEdge key={f + t} from={byId[f]} to={byId[t]} />)}
          {GRAPH_NODES.map((n) => <GraphNodeBox key={n.id} n={n} />)}
        </svg>
      </div>
    </div>
  );
}

function PipelineGraph() {
  return (
    <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0D1117]">
      <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.07] px-5 py-3 text-[11px] text-slate-400">
        <Link href="/pipeline-runs" className="hover:text-slate-200 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500">
          ← Pipeline Runs
        </Link>
      </div>
      <div className="flex items-center gap-2.5 px-5 py-3 text-xs text-white">
        <CheckIcon color={STATUS.review.hex} />
        <span className="font-semibold">Run #{RUN.id}</span>
        <span className={MUTED}>· dependency review</span>
      </div>
      <div className="grid border-t border-white/[0.07] lg:grid-cols-[220px_1fr]">
        <div className="border-b border-white/[0.07] lg:border-b-0 lg:border-r">
          <JobSidebar />
        </div>
        <div className="min-w-0 space-y-3 p-4">
          <SummaryStrip />
          <WorkflowGraph />
        </div>
      </div>
    </section>
  );
}

/* --------------------------------- page --------------------------------- */

export default function PipelineRunsPage() {
  return (
    <div className="space-y-4 p-4 sm:p-6">
      <RunTitle />
      <ExecutionTimeline />
      <DependencyRisk />
      <PipelineGraph />
    </div>
  );
}
