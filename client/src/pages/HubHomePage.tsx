import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiGet, apiPatch } from "../lib/api";
import {
  clearAuth,
  getStoredUser,
  setStoredUser,
  type AuthUser,
} from "../lib/auth";

export function HubHomePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [major, setMajor] = useState(user?.major ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiGet<{ user: AuthUser }>("/api/auth/me", true);
        if (cancelled) return;
        setUser(data.user);
        setStoredUser(data.user);
        setName(data.user.name ?? "");
        setMajor(data.user.major ?? "");
        setBio(data.user.bio ?? "");
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Session expired");
          clearAuth();
          navigate("/login", { replace: true });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  function logout() {
    clearAuth();
    navigate("/login", { replace: true });
  }

  async function onSaveProfile(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSavedMsg(null);
    setSaving(true);
    try {
      const data = await apiPatch<{ user: AuthUser }>(
        "/api/auth/me",
        {
          name: name.trim() || null,
          major: major.trim() || null,
          bio: bio.trim() || null,
        },
        true,
      );
      setUser(data.user);
      setStoredUser(data.user);
      setSavedMsg("Profile saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto flex min-h-screen max-w-[68rem] items-center px-6">
        <p className="text-muted">Loading…</p>
      </main>
    );
  }

  return (
    <div className="min-h-screen animate-fade-in">
      <header className="border-b border-border bg-surface/80 backdrop-blur">
        <div className="mx-auto flex h-[var(--nav-h)] max-w-[68rem] items-center justify-between px-6">
          <Link to="/" className="font-display text-lg text-ink">
            CampusHub
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <span className="hidden text-muted sm:inline">
              {user?.email}
            </span>
            <button
              type="button"
              onClick={logout}
              className="h-9 rounded-[var(--radius-sm)] border border-border bg-surface px-3 font-medium text-ink transition hover:bg-accent-soft"
            >
              Sign out
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[68rem] px-6 py-10">
        <h1 className="font-display text-3xl">Your hub</h1>
        <p className="mt-2 max-w-xl text-muted">
          Clubs and events come next. For now, keep your student profile up to
          date.
        </p>

        {error ? (
          <p className="mt-4 text-sm text-[var(--danger)]" role="alert">
            {error}
          </p>
        ) : null}

        <form
          onSubmit={onSaveProfile}
          className="mt-8 max-w-lg rounded-[var(--radius)] border border-border bg-surface p-6 shadow-[var(--shadow-soft)]"
        >
          <h2 className="font-display text-xl">Student profile</h2>
          <p className="mt-1 text-sm text-muted">
            Email is your login and cannot be changed here.
          </p>

          <div className="mt-5 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-ink">Email</span>
              <input
                type="email"
                value={user?.email ?? ""}
                disabled
                className="h-10 rounded-[var(--radius-sm)] border border-border bg-bg px-3 text-muted"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-ink">Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-ink focus-visible:outline-none focus-visible:shadow-[var(--ring)]"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-ink">Major / program</span>
              <input
                type="text"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                maxLength={80}
                placeholder="e.g. B.Tech CSE"
                className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-ink focus-visible:outline-none focus-visible:shadow-[var(--ring)]"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-ink">Bio</span>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="A short intro for other students"
                className="rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-2 text-ink focus-visible:outline-none focus-visible:shadow-[var(--ring)]"
              />
            </label>

            {savedMsg ? (
              <p className="text-sm text-[var(--success)]">{savedMsg}</p>
            ) : null}

            <button
              type="submit"
              disabled={saving}
              className="h-10 self-start rounded-[var(--radius-sm)] bg-accent px-4 font-medium text-white transition hover:bg-accent-hover disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save profile"}
            </button>
          </div>
        </form>

        <p className="mt-8 text-sm text-muted">
          Next: browse and create clubs, then join events under those clubs.
        </p>
      </main>
    </div>
  );
}
