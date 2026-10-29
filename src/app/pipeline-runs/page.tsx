// src/app/pipeline-runs/page.tsx
// Attesta — Pipeline Runs (run detail), matched to the reference image.
// Black canvas, navy panel + cards, dense small type, outlined amber chips.
// Tailwind only; no new dependencies.

import type { ReactNode } from "react";

/* ------------------------- design tokens ------------------------- */

type Status = "verified" | "flagged" | "review" | "waiting" | "skipped" | "clean" | "unscored";

const STATUS: Record<Status, { label: string; text: string; bar: string; hex: string }> = {
  verified: { label: "Verified", text: "text-emerald-400", bar: "bg-cyan-300", hex: "#34d399" },
  clean: { label: "Clean", text: "text-emerald-400", bar: "bg-emerald-400", hex: "#34d399" },
  flagged: { label: "1 flagged", text: "text-amber-400", bar: "bg-amber-400", hex: "#fbbf24" },
  review: { label: "Review", text: "text-amber-400", bar: "bg-amber-400", hex: "#fbbf24" },
  waiting: { label: "Waiting", text: "text-slate-400", bar: "bg-slate-600", hex: "#64748b" },
  skipped: { label: "Skipped", text: "text-slate-400", bar: "bg-slate-600", hex: "#64748b" },
  unscored: { label: "Not scored", text: "text-slate-400", bar: "bg-slate-600", hex: "#64748b" },
};

const MUTED = "text-slate-400";
const DIVIDER = "border-white/[0.06]";

/* ----------------------------- data ----------------------------- */

const RUN = { id: 1842, repo: "org/repo", gate: "Trust gate: review" };

const TIMELINE: { step: string; duration: string; status: Status; start: number; width: number }[] = [
  { step: "Webhook received", duration: "0.1 s", status: "verified", start: 0, width: 3 },
  { step: "Dependency scan", duration: "12 s", status: "flagged", start: 3, width: 30 },
  { step: "Trust gate", duration: "1.4 s", status: "review", start: 33, width: 8 },
  { step: "Build", duration: "Pending", status: "waiting", start: 0, width: 0 },
  { step: "Publish", duration: "–", status: "skipped", start: 0, width: 0 },
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
  { id: "webhook", label: "webhook-receive", col: 0, row: 1, status: "verified", meta: "0.1s" },
  { id: "deps", label: "dependency-scan", col: 1, row: 0, status: "flagged", meta: "12s" },
  { id: "secrets", label: "secret-scan", col: 1, row: 1, status: "verified", meta: "8s" },
  { id: "license", label: "license-check", col: 1, row: 2, status: "verified", meta: "4s" },
  { id: "gate", label: "trust-gate", col: 2, row: 1, status: "review", meta: "1.4s" },
  { id: "build", label: "build", col: 3, row: 0, status: "waiting", meta: "–" },
  { id: "sign", label: "sign-artifact", col: 3, row: 2, status: "waiting", meta: "–" },
  { id: "publish", label: "publish", col: 4, row: 1, status: "skipped", meta: "–" },
];

const GRAPH_EDGES: [string, string][] = [
  ["webhook", "deps"], ["webhook", "secrets"], ["webhook", "license"],
  ["deps", "gate"], ["secrets", "gate"], ["license", "gate"],
  ["gate", "build"], ["gate", "sign"], ["build", "publish"], ["sign", "publish"],
];

const SUMMARY = [
  { label: "Triggered via push", value: "org/repo · main" },
  { label: "Status", value: "Review" },
  { label: "Total duration", value: "13.5 s" },
  { label: "Artifacts", value: "0" },
];

/* --------------------------- primitives --------------------------- */

