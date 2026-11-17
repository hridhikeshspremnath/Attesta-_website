"use client";

// src/app/login/page.tsx — sign in. Rendered without the dashboard shell (see DashboardLayout).
import Image from "next/image";
import { useState, type FormEvent } from "react";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: form.get("username"), password: form.get("password") }),
      });
      if (res.ok) {
        const next = new URLSearchParams(window.location.search).get("next") ?? "/";
        // Same-site relative paths only; anything else would be an open redirect.
        window.location.assign(next.startsWith("/") && !next.startsWith("//") && !next.includes("\\") ? next : "/");
        return;
      }
      setError((await res.json().catch(() => ({}))).error ?? `Sign-in failed (HTTP ${res.status})`);
    } catch {
      setError("Could not reach the server");
    }
    setBusy(false);
  }

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4 p-6" aria-labelledby="login-title">
        <div className="relative mx-auto h-[46px] w-[188px] overflow-hidden">
          <Image src="/logo.png" alt="Attesta" fill sizes="188px" priority className="object-contain mix-blend-screen brightness-150 grayscale" />
        </div>
        <h1 id="login-title" className="text-center text-base font-semibold text-fg">Sign in</h1>
        <div>
          <label htmlFor="username" className="field-label">Username</label>
          <input id="username" name="username" autoComplete="username" required autoFocus className="field" />
        </div>
        <div>
          <label htmlFor="password" className="field-label">Password</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required className="field" />
        </div>
        {error && <p role="alert" className="text-xs text-crit">{error}</p>}
        <button type="submit" disabled={busy} className="btn btn-primary w-full">{busy ? "Signing in…" : "Sign in"}</button>
      </form>
    </main>
  );
}
