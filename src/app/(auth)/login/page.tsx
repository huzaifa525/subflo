"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) { setError("Invalid credentials"); setLoading(false); }
    else router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg-primary)" }}>
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-semibold text-sm mx-auto mb-4" style={{ background: "var(--accent)" }}>S</div>
          <h1 className="text-lg font-semibold tracking-tight">Sign in to Subflo</h1>
          <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>Track your subscriptions smarter</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="p-2.5 rounded-lg text-xs" style={{ background: "var(--red-muted)", color: "var(--red)" }}>{error}</div>
          )}
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="sf-input" placeholder="you@example.com" required />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="sf-input" placeholder="********" required />
          </div>
          <button type="submit" disabled={loading} className="sf-btn sf-btn-primary w-full">{loading ? "Signing in..." : "Sign in"}</button>
        </form>

        <p className="text-center text-xs" style={{ color: "var(--text-tertiary)" }}>
          No account? <Link href="/register" style={{ color: "var(--accent-text)" }}>Create one</Link>
        </p>
      </div>
    </div>
  );
}
