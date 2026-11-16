import { Check, Copy, Star, Trophy } from "lucide-react";
import { Link } from "react-router-dom";

interface ProfileProps {
  viewerRole: "player" | "host";
  name: string;
  subtitle: string;
  avatarUrl?: string | null;
  score: number;
  rank: number | null;
  badge?: string;
}

interface GameTitleProps {
  name: string;
  code: string;
  photoUrl?: string | null;
  copied?: boolean;
  onCopy: () => void;
}

export function SessionPlayerProfile({ viewerRole, name, subtitle, avatarUrl, score, rank, badge }: ProfileProps) {
  return <header className="cc-player-game-header" data-viewer-role={viewerRole}>
    <section className="cc-player-profile" data-tour="player-profile">
      <div className="cc-player-avatar-large">{avatarUrl ? <img src={avatarUrl} alt=""/> : name.slice(0, 1).toUpperCase()}</div>
      <div className="cc-player-profile-copy"><h1>{name}</h1><p>{subtitle}{badge ? ` · ${badge}` : ""}</p></div>
      {viewerRole === "host" && <Link className="cc-host-mobile-hub-link" to="/host">Host Hub ↗</Link>}
      <div className="cc-player-score"><span className="cc-player-score-points"><Star size={18} fill="currentColor"/><strong>{score}</strong></span><span className="cc-player-score-rank"><Trophy size={17} fill="currentColor"/> #{rank ?? "—"}</span></div>
    </section>
  </header>;
}

export function SessionGameTitlebar({ name, code, photoUrl, copied = false, onCopy }: GameTitleProps) {
  return <section className="cc-player-game-titlebar" aria-label="Game details">
    <div className="cc-player-game-icon">{photoUrl ? <img src={photoUrl} alt={`${name} game art`}/> : <span aria-hidden="true">🎉</span>}</div>
    <div className="cc-player-game-name"><strong>{name}</strong><small>GAME</small></div>
    <div className="cc-player-game-code"><span><small>GAME CODE</small><strong>{code}</strong></span><button type="button" onClick={onCopy} aria-label="Copy game code" title="Copy game code">{copied ? <Check size={19}/> : <Copy size={19}/>}</button></div>
  </section>;
}
