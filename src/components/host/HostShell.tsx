import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Compass,
  Gamepad2,
  Heart,
  Home,
  LogOut,
  Plus,
  Sparkles,
  CircleHelp,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";
import "../../styles/HostTheme.css";

interface HostShellProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  showCreate?: boolean;
  previewUser?: { id: string; displayName: string; email: string };
  readOnlyPreview?: boolean;
  contextPanel?: ReactNode;
  sidebar?: ReactNode;
}

export default function HostShell({
  children,
  title,
  subtitle,
  showCreate = true,
  previewUser,
  readOnlyPreview = false,
  contextPanel,
  sidebar,
}: HostShellProps) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let alive = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (alive) setUser(data.user);
    });
    return () => {
      alive = false;
    };
  }, []);

  const displayName = String(
    previewUser?.displayName ??
      user?.user_metadata?.display_name ??
      user?.email?.split("@")[0] ??
      "Host",
  );
  const homeHref = previewUser
    ? `/host?viewAs=${encodeURIComponent(previewUser.id)}`
    : "/host";
  async function signOut() {
    await supabase.auth.signOut();
    navigate("/host/login", { replace: true });
  }

  return (
    <div className="host-portal host-app">
      <header className="host-app-header">
        <Link className="host-brand" to={homeHref}>
          <span className="host-brand-mark">
            <Sparkles size={21} />
          </span>
          <span>
            CHAOS<span className="host-brand-accent">CRAWL</span>
          </span>
        </Link>
        <nav className="host-top-nav" aria-label="Main navigation">
          <NavLink
            to="/host/games/new"
            className={({ isActive }) =>
              `host-top-link${isActive ? " is-active" : ""}`
            }
          >
            <Plus size={17} /> Plan game
          </NavLink>
          <NavLink
            to="/host/games"
            className={({ isActive }) =>
              `host-top-link${isActive ? " is-active" : ""}`
            }
          >
            <Gamepad2 size={17} /> My games
          </NavLink>
          <NavLink
            to="/host/explore"
            className={({ isActive }) =>
              `host-top-link${isActive ? " is-active" : ""}`
            }
          >
            <Compass size={17} /> Explore
          </NavLink>
          <NavLink
            to="/host/saved"
            className={({ isActive }) =>
              `host-top-link${isActive ? " is-active" : ""}`
            }
          >
            <Heart size={17} /> Saved
          </NavLink>
        </nav>
        <div className="host-header-right">
          <CircleHelp size={21} className="host-header-help" />
          <div className="host-user-chip">
            <span className="host-user-avatar">
              {displayName.slice(0, 1).toUpperCase()}
            </span>
            <span>{displayName}</span>
            {readOnlyPreview && <small>PREVIEW</small>}
          </div>
          {!readOnlyPreview && (
            <button
              type="button"
              className="host-icon-button"
              aria-label="Sign out"
              title="Sign out"
              onClick={() => void signOut()}
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </header>

      <div
        className={`host-app-layout${sidebar ? " host-app-layout--setup-sidebar" : " host-app-layout--no-sidebar"}${contextPanel ? "" : " host-app-layout--no-context"}`}
      >
        <img
          className="host-mascot-decoration"
          src={`${import.meta.env.BASE_URL}${encodeURIComponent("Mischievous Chaos Monster Logo.png")}`}
          alt=""
          aria-hidden="true"
        />
        {sidebar && (
          <aside className="host-sidebar host-sidebar--setup">{sidebar}</aside>
        )}

        <main className="host-main">
          {(title || subtitle || showCreate) && (
            <div className="host-page-heading">
              <div>
                {title && <h1>{title}</h1>}
                {subtitle && <p>{subtitle}</p>}
              </div>
              {showCreate && (
                <button
                  className="host-button host-button--primary"
                  onClick={() => navigate("/host/games/new")}
                  type="button"
                >
                  <Plus size={18} /> Create new game
                </button>
              )}
            </div>
          )}
          {children}
        </main>
        {contextPanel && (
          <aside className="host-context-rail">{contextPanel}</aside>
        )}
      </div>

      {!readOnlyPreview && (
        <nav className="host-mobile-nav" aria-label="Host navigation">
          <NavLink to="/host" end>
            <Home size={18} />
            <span>Home</span>
          </NavLink>
          <NavLink to="/host/games">
            <Gamepad2 size={18} />
            <span>Games</span>
          </NavLink>
          <NavLink to="/host/explore">
            <Compass size={18} />
            <span>Explore</span>
          </NavLink>
          <NavLink to="/host/saved">
            <Heart size={18} />
            <span>Saved</span>
          </NavLink>
        </nav>
      )}
    </div>
  );
}
