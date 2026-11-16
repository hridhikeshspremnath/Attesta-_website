"use client";

// src/app/error.tsx
// Attesta — Route error boundary. The shell stays usable while a page recovers.

import { useEffect } from "react";
import { Button, ButtonLink, EmptyState } from "@/src/components/ui/primitives";

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="page">
      <div className="card" role="alert">
        <EmptyState
          title="This page failed to load"
          action={
            <div className="flex gap-2">
              <Button variant="primary" onClick={() => retry()}>Try again</Button>
              <ButtonLink href="/">Go to Overview</ButtonLink>
            </div>
          }
        >
          Nothing on this page was changed. Other pages are unaffected.
        </EmptyState>
      </div>
    </div>
  );
}
