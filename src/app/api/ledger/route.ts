// GET /api/ledger — read-only view of the gateway's ledger for the dashboard.
import { cookies } from "next/headers";
import { connection } from "next/server";
import { COOKIE, sessionUser } from "@/src/lib/auth";
import { gatewayGet } from "@/src/lib/gateway";
import type { Checkpoint, LedgerEntry } from "@/src/types";

const PAGE = 100;
// shortcut: reads at most MAX_PAGES pages per request; add server-side paging in the UI past 500 records.
const MAX_PAGES = 5;

export async function GET() {
  await connection(); // always request-time: never prerender ledger state
  if (!sessionUser((await cookies()).get(COOKIE)?.value)) {
    return Response.json({ error: "Sign in required" }, { status: 401 }); // checked here too, not only in proxy.ts
  }
  try {
    const checkpoint = await gatewayGet<Checkpoint>("/checkpoint");
    if (checkpoint.status !== 200 && checkpoint.status !== 404) throw new Error(`gateway /checkpoint returned ${checkpoint.status}`);

    const records: LedgerEntry[] = [];
    let cursor = "";
    for (let page = 0; page < MAX_PAGES; page++) {
      const res = await gatewayGet<LedgerEntry[]>(`/records?limit=${PAGE}&cursor=${encodeURIComponent(cursor)}`);
      if (res.status !== 200) throw new Error(`gateway /records returned ${res.status}`);
      records.push(...res.body);
      cursor = res.nextCursor;
      if (!cursor) break;
    }
    records.sort((a, b) => b.timestamp - a.timestamp); // newest first, whatever the backend's order
    return Response.json({ records, checkpoint: checkpoint.status === 200 ? checkpoint.body : null, truncated: cursor !== "" });
  } catch (err) {
    console.error("ledger fetch failed:", err);
    return Response.json({ error: "Ledger gateway is unreachable" }, { status: 502 });
  }
}
