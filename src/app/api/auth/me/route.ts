// GET /api/auth/me -> the signed-in username (401 when signed out).
import { cookies } from "next/headers";
import { COOKIE, sessionUser } from "@/src/lib/auth";

export async function GET() {
  const user = sessionUser((await cookies()).get(COOKIE)?.value);
  return user ? Response.json({ user }) : Response.json({ error: "Sign in required" }, { status: 401 });
}
