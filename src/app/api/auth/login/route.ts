// POST /api/auth/login {username, password} -> sets the session cookie.
import { COOKIE, SESSION_MS, login, sameOrigin } from "@/src/lib/auth";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Cross-site request refused" }, { status: 403 });
  let body: { username?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  if (typeof body.username !== "string" || typeof body.password !== "string" || body.username.length > 100 || body.password.length > 1000) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const result = login(body.username, body.password, ip);
  if (!result.ok) {
    if (result.reason === "unconfigured") return Response.json({ error: "Sign-in is not configured on this server" }, { status: 503 });
    if (result.reason === "locked") {
      return Response.json({ error: `Too many attempts. Try again in ${result.retryAfter}s.` }, { status: 429, headers: { "Retry-After": String(result.retryAfter) } });
    }
    return Response.json({ error: "Invalid username or password" }, { status: 401 });
  }

  const secure = new URL(request.url).protocol === "https:" || request.headers.get("x-forwarded-proto") === "https";
  const cookie = `${COOKIE}=${result.token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_MS / 1000}${secure ? "; Secure" : ""}`;
  return Response.json({ ok: true }, { headers: { "Set-Cookie": cookie } });
}
