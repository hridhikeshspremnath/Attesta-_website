// src/app/doc/page.tsx — how the system works, in plain language. Static reference: it describes the design, not live data.
import Link from "next/link";
import PageHeader from "@/src/components/ui/PageHeader";
import { Badge, Card, type Tone } from "@/src/components/ui/primitives";

const STEPS: [string, string][] = [
  ["Ask", "CI or a person asks about a package. It is downloaded and read in memory, never installed or run."],
  ["Score", "A neural network and rule checks give a risk score from 0 to 1000 and list suspicious behaviour."],
  ["Review", "Borderline packages get an AI second opinion. It can only make a decision stricter."],
  ["Decide", "A separate policy service turns score and evidence into a decision and signs it."],
  ["Verify", "The gateway checks the caller's identity (SPIFFE) and every signature before anything is recorded."],
  ["Record", "Two of three organisations must agree before the decision is written to the Hyperledger Fabric ledger."],
  ["Gate", "A deploy is allowed only if the ledger holds an ALLOW for that exact artifact."],
];

const DECISIONS: { label: string; tone: Tone; desc: string }[] = [
  { label: "ALLOW", tone: "ok", desc: "Low risk, runner attested. May deploy." },
  { label: "WARN", tone: "warn", desc: "Medium risk. Deploys only if the team chooses to allow warnings." },
  { label: "REVIEW", tone: "warn", desc: "High risk, or the runner was not attested. A person (the auditor) must decide." },
  { label: "BLOCK", tone: "crit", desc: "Critical risk or a dangerous combination of behaviours. Refused." },
];

const GLOSSARY: [string, string, string?][] = [
  ["Risk score", "0 (safe) to 1000 (dangerous), from the detector. Evidence, not a verdict.", "/trust-decisions"],
  ["SPIFFE ID", "The identity of a workload, such as the scoring service. Proved with a short-lived certificate (SVID).", "/workload-identity"],
  ["Attestation", "Proof of which CI job is asking (a GitHub token). Without it a decision cannot be ALLOW.", "/pipeline-runs"],
  ["Policy bundle", "The score bands plus the Rego rules. Its hash is pinned on the ledger.", "/access-policies"],
  ["Endorsement", "A Fabric organisation checking and signing a transaction. Two of three are required.", "/trust-ledger"],
  ["Override", "The auditor changing a decision, with a reason. Append-only: the original stays on record.", "/incidents"],
  ["Provenance", "What the signed record says about an artifact: digest, evidence, attestation, signer.", "/provenance"],
];

export default function DocPage() {
  return (
    <div className="page">
      <PageHeader title="Documentation" subtitle="How a package becomes a deploy decision" />
      <Card title="How a decision is made">
        <ol className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {STEPS.map(([name, text], i) => (
            <li key={name} className="flex gap-3 text-xs leading-relaxed text-muted">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-line text-2xs font-medium text-fg">{i + 1}</span>
              <span><b className="text-fg">{name}.</b> {text}</span>
            </li>
          ))}
        </ol>
      </Card>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Card title="What the decisions mean">
          <dl className="divide-y divide-line">
            {DECISIONS.map((d) => (
              <div key={d.label} className="flex items-start gap-3 py-2.5 text-xs">
                <dt className="w-16 shrink-0"><Badge tone={d.tone}>{d.label}</Badge></dt>
                <dd className="text-muted">{d.desc}</dd>
              </div>
            ))}
          </dl>
        </Card>
        <Card title="Terms">
          <dl className="divide-y divide-line">
            {GLOSSARY.map(([term, meaning, href]) => (
              <div key={term} className="py-2.5 text-xs">
                <dt className="font-medium text-fg">{href ? <Link href={href} className="link">{term}</Link> : term}</dt>
                <dd className="mt-0.5 text-muted">{meaning}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </div>
  );
}
