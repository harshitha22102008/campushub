import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { AppShell } from "../components/AppShell";
import { ClubCard } from "../components/ClubCard";
import { EventCard } from "../components/EventCard";
import { apiGet, apiPost } from "../lib/api";
import type { CampusEvent, Club } from "../lib/types";

type Tab = "events" | "clubs" | "mine";

function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function HubHomePage() {
  const [tab, setTab] = useState<Tab>("events");
  const [clubs, setClubs] = useState<Club[]>([]);
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [myClubs, setMyClubs] = useState<Club[]>([]);
  const [myEvents, setMyEvents] = useState<CampusEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [clubName, setClubName] = useState("");
  const [clubDesc, setClubDesc] = useState("");
  const [creatingClub, setCreatingClub] = useState(false);

  const [eventTitle, setEventTitle] = useState("");
  const [eventDesc, setEventDesc] = useState("");
  const [eventLoc, setEventLoc] = useState("");
  const [eventClubId, setEventClubId] = useState("");
  const [eventStarts, setEventStarts] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    d.setHours(17, 0, 0, 0);
    return toLocalInputValue(d);
  });
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [showCreateClub, setShowCreateClub] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);

  const adminClubs = clubs.filter((c) => c.role === "admin");

  async function refresh() {
    const [c, e, mc, me] = await Promise.all([
      apiGet<{ clubs: Club[] }>("/api/clubs", true),
      apiGet<{ events: CampusEvent[] }>("/api/events", true),
      apiGet<{ clubs: Club[] }>("/api/clubs/mine", true),
      apiGet<{ events: CampusEvent[] }>("/api/events/mine", true),
    ]);
    setClubs(c.clubs);
    setEvents(e.events);
    setMyClubs(mc.clubs);
    setMyEvents(me.events);
    if (!eventClubId && c.clubs.some((x) => x.role === "admin")) {
      const firstAdmin = c.clubs.find((x) => x.role === "admin");
      if (firstAdmin) setEventClubId(firstAdmin.id);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await refresh();
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load hub");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggleClub(club: Club) {
    setBusyId(club.id);
    setError(null);
    try {
      if (club.joined) {
        await apiPost(`/api/clubs/${club.id}/leave`, {}, true);
      } else {
        await apiPost(`/api/clubs/${club.id}/join`, {}, true);
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Club action failed");
    } finally {
      setBusyId(null);
    }
  }

  async function toggleEvent(event: CampusEvent) {
    setBusyId(event.id);
    setError(null);
    try {
      if (event.joined) {
        await apiPost(`/api/events/${event.id}/leave`, {}, true);
      } else {
        await apiPost(`/api/events/${event.id}/join`, {}, true);
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Event action failed");
    } finally {
      setBusyId(null);
    }
  }

  async function onCreateClub(e: FormEvent) {
    e.preventDefault();
    setCreatingClub(true);
    setError(null);
    try {
      await apiPost(
        "/api/clubs",
        { name: clubName.trim(), description: clubDesc.trim() || null },
        true,
      );
      setClubName("");
      setClubDesc("");
      setShowCreateClub(false);
      await refresh();
      setTab("clubs");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create club");
    } finally {
      setCreatingClub(false);
    }
  }

  async function onCreateEvent(e: FormEvent) {
    e.preventDefault();
    setCreatingEvent(true);
    setError(null);
    try {
      await apiPost(
        "/api/events",
        {
          title: eventTitle.trim(),
          description: eventDesc.trim() || null,
          location: eventLoc.trim() || null,
          clubId: eventClubId,
          startsAt: new Date(eventStarts).toISOString(),
        },
        true,
      );
      setEventTitle("");
      setEventDesc("");
      setEventLoc("");
      setShowCreateEvent(false);
      await refresh();
      setTab("events");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create event");
    } finally {
      setCreatingEvent(false);
    }
  }

  const feedEvents = tab === "mine" ? myEvents : events;
  const feedClubs = tab === "mine" ? myClubs : clubs;

  return (
    <AppShell title="Campus board">
      <div className="animate-fade-in">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl sm:text-[1.75rem]">What&apos;s on campus</h1>
            <p className="mt-0.5 text-sm text-muted">
              Packed feed of events and clubs — join in one tap.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-ghost !h-9" onClick={() => setShowCreateClub((v) => !v)}>
              {showCreateClub ? "Close" : "New club"}
            </button>
            <button
              type="button"
              className="btn-join !h-9 !rounded-[var(--radius-sm)] !px-4"
              onClick={() => setShowCreateEvent((v) => !v)}
              disabled={adminClubs.length === 0}
              title={adminClubs.length === 0 ? "Create a club first to host events" : undefined}
            >
              {showCreateEvent ? "Close" : "New event"}
            </button>
          </div>
        </div>

        {error ? (
          <p className="mb-3 text-sm text-[var(--danger)]" role="alert">
            {error}
          </p>
        ) : null}

        {showCreateClub ? (
          <form
            onSubmit={onCreateClub}
            className="mb-4 grid gap-3 rounded-[var(--radius)] border border-border bg-surface p-4 shadow-[var(--shadow-soft)] sm:grid-cols-[1fr_1fr_auto]"
          >
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold">Club name</span>
              <input
                required
                maxLength={80}
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
                className="h-9 rounded-[var(--radius-sm)] border border-border px-3"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold">Description</span>
              <input
                maxLength={500}
                value={clubDesc}
                onChange={(e) => setClubDesc(e.target.value)}
                className="h-9 rounded-[var(--radius-sm)] border border-border px-3"
              />
            </label>
            <button type="submit" disabled={creatingClub} className="btn-join self-end !h-9 !rounded-[var(--radius-sm)]">
              {creatingClub ? "Creating…" : "Create"}
            </button>
          </form>
        ) : null}

        {showCreateEvent ? (
          <form
            onSubmit={onCreateEvent}
            className="mb-4 grid gap-3 rounded-[var(--radius)] border border-border bg-surface p-4 shadow-[var(--shadow-soft)] sm:grid-cols-2 lg:grid-cols-3"
          >
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold">Title</span>
              <input
                required
                maxLength={120}
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                className="h-9 rounded-[var(--radius-sm)] border border-border px-3"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold">Club (admin)</span>
              <select
                required
                value={eventClubId}
                onChange={(e) => setEventClubId(e.target.value)}
                className="h-9 rounded-[var(--radius-sm)] border border-border px-3"
              >
                <option value="" disabled>
                  Select club
                </option>
                {adminClubs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold">Starts</span>
              <input
                type="datetime-local"
                required
                value={eventStarts}
                onChange={(e) => setEventStarts(e.target.value)}
                className="h-9 rounded-[var(--radius-sm)] border border-border px-3"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span className="font-semibold">Description</span>
              <input
                maxLength={800}
                value={eventDesc}
                onChange={(e) => setEventDesc(e.target.value)}
                className="h-9 rounded-[var(--radius-sm)] border border-border px-3"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold">Location</span>
              <input
                maxLength={120}
                value={eventLoc}
                onChange={(e) => setEventLoc(e.target.value)}
                className="h-9 rounded-[var(--radius-sm)] border border-border px-3"
              />
            </label>
            <button
              type="submit"
              disabled={creatingEvent || !eventClubId}
              className="btn-join self-end !h-9 !rounded-[var(--radius-sm)] sm:col-span-2 lg:col-span-3 lg:w-fit"
            >
              {creatingEvent ? "Publishing…" : "Publish event"}
            </button>
          </form>
        ) : null}

        <div className="mb-3 flex gap-1 rounded-[var(--radius-sm)] border border-border bg-surface p-1">
          {(
            [
              ["events", "Events"],
              ["clubs", "Clubs"],
              ["mine", "My stuff"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex-1 rounded-[calc(var(--radius-sm)-2px)] px-3 py-1.5 text-sm font-semibold transition ${
                tab === id
                  ? "bg-accent text-white shadow-sm"
                  : "text-muted hover:bg-accent-soft hover:text-accent"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="py-8 text-sm text-muted">Loading board…</p>
        ) : (
          <>
            {(tab === "events" || tab === "mine") && (
              <section className="mb-5">
                <div className="mb-2 flex items-baseline justify-between gap-2">
                  <h2 className="font-display text-lg">
                    {tab === "mine" ? "My events" : "Upcoming events"}
                  </h2>
                  <span className="text-xs font-medium text-muted">{feedEvents.length} listed</span>
                </div>
                {feedEvents.length === 0 ? (
                  <p className="rounded-[var(--radius)] border border-dashed border-border bg-surface/60 px-4 py-6 text-sm text-muted">
                    {tab === "mine"
                      ? "No RSVPs yet — pick an event from the board."
                      : "No upcoming events. Create a club, then publish one."}
                  </p>
                ) : (
                  <div className="stagger grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {feedEvents.map((ev) => (
                      <EventCard
                        key={ev.id}
                        event={ev}
                        busy={busyId === ev.id}
                        onToggle={toggleEvent}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

            {(tab === "clubs" || tab === "mine") && (
              <section>
                <div className="mb-2 flex items-baseline justify-between gap-2">
                  <h2 className="font-display text-lg">
                    {tab === "mine" ? "My clubs" : "Clubs"}
                  </h2>
                  <span className="text-xs font-medium text-muted">{feedClubs.length} listed</span>
                </div>
                {feedClubs.length === 0 ? (
                  <p className="rounded-[var(--radius)] border border-dashed border-border bg-surface/60 px-4 py-6 text-sm text-muted">
                    {tab === "mine"
                      ? "You have not joined a club yet."
                      : "No clubs yet — be the first to start one."}
                  </p>
                ) : (
                  <div className="stagger flex gap-3 overflow-x-auto pb-2">
                    {feedClubs.map((club) => (
                      <ClubCard
                        key={club.id}
                        club={club}
                        busy={busyId === club.id}
                        onToggle={toggleClub}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

            {tab === "events" && clubs.length > 0 ? (
              <section className="mt-5">
                <h2 className="mb-2 font-display text-lg">Club strip</h2>
                <div className="stagger flex gap-3 overflow-x-auto pb-2">
                  {clubs.slice(0, 8).map((club) => (
                    <ClubCard
                      key={club.id}
                      club={club}
                      busy={busyId === club.id}
                      onToggle={toggleClub}
                    />
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}
      </div>
    </AppShell>
  );
}
