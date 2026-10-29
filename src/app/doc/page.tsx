"use client";

// src/app/docs/page.tsx
// Attesta — Documentation (Getting started). Same conventions as workload-identity/page.tsx.
// Tailwind only; no new dependencies.

import { useState, type ReactNode } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";

/* ------------------------- tokens + types ------------------------- */

type Tone = "green" | "amber" | "red" | "muted";

const TONE_TEXT: Record<Tone, string> = {
   green: "text-emerald-400",
   amber: "text-amber-400",
   red: "text-red-400",
   muted: "text-slate-400",
};

const MUTED = "text-slate-400";
const DIVIDER = "border-white/[0.06]";
const FOCUS = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400";

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

const FLOW =
   "A workflow starts, the workload proves its identity, the trust gate checks its history, a short-lived identity is issued, runtime requests are evaluated, and each significant decision is signed and recorded.";

const GLOSSARY: { term: string; meaning: string }[] = [
   { term: "SPIFFE ID", meaning: "Name of a workload identity" },
   { term: "SVID", meaning: "Short-lived credential for that identity" },
   { term: "Trust gate", meaning: "Decides whether identity is issued" },
   { term: "Authorization", meaning: "Decides whether an action on a resource is allowed" },
   { term: "Provenance", meaning: "Signed record of how a build ran" },
];

const STATUSES: { label: string; tone: Tone }[] = [
   { label: "Verified", tone: "green" },
   { label: "Review or not yet verified", tone: "amber" },
   { label: "Denied or invalid", tone: "red" },
   { label: "Unknown or not scored", tone: "muted" },
];

/* --------------------------- primitives --------------------------- */

function Card({ title, children }: { title: string; children: ReactNode }) {
   return (
      <section className="rounded-lg border border-white/5 bg-[#0e1a30] px-4 pb-3 pt-3.5">
         <h2 className="mb-1.5 text-xs font-bold text-white">{title}</h2>
         {children}
      </section>
   );
}

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

/* ----------------------------- sections ----------------------------- */

function DocNav({ active, onChange }: { active: Section; onChange: (s: Section) => void }) {
   return (
      <nav aria-label="Documentation sections" className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
         {SECTIONS.map((s) => (
            <button
               key={s}
               onClick={() => onChange(s)}
               aria-current={active === s ? "page" : undefined}
               className={`shrink-0 rounded-md px-3 py-2 text-left text-xs transition motion-reduce:transition-none ${FOCUS} ${active === s ? "bg-[#111d36] font-medium text-white" : "text-slate-300 hover:text-white"
                  }`}
            >
               {s}
            </button>
         ))}
      </nav>
   );
}

function FlowCard() {
   return (
      <Card title="The flow">
         <p className={`text-xs leading-relaxed ${MUTED}`}>{FLOW}</p>
      </Card>
   );
}

function GlossaryCard() {
   return (
      <Card title="Glossary">
         <dl>
            {GLOSSARY.map((g) => (
               <div key={g.term} className={`flex items-center justify-between gap-4 border-t py-2.5 text-xs first:border-t-0 ${DIVIDER}`}>
                  <dt className="font-mono font-bold text-cyan-300">{g.term}</dt>
                  <dd className="text-right text-slate-300">{g.meaning}</dd>
               </div>
            ))}
         </dl>
      </Card>
   );
}

function StatusesCard() {
   return (
      <Card title="Reading statuses">
         <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium">
            {STATUSES.map((s) => (
               <li key={s.label} className={TONE_TEXT[s.tone]}>{s.label}</li>
            ))}
         </ul>
      </Card>
   );
}

function GettingStarted() {
   return (
      <div className="space-y-4">
         <FlowCard />
         <GlossaryCard />
         <StatusesCard />
      </div>
   );
}

function Placeholder({ section }: { section: Section }) {
   return (
      <p className={`py-16 text-center text-xs ${MUTED}`}>
         {section} hasn’t been written yet. Start with Getting started.
      </p>
   );
}

function Content({ section }: { section: Section }) {
   switch (section) {
      case "Getting started":
         return <GettingStarted />;
      case "Glossary":
         return <GlossaryCard />;
      case "Reading statuses":
         return <StatusesCard />;
      default:
         return <Placeholder section={section} />;
   }
}

/* --------------------------------- page --------------------------------- */

export default function DocumentationPage() {
   const [section, setSection] = useState<Section>("Getting started");

   return (
      <DashboardLayout>
         <div className="min-h-full bg-black p-4 sm:p-6" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", system-ui, sans-serif' }}>
            <div className="mx-auto max-w-[1200px] space-y-4">
               <TopBar />
               <div className="grid items-start gap-4 rounded-xl bg-[#0b1426] p-4 sm:p-6 lg:grid-cols-[200px_1fr]">
                  <DocNav active={section} onChange={setSection} />
                  <main className="space-y-4">
                     <h1 className="text-xl font-bold tracking-tight text-white">{section}</h1>
                     <Content section={section} />
                  </main>
               </div>
            </div>
         </div>
      </DashboardLayout>
   );
}