// Manage dashboard users and the session secret. Usage:
//   node scripts/user.mjs <users.json> <username> [password]   add or replace a user
//   node scripts/user.mjs --secret <file>                       create a session secret if missing
// With no password argument one is generated; it is written to <users.json>.<username>.password (mode 600), never printed.
import { randomBytes } from "node:crypto";
import { chmodSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { hashPassword } from "../src/lib/auth-core.mjs";

const [first, second, third] = process.argv.slice(2);

if (first === "--secret") {
  if (!second) throw new Error("usage: user.mjs --secret <file>");
  if (!existsSync(second)) {
    writeFileSync(second, randomBytes(48).toString("base64url") + "\n", { mode: 0o600 });
    chmodSync(second, 0o644); // the dashboard container's uid must read it; the folder is gitignored
    console.log("session secret created");
  } else console.log("session secret exists");
} else {
  if (!first || !second) throw new Error("usage: user.mjs <users.json> <username> [password]");
  const name = second.trim().toLowerCase();
  if (!/^[a-z0-9._-]{1,64}$/.test(name)) throw new Error("username: 1-64 chars of a-z 0-9 . _ -");
  const users = existsSync(first) ? JSON.parse(readFileSync(first, "utf8")) : {};
  const password = third ?? randomBytes(18).toString("base64url");
  if (password.length < 12) throw new Error("password must be at least 12 characters");
  users[name] = hashPassword(password);
  writeFileSync(first, JSON.stringify(users, null, 2) + "\n");
  chmodSync(first, 0o644);
  if (third === undefined) {
    const file = `${first}.${name}.password`;
    writeFileSync(file, password + "\n", { mode: 0o600 });
    console.log(`user ${name} saved; generated password written to ${file}`);
  } else console.log(`user ${name} saved`);
}
