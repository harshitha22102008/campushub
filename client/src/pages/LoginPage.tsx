import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiPost } from "../lib/api";
import { setAuth, type AuthUser } from "../lib/auth";

type AuthResponse = { token: string; user: AuthUser };

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await apiPost<AuthResponse>("/api/auth/login", { email, password });
      setAuth(data.token, data.user);
      navigate("/home", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10 animate-fade-in sm:px-6">
      <Link to="/" className="mb-3 font-display text-lg font-bold">
        Campus<span className="text-accent">Hub</span>
      </Link>
      <h1 className="font-display text-3xl">Sign in</h1>
      <p className="mt-1 text-sm text-muted">Back to clubs, events, and your board.</p>

      <form
        onSubmit={onSubmit}
        className="mt-6 flex flex-col gap-3 rounded-[var(--radius)] border border-border bg-surface p-5 shadow-[var(--shadow-soft)]"
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-semibold">Email</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-10 rounded-[var(--radius-sm)] border border-border px-3"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-semibold">Password</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-10 rounded-[var(--radius-sm)] border border-border px-3"
          />
        </label>
        {error ? (
          <p className="text-sm text-[var(--danger)]" role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" disabled={loading} className="btn-join !h-10 !rounded-[var(--radius-sm)]">
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-5 text-sm text-muted">
        No account?{" "}
        <Link to="/register" className="font-semibold text-accent underline-offset-2 hover:underline">
          Create one
        </Link>
      </p>
      <p className="mt-2 text-xs text-muted">Demo: demo@campushub.local / demo1234</p>
    </main>
  );
}
