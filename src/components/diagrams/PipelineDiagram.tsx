// "How a decision is made": the whole system as one animated flow, with live counts from the ledger,
// followed by a plain-language walk-through. Each stage links to the page that shows its data.
import Link from "next/link";
import { TONE_COLOR, type ChartTone } from "@/src/components/charts/charts";

export type FlowStats = { scored: number; reviewed: number; allow: number; review: number; block: number; height: number | null; attested: number };

type Stage = { id: string; title: string; lines: [string, string]; tone: ChartTone; href: string; count: string; countLabel: string };

const W = 116, GAP = 28, Y = 56, H = 84;
const x = (i: number) => 10 + i * (W + GAP);

export default function PipelineDiagram({ s }: { s: FlowStats }) {
  const stages: Stage[] = [
    { id: "pkg", title: "Package", lines: ["npm or PyPI", "downloaded, never run"], tone: "muted", href: "/pipeline-runs", count: String(s.scored), countLabel: "requested" },
    { id: "scorer", title: "Scorer", lines: ["CNN + rules read the", "code, give a risk score"], tone: "info", href: "/pipeline-runs", count: String(s.scored), countLabel: "scored" },
    { id: "llm", title: "LLM review", lines: ["second opinion on", "borderline packages"], tone: "accent", href: "/event-explorer", count: String(s.reviewed), countLabel: "reviewed" },
    { id: "policy", title: "Policy service", lines: ["score bands + OPA rules,", "signs the decision"], tone: "warn", href: "/trust-decisions", count: `${s.allow}·${s.review}·${s.block}`, countLabel: "allow·review·block" },
    { id: "gateway", title: "Gateway", lines: ["checks who is asking", "and every signature"], tone: "info", href: "/workload-identity", count: String(s.attested), countLabel: "runners attested" },
    { id: "ledger", title: "Fabric ledger", lines: ["2 of 3 orgs must agree", "then it is permanent"], tone: "ok", href: "/trust-ledger", count: s.height === null ? "–" : String(s.height), countLabel: "blocks" },
    { id: "gate", title: "Deploy gate", lines: ["only an ALLOW on the", "exact artifact ships"], tone: "crit", href: "/incidents", count: String(s.allow), countLabel: "may deploy" },
  ];

  return (
    <div>
      <div className="overflow-x-auto">
        <svg viewBox="0 0 1000 190" className="min-w-[900px] w-full" role="group" aria-label="Flow from package request to deploy gate">
          <defs>
            <marker id="arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0 0 L8 4 L0 8 z" fill="var(--text-secondary)" />
            </marker>
          </defs>
          {stages.slice(0, -1).map((_, i) => (
            <path key={i} d={`M${x(i) + W + 2} ${Y + H / 2} H${x(i + 1) - 4}`} fill="none" stroke="var(--accent)" strokeWidth="1.6"
              className="flow-dash" markerEnd="url(#arrow)" style={{ animationDelay: `${i * 120}ms`, opacity: 0.8 }} />
          ))}
          {stages.map((st, i) => {
            const c = TONE_COLOR[st.tone];
            return (
              <Link key={st.id} href={st.href} aria-label={`${st.title}: ${st.count} ${st.countLabel}`}>
                <g className="cursor-pointer">
                  <rect x={x(i)} y={Y} width={W} height={H} rx="14" fill="var(--surface)" fillOpacity="0.85" stroke={c} strokeOpacity="0.55"
                    style={{ filter: `drop-shadow(0 0 8px color-mix(in srgb, ${c} 35%, transparent))` }} />
                  <circle cx={x(i) + 16} cy={Y + 17} r="9" fill={c} fillOpacity="0.2" stroke={c} className={st.id === "policy" || st.id === "ledger" ? "node-pulse" : undefined} />
                  <text x={x(i) + 16} y={Y + 20.5} textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--text-primary)">{i + 1}</text>
                  <text x={x(i) + 32} y={Y + 21} fontSize="11.5" fontWeight="600" fill="var(--text-primary)">{st.title}</text>
                  <text x={x(i) + 10} y={Y + 46} fontSize="8.6" fill="var(--text-secondary)">{st.lines[0]}</text>
                  <text x={x(i) + 10} y={Y + 58} fontSize="8.6" fill="var(--text-secondary)">{st.lines[1]}</text>
                  {st.id === "ledger" && ["A", "U", "R"].map((o, k) => (
                    <g key={o}><circle cx={x(i) + 20 + k * 16} cy={Y + 74} r="5.5" fill={c} fillOpacity="0.25" stroke={c} /><text x={x(i) + 20 + k * 16} y={Y + 77} textAnchor="middle" fontSize="7" fill="var(--text-primary)">{o}</text></g>
                  ))}
                </g>
                <text x={x(i) + W / 2} y={Y + H + 32} textAnchor="middle" fontSize="19" fontWeight="600" fill={c} style={{ filter: `drop-shadow(0 0 6px color-mix(in srgb, ${c} 50%, transparent))` }}>{st.count}</text>
                <text x={x(i) + W / 2} y={Y + H + 46} textAnchor="middle" fontSize="8.5" fill="var(--text-secondary)">{st.countLabel}</text>
              </Link>
            );
          })}
        </svg>
      </div>
      <ol className="mt-3 grid gap-x-6 gap-y-2 text-xs leading-relaxed text-muted sm:grid-cols-2 xl:grid-cols-3">
        <li><b className="text-fg">1 · Ask.</b> CI or a person asks about a package. It is downloaded and read in memory, never installed or run.</li>
        <li><b className="text-fg">2 · Score.</b> A neural network and rule checks give a risk score from 0 to 1000 and list suspicious behaviour.</li>
        <li><b className="text-fg">3 · Review.</b> Borderline packages get an AI second opinion. It can only make a decision stricter.</li>
        <li><b className="text-fg">4 · Decide.</b> A separate policy service turns score and evidence into ALLOW, WARN, REVIEW or BLOCK, and signs it.</li>
        <li><b className="text-fg">5 · Verify.</b> The gateway checks the caller&apos;s identity and every signature before anything is recorded.</li>
        <li><b className="text-fg">6 · Record and gate.</b> Two of three organisations must agree before it is written to the ledger. Deploys are only allowed for artifacts the ledger says are safe.</li>
      </ol>
    </div>
  );
}
