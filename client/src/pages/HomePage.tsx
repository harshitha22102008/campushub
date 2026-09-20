import { Link } from "react-router-dom";
import { isLoggedIn } from "../lib/auth";

const previewEvents = [
  { club: "Coding Club", title: "Hack night: APIs", when: "Fri 6pm · Lab 3", going: 28 },
  { club: "Drama Society", title: "Open mic auditions", when: "Sat 3pm · Auditorium", going: 41 },
  { club: "Robotics", title: "Bot showcase", when: "Mon 5pm · Maker space", going: 19 },
  { club: "Photography", title: "Golden hour walk", when: "Sun 5:30pm · Quad", going: 33 },
  { club: "Debate Union", title: "Motion night", when: "Thu 7pm · Room B2", going: 22 },
  { club: "Music Circle", title: "Jam session", when: "Wed 8pm · Music hall", going: 37 },
];

export function HomePage() {
  const loggedIn = isLoggedIn();

  return (
    <div className="min-h-screen">
      <header className="hero-band relative">
        <div className="relative z-[1] mx-auto flex max-w-[var(--max-w)] flex-col gap-4 px-4 py-8 sm:px-6 sm:py-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="animate-fade-in max-w-xl">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-rose-200">
              CampusHub
            </p>
            <h1 className="font-display text-[var(--text-hero)] font-extrabold text-white">
              The board where campus actually happens
            </h1>
            <p className="mt-2 max-w-md text-sm text-sky-100/90 sm:text-base">
              Packed event grid. Clubs you can join in a tap. No empty hero — jump straight into the feed.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {loggedIn ? (
                <Link to="/home" className="btn-join !h-10 !rounded-[var(--radius-sm)] !px-5">
                  Open board
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn-join !h-10 !rounded-[var(--radius-sm)] !px-5">
                    Join CampusHub
                  </Link>
                  <Link to="/login" className="btn-ghost !h-10 !border-white/30 !bg-white/10 !text-white hover:!bg-white/20">
                    Sign in
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="grid w-full max-w-md grid-cols-2 gap-2 sm:max-w-lg lg:w-[22rem]">
            {previewEvents.slice(0, 4).map((ev, i) => (
              <div
                key={ev.title}
                className="rounded-[var(--radius)] border border-white/15 bg-white/10 p-2.5 backdrop-blur-sm"
                style={{ animation: `fade-up 0.4s var(--ease) ${0.08 * i}s both` }}
              >
                <p className="text-[0.65rem] font-bold uppercase tracking-wide text-rose-200">
                  {ev.club}
                </p>
                <p className="font-display text-sm font-bold text-white">{ev.title}</p>
                <p className="mt-1 text-[0.7rem] text-sky-100/80">{ev.when}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[var(--max-w)] px-4 py-6 sm:px-6">
        <div className="mb-3 flex items-end justify-between gap-2">
          <h2 className="font-display text-xl">This week on the board</h2>
          <span className="text-xs font-semibold text-secondary">{previewEvents.length} events</span>
        </div>
        <div className="stagger grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {previewEvents.map((ev) => (
            <article key={ev.title} className="hub-card p-3.5">
              <span className="rounded-full bg-secondary-soft px-2 py-0.5 text-[0.7rem] font-semibold text-secondary">
                {ev.club}
              </span>
              <h3 className="mt-2 font-display text-base">{ev.title}</h3>
              <div className="mt-3 flex items-center justify-between gap-2">
                <p className="text-xs text-muted">{ev.when}</p>
                <span className="text-xs font-semibold text-accent">{ev.going} going</span>
              </div>
            </article>
          ))}
        </div>
        {!loggedIn ? (
          <p className="mt-5 text-center text-sm text-muted">
            Preview only —{" "}
            <Link to="/register" className="font-semibold text-accent underline-offset-2 hover:underline">
              create an account
            </Link>{" "}
            to RSVP and join clubs.
          </p>
        ) : null}
      </section>
    </div>
  );
}
