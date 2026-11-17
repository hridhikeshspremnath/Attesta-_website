// Password hashing, signed session tokens and login throttling. Pure Node crypto, no framework imports,
// so scripts/user.mjs and the node:test suite can use it directly.
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SCRYPT = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

/** "scrypt$<salt b64>$<hash b64>" */
export function hashPassword(password) {
  const salt = randomBytes(16);
  return `scrypt$${salt.toString("base64")}$${scryptSync(password, salt, 32, SCRYPT).toString("base64")}`;
}

/** Constant-time check. A missing or malformed stored hash still burns a scrypt so unknown users cost the same. */
export function verifyPassword(stored, password) {
  const [kind, saltB64, hashB64] = String(stored ?? "").split("$");
  const ok = kind === "scrypt" && saltB64 && hashB64;
  const salt = Buffer.from(ok ? saltB64 : "AAAAAAAAAAAAAAAAAAAAAA==", "base64");
  const want = Buffer.from(ok ? hashB64 : "A".repeat(43) + "=", "base64");
  const got = scryptSync(password, salt, want.length, SCRYPT);
  return Boolean(ok) && timingSafeEqual(got, want);
}

const b64url = (buf) => Buffer.from(buf).toString("base64url");
const mac = (secret, data) => createHmac("sha256", secret).update(data).digest();

/** Signed, expiring session token: base64url(json).base64url(hmac). Stateless: no server-side revocation. */
export function signSession(secret, user, ttlMs, now = Date.now()) {
  const body = b64url(JSON.stringify({ u: user, exp: now + ttlMs }));
  return `${body}.${b64url(mac(secret, body))}`;
}

/** The username, or null for anything forged, tampered or expired. */
export function verifySession(secret, token, now = Date.now()) {
  const [body, sig] = String(token ?? "").split(".");
  if (!body || !sig) return null;
  const want = mac(secret, body);
  const got = Buffer.from(sig, "base64url");
  if (got.length !== want.length || !timingSafeEqual(got, want)) return null;
  try {
    const { u, exp } = JSON.parse(Buffer.from(body, "base64url").toString());
    return typeof u === "string" && typeof exp === "number" && exp > now ? u : null;
  } catch {
    return null;
  }
}

/** Only same-site relative paths survive; anything else becomes "/". Stops open redirects after login. */
export function safeNext(next) {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") && !next.includes("\\") ? next : "/";
}

/**
 * Locks a key out after `max` failures within `windowMs`, for `lockMs`.
 * shortcut: in-memory, per process and reset on restart; use a shared store if the dashboard is scaled out.
 */
export class LoginLimiter {
  constructor({ max = 5, windowMs = 5 * 60_000, lockMs = 60_000 } = {}) {
    Object.assign(this, { max, windowMs, lockMs });
    this.state = new Map();
  }
  /** Seconds left on a lockout, 0 when allowed. */
  retryAfter(key, now = Date.now()) {
    const s = this.state.get(key);
    return s?.until > now ? Math.ceil((s.until - now) / 1000) : 0;
  }
  fail(key, now = Date.now()) {
    const s = this.state.get(key);
    const fresh = !s || now - s.first > this.windowMs || s.until;
    const next = fresh ? { first: now, count: 1, until: 0 } : { ...s, count: s.count + 1 };
    if (next.count >= this.max) Object.assign(next, { until: now + this.lockMs, count: 0, first: now });
    this.state.set(key, next);
    if (this.state.size > 10_000) this.state.delete(this.state.keys().next().value);
  }
  success(key) {
    this.state.delete(key);
  }
}
