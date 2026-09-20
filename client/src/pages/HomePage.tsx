export function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-[68rem] flex-col justify-center px-6 py-12 animate-fade-in">
      <p className="mb-3 text-sm font-medium tracking-wide text-accent">
        CampusHub
      </p>
      <h1 className="font-display text-3xl sm:text-[2.25rem]">
        Clubs and events, in one place
      </h1>
      <p className="mt-4 max-w-xl text-lg text-muted">
        Discover campus clubs, join communities, and sign up for events — built
        for students who want a clear hub without the noise.
      </p>
      <p className="mt-8 text-sm text-muted">
        Scaffold ready. Auth and clubs come next. API health:{" "}
        <code className="rounded bg-accent-soft px-1.5 py-0.5 text-accent">
          GET /api/health
        </code>
      </p>
    </main>
  );
}
