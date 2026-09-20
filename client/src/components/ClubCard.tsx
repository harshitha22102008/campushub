import type { Club } from "../lib/types";

type Props = {
  club: Club;
  busy?: boolean;
  onToggle: (club: Club) => void;
  style?: React.CSSProperties;
};

export function ClubCard({ club, busy, onToggle, style }: Props) {
  return (
    <article
      className="hub-card flex min-w-[11.5rem] max-w-[14rem] shrink-0 flex-col gap-2 p-3"
      style={style}
    >
      <div className="flex items-center gap-2">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft font-display text-sm font-bold text-accent"
          aria-hidden
        >
          {club.name.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0">
          <h3 className="truncate font-display text-sm font-bold">{club.name}</h3>
          <p className="text-[0.7rem] text-muted">
            {club.memberCount} members · {club.eventCount} events
          </p>
        </div>
      </div>
      {club.description ? (
        <p className="line-clamp-2 text-xs text-muted">{club.description}</p>
      ) : (
        <p className="text-xs text-muted">Campus club</p>
      )}
      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        {club.role === "admin" ? (
          <span className="rounded-full bg-secondary-soft px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-secondary">
            Admin
          </span>
        ) : (
          <span />
        )}
        {club.joined ? (
          <button
            type="button"
            className={`btn-joined ${busy ? "" : ""}`}
            disabled={busy || club.role === "admin"}
            title={club.role === "admin" ? "Sole admins stay with the club" : "Leave club"}
            onClick={() => onToggle(club)}
          >
            Joined
          </button>
        ) : (
          <button
            type="button"
            className="btn-join"
            disabled={busy}
            onClick={() => onToggle(club)}
          >
            Join
          </button>
        )}
      </div>
    </article>
  );
}
