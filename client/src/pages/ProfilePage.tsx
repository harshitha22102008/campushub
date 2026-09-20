import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { apiGet, apiPatch } from "../lib/api";
import {
  clearAuth,
  getStoredUser,
  setStoredUser,
  type AuthUser,
} from "../lib/auth";

export function ProfilePage() {
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
      <AppShell title="Profile">
        <p className="text-sm text-muted">Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell title="Student profile">
      <div className="animate-fade-in max-w-lg">
        <h1 className="font-display text-2xl">Your profile</h1>
        <p className="mt-1 text-sm text-muted">
          Name, major, and a short bio other students can see.
        </p>

        {error ? (
          <p className="mt-3 text-sm text-[var(--danger)]" role="alert">
            {error}
          </p>
        ) : null}

        <form
          onSubmit={onSaveProfile}
          className="mt-4 flex flex-col gap-3 rounded-[var(--radius)] border border-border bg-surface p-4 shadow-[var(--shadow-soft)]"
        >
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold">Email</span>
            <input
              type="email"
              value={user?.email ?? ""}
              disabled
              className="h-9 rounded-[var(--radius-sm)] border border-border bg-bg px-3 text-muted"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold">Name</span>
            <input
              type="text"
              value={name}
              maxLength={80}
              onChange={(e) => setName(e.target.value)}
              className="h-9 rounded-[var(--radius-sm)] border border-border px-3"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold">Major / program</span>
            <input
              type="text"
              value={major}
              maxLength={80}
              placeholder="e.g. B.Tech CSE"
              onChange={(e) => setMajor(e.target.value)}
              className="h-9 rounded-[var(--radius-sm)] border border-border px-3"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold">Bio</span>
            <textarea
              value={bio}
              maxLength={500}
              rows={3}
              onChange={(e) => setBio(e.target.value)}
              className="rounded-[var(--radius-sm)] border border-border px-3 py-2"
            />
          </label>
          {savedMsg ? (
            <p className="text-sm text-[var(--success)]">{savedMsg}</p>
          ) : null}
          <button type="submit" disabled={saving} className="btn-join !h-9 !w-fit !rounded-[var(--radius-sm)]">
            {saving ? "Saving…" : "Save profile"}
          </button>
        </form>
      </div>
    </AppShell>
  );
}
