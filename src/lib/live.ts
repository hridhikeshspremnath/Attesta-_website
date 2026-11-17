"use client";

import { useEffect, useState } from "react";

/** A counter that ticks every `ms` while the tab is visible. Add it to a fetch effect's dependencies
 *  to refresh in the background: the previous data stays on screen until the new data arrives. */
export function usePolling(ms: number): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => { if (!document.hidden) setTick((n) => n + 1); }, ms);
    return () => clearInterval(id);
  }, [ms]);
  return tick;
}

export const REFRESH_MS = 15_000;
