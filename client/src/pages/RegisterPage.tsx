import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiPost } from "../lib/api";
import { setAuth, type AuthUser } from "../lib/auth";

type AuthResponse = { token: string; user: AuthUser };

export function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await apiPost<AuthResponse>("/api/auth/register", {
        name: name.trim() || undefined,
        email,
        password,
      });
      setAuth(data.token, data.user);
      navigate("/home", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10 animate-fade-in sm:px-6">
      <Link to="/" className="mb-3 font-display text-lg font-bold">
        Campus<span className="text-accent">Hub</span>
      </Link>
      <h1 className="font-display text-3xl">Create account</h1>
      <p className="mt-1 text-sm text-muted">Register to join clubs and RSVP to events.</p>

      <form
        onSubmit={onSubmit}
        className="mt-6 flex flex-col gap-3 rounded-[var(--radius)] border border-border bg-surface p-5 shadow-[var(--shadow-soft)]"
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-semibold">Name (optional)</span>
          <input
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-10 rounded-[var(--radius-sm)] border border-border px-3"
          />
        </label>
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
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-10 rounded-[var(--radius-sm)] border border-border px-3"
          />
          <span className="text-xs text-muted">At least 6 characters</span>
        </label>
        {error ? (
          <p className="text-sm text-[var(--danger)]" role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" disabled={loading} className="btn-join !h-10 !rounded-[var(--radius-sm)]">
          {loading ? "Creating…" : "Create account"}
        </button>
      </form>

      <p className="mt-5 text-sm text-muted">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-accent underline-offset-2 hover:underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