function Card({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-white/5 bg-[#0e1a30]">
      <div className="flex items-center justify-between gap-3 px-4 pt-3.5 pb-2">
        <h2 className="text-xs font-semibold text-white">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function OutlineChip({ children, strong = false }: { children: ReactNode; strong?: boolean }) {
  return (
    <span
      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium text-amber-300 ${
        strong ? "border-amber-400" : "border-amber-400/60"
      }`}
    >
      {children}
    </span>
  );
}

function IconButton({ label, children }: { label: string; children: ReactNode }) {
  return (
    <button
      aria-label={label}
      className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/5 text-zinc-300 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 motion-reduce:transition-none"
    >
      {children}
    </button>
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
        <button className="flex h-8 items-center gap-2 rounded-lg bg-zinc-100 px-3 text-xs font-medium text-zinc-900 transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 motion-reduce:transition-none">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16" /></svg>
          Export
        </button>
      </div>
    </header>
  );
}

function RunTitle() {
  return (
    <div>
      <nav aria-label="Breadcrumb" className="text-[10px] text-slate-400">
        <a href="/pipeline-runs" className="hover:text-slate-200">Pipeline Runs</a>
        <span aria-hidden> / </span>
        <span aria-current="page">#{RUN.id}</span>
      </nav>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold tracking-tight text-white">
          Run #{RUN.id} · <span className="font-mono">[{RUN.repo}]</span>
        </h1>
        <div className="flex gap-2">
          <OutlineChip>{RUN.gate}</OutlineChip>
          <OutlineChip strong>Sample data</OutlineChip>
        </div>
      </div>
    </div>
  );
}

/* ------------------------- execution timeline ------------------------- */

function TimelineRow({ row }: { row: (typeof TIMELINE)[number] }) {
  const s = STATUS[row.status];
  return (
    <li className={`grid grid-cols-[104px_1fr_64px] items-center gap-3 border-t py-2.5 text-xs sm:grid-cols-[130px_60px_1fr_72px] ${DIVIDER}`}>
      <span className="font-medium text-white">{row.step}</span>
      <span className={`hidden font-mono text-[11px] sm:block ${MUTED}`}>{row.duration}</span>
      <div className="relative h-1 rounded-full bg-[#1a2a45]" role="img" aria-label={`${row.step}: ${s.label}`}>
        {row.width > 0 && (
          <div
            className={`absolute top-0 h-full rounded-full ${row.status === "verified" ? "bg-cyan-300" : s.bar}`}
            style={{ left: `${row.start}%`, width: `${row.width}%` }}
          />
        )}
      </div>
      <span className={`text-right font-medium ${s.text}`}>{s.label}</span>
    </li>
  );
}

function ExecutionTimeline() {
  return (
    <Card title="Execution timeline">
      <ol className="px-4 pb-1">
        {TIMELINE.map((r) => <TimelineRow key={r.step} row={r} />)}
      </ol>
    </Card>
  );
}

/* --------------------------- dependency risk --------------------------- */

function RiskRow({ r }: { r: (typeof RISK)[number] }) {
  return (
    <tr className={`border-t align-top ${DIVIDER}`}>
      <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px] font-bold text-white">{r.pkg}</td>
      <td className="px-3 py-3 font-mono text-[11px] font-bold text-white">{r.registry}</td>
      <td className={`px-3 py-3 text-xs font-medium ${STATUS[r.status].text}`}>{r.verdict}</td>
      <td className={`px-3 py-3 pr-4 text-xs ${r.status === "unscored" ? MUTED : "text-slate-200"}`}>{r.evidence}</td>
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
            <tr className={`text-xs ${MUTED}`}>
              <th scope="col" className="px-4 py-2 font-normal">Package</th>
              <th scope="col" className="px-3 py-2 font-normal">Registry</th>
              <th scope="col" className="px-3 py-2 font-normal">Verdict</th>
              <th scope="col" className="px-3 py-2 font-normal">Evidence</th>
            </tr>
          </thead>
          <tbody>{RISK.map((r) => <RiskRow key={r.pkg} r={r} />)}</tbody>
        </table>
      </div>
      <p className={`border-t px-4 py-3 text-[11px] ${DIVIDER} ${MUTED}`}>
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
  return <path d={`M${x1} ${y1} H${mid} V${y2} H${x2}`} fill="none" stroke="#30363d" strokeWidth="1.5" />;
}

function GraphNodeBox({ n }: { n: GraphNode }) {
  const { x, y } = nodePos(n);
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={NODE_W} height={NODE_H} rx="6" fill="#0d1117" stroke="#30363d" />
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
    <aside className="p-3 text-[11px]">
      <div className="rounded-md border-l-2 border-sky-400 bg-white/[0.07] px-3 py-1.5 font-medium text-white">Summary</div>
      <div className="mt-4 flex items-center justify-between px-1 text-slate-400">
        <span>All jobs</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M3 5h18l-7 8v6l-4-2v-4L3 5z" /></svg>
      </div>
      <ul aria-label="Jobs" className="mt-2 space-y-0.5">
        {GRAPH_NODES.map((n) => (
          <li key={n.id} className="flex items-center gap-2 rounded px-1.5 py-1.5 text-slate-200 hover:bg-white/5">
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
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-white/10 bg-white/10 sm:grid-cols-4">
      {SUMMARY.map((s) => (
        <div key={s.label} className="bg-black px-3 py-2.5">
          <dt className="text-[10px] text-slate-400">{s.label}</dt>
          <dd className="mt-0.5 text-[11px] font-medium text-white">{s.value}</dd>
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
    <div className="rounded-md border border-white/10">
      <div className="px-3 pt-3">
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
    <section className="overflow-hidden rounded-lg border border-white/10 bg-black">
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-4 py-2.5 text-[11px] text-slate-400">
        <a href="/pipeline-runs" className="hover:text-slate-200">← Pipeline Runs</a>
      </div>
      <div className="flex items-center gap-2 px-4 py-3 text-xs text-white">
        <CheckIcon color={STATUS.review.hex} />
        <span className="font-semibold">Run #{RUN.id}</span>
        <span className={MUTED}>· dependency review</span>
      </div>
      <div className="grid border-t border-white/10 lg:grid-cols-[210px_1fr]">
        <div className="border-b border-white/10 lg:border-b-0 lg:border-r"><JobSidebar /></div>
        <div className="min-w-0 space-y-3 p-3"><SummaryStrip /><WorkflowGraph /></div>
      </div>
    </section>
  );
}

/* --------------------------------- page --------------------------------- */

export default function PipelineRunsPage() {
  return (
    <div className="min-h-screen bg-black p-4 sm:p-6" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", system-ui, sans-serif' }}>
      <div className="mx-auto max-w-[1200px] space-y-4">
        <TopBar />
        <div className="space-y-4 rounded-xl bg-[#0b1426] p-4 sm:p-6">
          <RunTitle />
          <ExecutionTimeline />
          <DependencyRisk />
        </div>
        <PipelineGraph />
      </div>
    </div>
  );
}