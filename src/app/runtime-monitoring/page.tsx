"use client";

// src/app/runtime-monitoring/page.tsx — there is no runtime agent in this deployment, so there is nothing to show.
// Showing invented events here would be worse than showing none.
import Link from "next/link";
import PageHeader from "@/src/components/ui/PageHeader";
import { Badge, Card, EmptyState } from "@/src/components/ui/primitives";

export default function RuntimeMonitoringPage() {
  return (
    <div className="page">
      <PageHeader title="Runtime monitoring" subtitle="Kernel-level activity on CI runners" badges={<Badge tone="neutral">Not connected</Badge>} />
      <Card flush title="Runtime events">
        <EmptyState title="No runtime agent is connected">
          Runtime monitoring needs an eBPF agent running on the CI runners to report file, process and network activity. None is deployed here, so this page has no data. Package-level behaviour (install scripts, network use, credential access) is already scored before a package runs: see{" "}
          <Link href="/trust-decisions" className="link">Trust Decisions</Link>.
        </EmptyState>
      </Card>
    </div>
  );
}
