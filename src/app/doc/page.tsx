"use client";

// src/app/doc/page.tsx
// Attesta — Documentation & Architecture reference.
// Dark fintech SaaS design. Tailwind only; no new dependencies.

import { useState, type ReactNode } from "react";
import Link from "next/link";

/* ------------------------- tokens + types ------------------------- */

type Tone = "green" | "amber" | "red" | "muted";

const TONE_TEXT: Record<Tone, string> = {
  green: "text-emerald-400",
  amber: "text-amber-400",
  red:   "text-red-400",
  muted: "text-slate-400",
};

const FOCUS   = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500";

const SECTIONS = [
  "Getting started",
  "Architecture",
  "Reading statuses",
  "Glossary",
  "Trust gate vs authorization",
  "Verification",
  "API and integrations",
] as const;
type Section = (typeof SECTIONS)[number];

/* ----------------------------- data ----------------------------- */

const GLOSSARY: { term: string; meaning: string; link?: string }[] = [
  { term: "SPIFFE ID", meaning: "Standardized URI identifying a workload (e.g. spiffe://attesta.dev/ns/ci/sa/build-runner)", link: "/workload-identity" },
  { term: "SVID", meaning: "Cryptographically verifiable short-lived X.509 certificate carrying the SPIFFE ID identity", link: "/workload-identity" },
  { term: "Trust gate", meaning: "Pre-execution check evaluating reputation, model flags, and runner provenance before issuing SVID", link: "/pipeline-runs" },
  { term: "Authorization", meaning: "OPA-driven granular policy enforcement governing what an attested workload can access", link: "/access-policies" },
  { term: "Provenance", meaning: "Immutable SLSA-compliant cryptographic record of sources, dependencies, and environment inputs", link: "/provenance" },
  { term: "Trust Ledger", meaning: "Hyperledger Fabric distributed consortium ledger recording signed security attestations", link: "/trust-ledger" },
];

const STATUSES: { label: string; tone: Tone; desc: string }[] = [
  { label: "Verified / Allowed", tone: "green", desc: "Attestation verified, policy evaluated ALLOW, record cryptographically signed." },
  { label: "Review / Warning",   tone: "amber", desc: "Trust gate flagged anomalies or SVID renewal is queued; requires analyst attention." },
  { label: "Denied / Invalid",   tone: "red",   desc: "Security constraint breached, attestation failure, or unauthorized resource access." },
  { label: "Pending / Waiting",  tone: "muted", desc: "Pipeline step awaiting upstream dependency completion or trust gate decision." },
];

/* --------------------------- primitives --------------------------- */

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-white/[0.07] bg-[#0D1117] p-5">
      <h2 className="mb-2 text-sm font-semibold text-white">{title}</h2>
      {children}
    </section>
  );
}

/* ----------------------------- sections ----------------------------- */

function DocNav({ active, onChange }: { active: Section; onChange: (s: Section) => void }) {
  return (
    <nav aria-label="Documentation sections" className="flex gap-1.5 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
      {SECTIONS.map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          aria-current={active === s ? "page" : undefined}
          className={`shrink-0 rounded-lg px-3.5 py-2 text-left text-xs transition ${FOCUS} ${
            active === s
              ? "bg-emerald-400/10 border border-emerald-400/20 font-semibold text-emerald-300"
              : "text-slate-300 hover:bg-white/[0.04] hover:text-white"
          }`}
        >
          {s}
        </button>
      ))}
    </nav>
  );
}

