// Sends signed-out visitors to /login and answers signed-out API calls with 401.
// This is the convenience layer: /api/ledger also checks the session itself, so data is
// protected even if this file is bypassed or misconfigured.
import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, sessionUser } from "@/src/lib/auth";

export function proxy(request: NextRequest) {
  if (sessionUser(request.cookies.get(COOKIE)?.value)) return NextResponse.next();
  const { pathname, search } = request.nextUrl;
  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const login = new URL("/login", request.url);
  login.searchParams.set("next", pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  // Public: the login page, the auth and health routes, and static assets.
  matcher: ["/((?!login$|api/auth/|api/health$|_next/static|_next/image|favicon\\.ico$|logo\\.png$).*)"],
};
