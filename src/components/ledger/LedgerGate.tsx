"use client";

// Loading / error / ready wrapper so every live page handles the ledger the same way.
import { Button, Card, EmptyState } from "@/src/components/ui/primitives";
import { useLedger, type Ledger } from "@/src/lib/ledger";

export default function LedgerGate({ title, aside, children }: {
  title: string; aside?: React.ReactNode; children: (ledger: Ledger, reload: () => void) => React.ReactNode;
}) {
  const { state, reload } = useLedger();
  if (state.status === "ready") return <>{children(state.data, reload)}</>;
  return (
    <Card flush title={title} aside={aside}>
      {state.status === "loading"
        ? <EmptyState title="Loading ledger…" />
        : <EmptyState title="Could not load the ledger" action={<Button onClick={reload}>Retry</Button>}>{state.message}</EmptyState>}
    </Card>
  );
}
