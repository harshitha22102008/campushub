import { Link, NavLink, useNavigate } from "react-router-dom";
import { clearAuth, getStoredUser } from "../lib/auth";

type Props = {
  children: React.ReactNode;
  title?: string;
};

export function AppShell({ children, title }: Props) {
  const navigate = useNavigate();
  const user = getStoredUser();

  function logout() {
    clearAuth();
    navigate("/login", { replace: true });
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `relative pb-1 text-sm font-semibold transition ${
      isActive ? "text-accent" : "text-muted hover:text-ink"
    }`;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-[var(--nav-h)] max-w-[var(--max-w)] items-center gap-4 px-4 sm:px-6">
          <Link to="/home" className="font-display text-lg font-bold tracking-tight text-ink">
            Campus<span className="text-accent">Hub</span>
          </Link>
          <nav className="ml-2 flex items-end gap-4 sm:gap-5">
            <NavLink to="/home" end className={linkClass}>
              {({ isActive }) => (
                <span className="inline-flex flex-col">
                  Board
                  {isActive ? <span className="tab-underline mt-0.5 w-full" /> : null}
                </span>
              )}
            </NavLink>
            <NavLink to="/profile" className={linkClass}>
              {({ isActive }) => (
                <span className="inline-flex flex-col">
                  Profile
                  {isActive ? <span className="tab-underline mt-0.5 w-full" /> : null}
                </span>
              )}
            </NavLink>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden max-w-[10rem] truncate text-xs text-muted sm:inline">
              {user?.name || user?.email}
            </span>
            <button type="button" onClick={logout} className="btn-ghost !h-8 !px-3 !text-xs">
              Sign out
            </button>
          </div>
        </div>
        {title ? (
          <div className="border-t border-border/70 bg-secondary-soft/40">
            <div className="mx-auto max-w-[var(--max-w)] px-4 py-2 sm:px-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
                {title}
              </p>
            </div>
          </div>
        ) : null}
      </header>
      <main className="mx-auto max-w-[var(--max-w)] px-4 py-4 sm:px-6 sm:py-5">{children}</main>
    </div>
  );
}
