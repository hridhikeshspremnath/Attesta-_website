// Server-side auth glue: where the secrets live and who may sign in. Never import from a client component.
import { readFileSync } from "node:fs";
import { LoginLimiter, signSession, verifyPassword, verifySession } from "./auth-core.mjs";

export const COOKIE = "attesta_session";
export const SESSION_MS = 8 * 60 * 60 * 1000;

// Secrets are files (mounted read-only in the container), never env vars or image layers.
function readSecret(): string | null {
  try {
    const s = readFileSync(process.env.ATTESTA_SESSION_SECRET_FILE ?? "", "utf8").trim();
    return s.length >= 32 ? s : null;
  } catch {
    return null;
  }
}

function readUsers(): Record<string, string> {
  try {
    return JSON.parse(readFileSync(process.env.ATTESTA_USERS_FILE ?? "", "utf8"));
  } catch {
    return {};
  }
}

/** The signed-in username, or null. With no secret configured nobody is signed in (fails closed). */
export function sessionUser(token: string | undefined): string | null {
  const secret = readSecret();
  return secret ? verifySession(secret, token, Date.now()) : null;
}

// A wrong guess locks one username for a minute; the per-IP cap is higher because every
// request can share one address behind Docker or a proxy.
const byUser = new LoginLimiter({ max: 5 });
const byIp = new LoginLimiter({ max: 30 });

export type LoginResult = { ok: true; token: string } | { ok: false; retryAfter: number; reason: "locked" | "invalid" | "unconfigured" };

export function login(username: string, password: string, ip: string): LoginResult {
  const secret = readSecret();
  const users = readUsers();
  if (!secret || Object.keys(users).length === 0) return { ok: false, retryAfter: 0, reason: "unconfigured" };

  const name = username.trim().toLowerCase();
  const wait = Math.max(byUser.retryAfter(name), byIp.retryAfter(ip));
  if (wait) return { ok: false, retryAfter: wait, reason: "locked" };

  // Always run the hash check, with a dummy for unknown users, so timing does not reveal who exists.
  const known = Object.prototype.hasOwnProperty.call(users, name);
  if (verifyPassword(known ? users[name] : undefined, password) && known) {
    byUser.success(name);
    return { ok: true, token: signSession(secret, name, SESSION_MS) };
  }
  byUser.fail(name);
  byIp.fail(ip);
  return { ok: false, retryAfter: 0, reason: "invalid" };
}

/** Cross-site POSTs carry an Origin that is not this host. */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return !origin || new URL(origin).host === request.headers.get("host");
}