function GettingStarted() {
  return (
    <div className="space-y-4">
      <Card title="CI/CD Zero-Trust Lifecycle">
        <p className="text-xs leading-relaxed text-slate-300">
          Attesta implements zero-trust security for automated CI/CD pipelines. Workloads run without ambient credentials:
        </p>
        <ol className="mt-3 space-y-2 list-decimal list-inside text-xs text-slate-300">
          <li><strong>Workflow Trigger:</strong> A push or pull-request event arrives from GitHub with HMAC validation.</li>
          <li><strong>Attestation:</strong> The runner proves its hardware and software characteristics via SPIRE.</li>
          <li><strong>Trust Gate:</strong> ML models analyze incoming dependencies and commit history for risk signals.</li>
          <li><strong>SVID Issuance:</strong> Short-lived X.509 SVID credentials valid for minutes are issued.</li>
          <li><strong>Access Enforcement:</strong> Open Policy Agent (OPA) evaluates each secret read or artifact publish request.</li>
          <li><strong>Ledger Commitment:</strong> Every critical access decision and provenance hash is immutably committed to Hyperledger Fabric.</li>
        </ol>
      </Card>

      <Card title="Key Concepts">
        <dl className="divide-y divide-white/[0.05]">
          {GLOSSARY.slice(0, 3).map((g) => (
            <div key={g.term} className="py-2.5 text-xs">
              <dt className="font-mono font-semibold text-cyan-400">{g.term}</dt>
              <dd className="mt-1 text-slate-300">{g.meaning}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}

function Architecture() {
  return (
    <div className="space-y-4">
      <Card title="System Architecture">
        <p className="text-xs leading-relaxed text-slate-300">
          The Attesta platform operates as a multi-tier distributed zero-trust system:
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 text-xs">
          <div className="rounded-lg border border-white/[0.06] bg-[#080C14] p-3.5">
            <h4 className="font-semibold text-white">SPIRE Identity Control Plane</h4>
            <p className="mt-1 text-slate-400 leading-relaxed">Issues workload identities based on verifiable node attestors and runtime kernel process attributes.</p>
          </div>
          <div className="rounded-lg border border-white/[0.06] bg-[#080C14] p-3.5">
            <h4 className="font-semibold text-white">OPA Policy Engine</h4>
            <p className="mt-1 text-slate-400 leading-relaxed">Centralized Rego policy evaluation deciding role-based and attribute-based access to protected assets.</p>
          </div>
          <div className="rounded-lg border border-white/[0.06] bg-[#080C14] p-3.5">
            <h4 className="font-semibold text-white">eBPF Runtime Observer</h4>
            <p className="mt-1 text-slate-400 leading-relaxed">Inspects kernel syscalls (exec, connect, read) to detect suspicious credential harvesting and outbound exfiltration.</p>
          </div>
          <div className="rounded-lg border border-white/[0.06] bg-[#080C14] p-3.5">
            <h4 className="font-semibold text-white">Hyperledger Fabric Ledger</h4>
            <p className="mt-1 text-slate-400 leading-relaxed">Cryptographic multi-party consortium ledger preventing retroactive tampering of audit records.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function GlossaryCard() {
  return (
    <Card title="Terminology Glossary">
      <dl className="divide-y divide-white/[0.05]">
        {GLOSSARY.map((g) => (
          <div key={g.term} className="py-2.5 text-xs">
            <div className="flex items-center justify-between">
              <dt className="font-mono font-semibold text-cyan-400">{g.term}</dt>
              {g.link && (
                <Link href={g.link} className="text-[11px] text-blue-400 hover:underline">
                  View in UI →
                </Link>
              )}
            </div>
            <dd className="mt-1 text-slate-300">{g.meaning}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function StatusesCard() {
  return (
    <Card title="Reading Status Badges">
      <ul className="space-y-3">
        {STATUSES.map((s) => (
          <li key={s.label} className="border-b border-white/[0.05] pb-2.5 last:border-0 last:pb-0">
            <span className={`text-xs font-semibold ${TONE_TEXT[s.tone]}`}>{s.label}</span>
            <p className="mt-1 text-xs text-slate-300">{s.desc}</p>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function TrustGateSection() {
  return (
    <Card title="Trust Gate vs. Authorization">
      <div className="space-y-3 text-xs leading-relaxed text-slate-300">
        <p>
          A common point of clarification in zero-trust architecture is the difference between <strong>Trust Gates</strong> and <strong>Authorization</strong>:
        </p>
        <div className="grid gap-3 sm:grid-cols-2 mt-2">
          <div className="rounded-lg border border-white/[0.06] bg-[#080C14] p-3.5">
            <h4 className="font-semibold text-amber-300">Trust Gate (Identity Admission)</h4>
            <p className="mt-1 text-slate-400">
              Evaluated <em>before</em> an identity is minted. Decides whether the runner is sufficiently clean and reputable to receive an SVID credential.
            </p>
          </div>
          <div className="rounded-lg border border-white/[0.06] bg-[#080C14] p-3.5">
            <h4 className="font-semibold text-emerald-300">Authorization (Resource Policy)</h4>
            <p className="mt-1 text-slate-400">
              Evaluated <em>during execution</em> whenever an attested runner attempts an action (reading secrets, pushing artifacts, touching databases).
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

function VerificationSection() {
  return (
    <Card title="Cryptographic Verification">
      <div className="space-y-3 text-xs leading-relaxed text-slate-300">
        <p>
          Attesta implements four layers of cryptographic provenance verification:
        </p>
        <ul className="list-disc list-inside space-y-1 text-slate-400">
          <li><strong>Digital Signatures:</strong> Verified using RSA/ECDSA public keys stored in the consortium trust roots.</li>
          <li><strong>Signer Trustworthiness:</strong> Verifies that the signing certificate chain traces back to an authorized CI/CD signer.</li>
          <li><strong>Payload Integrity:</strong> Compares the SHA-256 digest of artifacts against signed attestation statements.</li>
          <li><strong>Ledger Synchronization:</strong> Cross-checks block transactions against Hyperledger Fabric state trees.</li>
        </ul>
      </div>
    </Card>
  );
}

function ApiSection() {
  return (
    <Card title="API and Integrations">
      <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
        <p>
          Attesta exposes REST and gRPC endpoints for programmatic integration into external build orchestrators:
        </p>
        <div className="rounded-lg bg-[#080C14] border border-white/[0.06] p-3 font-mono text-[11px] text-emerald-300">
          POST /api/v1/attest/workload<br />
          POST /api/v1/policy/check<br />
          GET  /api/v1/ledger/records/:id<br />
          POST /api/v1/incidents/contain
        </div>
        <p className="text-[11px] text-slate-400">
          Configure API credentials and endpoints under <Link href="/integrations" className="text-cyan-400 hover:underline">Integrations & Settings</Link>.
        </p>
      </div>
    </Card>
  );
}

function Content({ section }: { section: Section }) {
  switch (section) {
    case "Getting started":
      return <GettingStarted />;
    case "Architecture":
      return <Architecture />;
    case "Reading statuses":
      return <StatusesCard />;
    case "Glossary":
      return <GlossaryCard />;
    case "Trust gate vs authorization":
      return <TrustGateSection />;
    case "Verification":
      return <VerificationSection />;
    case "API and integrations":
      return <ApiSection />;
    default:
      return <GettingStarted />;
  }
}

/* --------------------------------- page --------------------------------- */

export default function DocumentationPage() {
  const [section, setSection] = useState<Section>("Getting started");

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Documentation</h1>
          <p className="mt-0.5 text-xs text-slate-400">Comprehensive guide to Attesta Zero-Trust security primitives</p>
        </div>
      </div>

      <div className="grid items-start gap-4 rounded-xl border border-white/[0.07] bg-[#0A0F1A] p-4 sm:p-5 lg:grid-cols-[220px_1fr]">
        <DocNav active={section} onChange={setSection} />
        <main className="min-w-0 space-y-4">
          <Content section={section} />
        </main>
      </div>
    </div>
  );
}
