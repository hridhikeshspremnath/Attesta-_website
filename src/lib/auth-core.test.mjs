import assert from "node:assert/strict";
import test from "node:test";
import { LoginLimiter, hashPassword, safeNext, signSession, verifyPassword, verifySession } from "./auth-core.mjs";

test("passwords: right one verifies, wrong, empty and malformed hashes do not", () => {
  const stored = hashPassword("correct horse");
  assert.ok(verifyPassword(stored, "correct horse"));
  assert.ok(!verifyPassword(stored, "correct horsf"));
  assert.ok(!verifyPassword(stored, ""));
  assert.ok(!verifyPassword(undefined, "x"));
  assert.ok(!verifyPassword("plaintext", "plaintext"));
  assert.notEqual(stored, hashPassword("correct horse")); // fresh salt every time
});

test("sessions: valid, expired, tampered, wrong secret, garbage", () => {
  const secret = "s".repeat(32), t0 = 1_000_000;
  const token = signSession(secret, "ada", 60_000, t0);
  assert.equal(verifySession(secret, token, t0 + 1_000), "ada");
  assert.equal(verifySession(secret, token, t0 + 61_000), null); // expired
  assert.equal(verifySession("x".repeat(32), token, t0), null); // wrong secret
  const [body, sig] = token.split(".");
  const forged = Buffer.from(JSON.stringify({ u: "root", exp: t0 + 999_999 })).toString("base64url");
  assert.equal(verifySession(secret, `${forged}.${sig}`, t0), null); // new body, old signature
  assert.equal(verifySession(secret, `${body}.${sig.slice(0, -2)}AA`, t0), null);
  for (const junk of ["", "a", "a.b", undefined, null, "..."]) assert.equal(verifySession(secret, junk, t0), null);
});

test("safeNext only allows same-site relative paths", () => {
  assert.equal(safeNext("/trust-ledger?x=1"), "/trust-ledger?x=1");
  for (const bad of ["//evil.example", "https://evil.example", "/\\evil", "evil", "", undefined]) assert.equal(safeNext(bad), "/");
});

test("limiter locks after max failures, expires, and resets on success", () => {
  const l = new LoginLimiter({ max: 3, windowMs: 10_000, lockMs: 5_000 });
  for (let i = 0; i < 2; i++) l.fail("ada", 0);
  assert.equal(l.retryAfter("ada", 1), 0);
  l.fail("ada", 2);
  assert.equal(l.retryAfter("ada", 3), 5); // locked
  assert.equal(l.retryAfter("bob", 3), 0); // other keys unaffected
  assert.equal(l.retryAfter("ada", 5_003), 0); // lock expired
  l.fail("ada", 6_000);
  l.success("ada");
  l.fail("ada", 6_001);
  l.fail("ada", 6_002);
  assert.equal(l.retryAfter("ada", 6_003), 0); // success cleared the count
  const old = new LoginLimiter({ max: 2, windowMs: 1_000, lockMs: 5_000 });
  old.fail("x", 0);
  old.fail("x", 2_000); // first failure aged out of the window
  assert.equal(old.retryAfter("x", 2_001), 0);
});
