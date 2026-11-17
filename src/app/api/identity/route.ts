// GET /api/identity — the SPIRE registration snapshot exported by scripts/identity-snapshot.sh.
import { readFile } from "node:fs/promises";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { COOKIE, sessionUser } from "@/src/lib/auth";

export async function GET() {
  await connection(); // request-time only
  if (!sessionUser((await cookies()).get(COOKIE)?.value)) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }
  try {
    const snapshot = JSON.parse(await readFile(process.env.ATTESTA_IDENTITY_FILE ?? "", "utf8"));
    return Response.json({ snapshot, now: Math.floor(Date.now() / 1000) });
  } catch {
    return Response.json({ error: "No identity snapshot yet. Run scripts/identity-snapshot.sh." }, { status: 503 });
  }
}
