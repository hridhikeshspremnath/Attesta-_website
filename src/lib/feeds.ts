"use client";

// Generic live feed for the JSON routes (/api/identity, /api/policy): loading / error / ready,
// refreshed in the background. The ledger has its own hook in lib/ledger.ts.
import { useEffect, useState } from "react";
import { REFRESH_MS, usePolling } from "@/src/lib/live";

export type Feed<T> = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; data: T };

export function useFeed<T>(url: string): { state: Feed<T>; reload: () => void } {
  const [state, setState] = useState<Feed<T>>({ status: "loading" });
  const [reloads, setReloads] = useState(0);
  const tick = usePolling(REFRESH_MS);
  useEffect(() => {
    let live = true;
    fetch(url, { cache: "no-store" })
      .then(async (res): Promise<Feed<T>> => {
        const body = await res.json();
        return res.ok ? { status: "ready", data: body } : { status: "error", message: body.error ?? `HTTP ${res.status}` };
      })
      .catch((): Feed<T> => ({ status: "error", message: "Dashboard server is unreachable" }))
      .then((next) => { if (live) setState(next); });
    return () => { live = false; };
  }, [url, reloads, tick]);
  return { state, reload: () => setReloads((n) => n + 1) };
}
