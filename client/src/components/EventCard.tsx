import type { CampusEvent } from "../lib/types";

type Props = {
  event: CampusEvent;
  busy?: boolean;
  onToggle: (event: CampusEvent) => void;
  style?: React.CSSProperties;
};

function formatWhen(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function EventCard({ event, busy, onToggle, style }: Props) {
  return (
    <article className="hub-card flex flex-col gap-2.5 p-3.5" style={style}>
      <div className="flex items-start justify-between gap-2">
        <span className="rounded-full bg-secondary-soft px-2 py-0.5 text-[0.7rem] font-semibold text-secondary">
          {event.clubName}
        </span>
        <span className="text-[0.7rem] font-medium text-muted">{event.joinCount} going</span>
      </div>
      <h3 className="font-display text-base leading-snug">{event.title}</h3>
      {event.description ? (
        <p className="line-clamp-2 text-sm text-muted">{event.description}</p>
      ) : null}
      <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-1">
        <div className="min-w-0 text-xs text-muted">
          <p className="font-medium text-ink">{formatWhen(event.startsAt)}</p>
          {event.location ? <p className="truncate">{event.location}</p> : null}
        </div>
        {event.joined ? (
          <button
            type="button"
            className="btn-joined"
            disabled={busy}
            onClick={() => onToggle(event)}
          >
            Going
          </button>
        ) : (
          <button
            type="button"
            className="btn-join"
            disabled={busy}
            onClick={() => onToggle(event)}
          >
            RSVP
          </button>
        )}
      </div>
    </article>
  );
}
