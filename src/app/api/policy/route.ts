// GET /api/policy — the policy the gateway enforces and, on Fabric, the policy the chain has approved.
import { cookies } from "next/headers";
import { connection } from "next/server";
import { COOKIE, sessionUser } from "@/src/lib/auth";
import { gatewayGet } from "@/src/lib/gateway";
import type { PolicyView } from "@/src/types";

export async function GET() {
  await connection();
  if (!sessionUser((await cookies()).get(COOKIE)?.value)) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }
  try {
    const res = await gatewayGet<PolicyView>("/policy");
    if (res.status !== 200) throw new Error(`gateway /policy returned ${res.status}`);
    return Response.json(res.body);
  } catch (err) {
    console.error("policy fetch failed:", err);
    return Response.json({ error: "Policy gateway is unreachable" }, { status: 502 });
  }
}
