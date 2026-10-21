import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Bell, BookOpen, Compass, Gamepad2, Heart, Home, LogOut, Plus, Sparkles } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";

interface HostShellProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  showCreate?: boolean;
}

export default function HostShell({ children, title, subtitle, showCreate = true }: HostShellProps) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let alive = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (alive) setUser(data.user);
    });
    return () => { alive = false; };
  }, []);

  const displayName = String(user?.user_metadata?.display_name ?? user?.email?.split("@")[0] ?? "Host");
  async function signOut() {
    await supabase.auth.signOut();
    navigate("/host/login", { replace: true });
  }

  return (
    <div className="host-portal host-app">
      <header className="host-app-header">
        <Link className="host-brand" to="/host">
          <span className="host-brand-mark"><Sparkles size={21} /></span>
          <span>CHAOS<span className="host-brand-accent">CRAWL</span></span>
        </Link>
        <div className="host-header-right">
          <div className="host-user-chip"><span className="host-user-avatar">{displayName.slice(0, 1).toUpperCase()}</span><span>{displayName}</span></div>
          <button type="button" className="host-icon-button" aria-label="Sign out" title="Sign out" onClick={() => void signOut()}><LogOut size={18} /></button>
        </div>
      </header>

      <div className="host-app-layout">
        <aside className="host-sidebar">
          <div className="host-sidebar-label">YOUR SPACE</div>
          <NavLink to="/host" end className={({ isActive }) => `host-nav-link${isActive ? " is-active" : ""}`}><Home size={18} /> Home</NavLink>
          <NavLink to="/host/games" className={({ isActive }) => `host-nav-link${isActive ? " is-active" : ""}`}><Gamepad2 size={18} /> Your games</NavLink>
          <NavLink to="/host/explore" className={({ isActive }) => `host-nav-link${isActive ? " is-active" : ""}`}><Compass size={18} /> Explore library</NavLink>
          <NavLink to="/host/saved" className={({ isActive }) => `host-nav-link${isActive ? " is-active" : ""}`}><Heart size={18} /> Saved</NavLink>
          <div className="host-sidebar-divider" />
          <div className="host-sidebar-note">
            <span className="host-mini-icon"><BookOpen size={17} /></span>
            <strong>Need inspiration?</strong>
            <p>Pick a vibe and we'll help you turn it into a game plan.</p>
            <button className="host-text-button" type="button" onClick={() => navigate("/host/games/new")}>Plan a game <span>→</span></button>
          </div>
          <button className="host-nav-link host-nav-link--quiet" type="button" onClick={() => window.location.assign("mailto:hello@chaoscrawl.app")}><Bell size={18} /> Help & feedback</button>
        </aside>

        <main className="host-main">
          {(title || subtitle || showCreate) && (
            <div className="host-page-heading">
              <div>
                {title && <h1>{title}</h1>}
                {subtitle && <p>{subtitle}</p>}
              </div>
              {showCreate && <button className="host-button host-button--primary" onClick={() => navigate("/host/games/new")} type="button"><Plus size={18} /> Create new game</button>}
            </div>
          )}
          {children}
        </main>
      </div>

      <nav className="host-mobile-nav" aria-label="Host navigation">
        <NavLink to="/host" end><Home size={18} /><span>Home</span></NavLink>
        <NavLink to="/host/games"><Gamepad2 size={18} /><span>Games</span></NavLink>
        <NavLink to="/host/explore"><Compass size={18} /><span>Explore</span></NavLink>
        <NavLink to="/host/saved"><Heart size={18} /><span>Saved</span></NavLink>
      </nav>
    </div>
  );
}
