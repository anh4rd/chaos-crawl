import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, Circle, Clock3, Flag, Gamepad2, LoaderCircle, RotateCcw, Users } from "lucide-react";
import { supabase } from "../lib/supabase";
import "../styles/SessionGame.css";

type SessionStatus = "lobby" | "live" | "completed";
interface SessionInfo {
  id: string;
  name: string;
  venue_name: string | null;
  join_code: string;
  status: SessionStatus;
  current_round_number: number;
  round_count: number;
  teams_enabled: boolean;
  host_chooses_teams: boolean;
  team_size: number;
  player_limit: number;
}
interface SessionPlayerInfo {
  id: string;
  name: string;
  avatar_url: string | null;
  score: number;
  team_id: string | null;
  team_name: string | null;
}
interface TeamInfo { id: string; name: string; member_count: number; }
interface ChallengeInfo {
  id: string;
  kind: "main" | "side";
  round_number?: number | null;
  title: string;
  description: string;
  points: number;
  duration_minutes: number;
  allow_photo_upload: boolean;
  submission_status: "submitted" | "approved" | "rejected" | null;
  awarded_points: number;
}
interface SessionView {
  session: SessionInfo;
  player: SessionPlayerInfo;
  teams: TeamInfo[];
  challenge: ChallengeInfo | null;
  side_challenges: ChallengeInfo[];
  my_submissions: Array<{ challenge_id: string; status: "submitted" | "approved" | "rejected"; awarded_points: number }>;
}
function playerStorageKey(code: string) {
  return `chaos-crawl-session-player:${code.replace(/\D/g, "")}`;
}

export default function SessionPlayerGame() {
  const { joinCode = "" } = useParams();
  const navigate = useNavigate();
  const code = joinCode.replace(/\D/g, "").slice(0, 6);
  const [token, setToken] = useState(() => localStorage.getItem(playerStorageKey(code)));
  const [view, setView] = useState<SessionView | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [teamName, setTeamName] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem(playerStorageKey(code)));
  }, [code]);

  const loadView = useCallback(async () => {
    if (!code || !token) {
      setLoading(false);
      return;
    }
    const { data, error: viewError } = await supabase.rpc("cc_get_game_session_view", {
      p_join_code: code,
      p_player_token: token,
    });
    if (viewError) {
      setError(viewError.message);
      setLoading(false);
      return;
    }
    if (data) {
      setView(data as SessionView);
      setLastUpdated(new Date());
      setError("");
    }
    setLoading(false);
  }, [code, token]);

  useEffect(() => {
    let mounted = true;
    const refresh = async () => { if (mounted) await loadView(); };
    void refresh();
    const id = window.setInterval(() => { if (mounted) void loadView(); }, 3000);
    return () => { mounted = false; window.clearInterval(id); };
  }, [loadView]);

  const currentSubmission = useMemo(() => {
    if (!view?.challenge) return null;
    return view.my_submissions.find((item) => item.challenge_id === view.challenge?.id) ?? null;
  }, [view]);

  async function chooseTeam(teamId: string) {
    if (!token || !code) return;
    setBusyKey(`team:${teamId}`);
    setError("");
    const { error: chooseError } = await supabase.rpc("cc_player_choose_session_team", {
      p_join_code: code,
      p_player_token: token,
      p_team_id: teamId,
    });
    setBusyKey(null);
    if (chooseError) { setError(chooseError.message); return; }
    await loadView();
  }

  async function createTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !code || !teamName.trim()) return;
    setBusyKey("create-team");
    setError("");
    const { error: createError } = await supabase.rpc("cc_player_create_session_team", {
      p_join_code: code,
      p_player_token: token,
      p_team_name: teamName.trim(),
    });
    setBusyKey(null);
    if (createError) { setError(createError.message); return; }
    setTeamName("");
    await loadView();
  }

  async function submitChallenge(challenge: ChallengeInfo) {
    if (!token || !code) return;
    setBusyKey(challenge.id);
    setError("");
    const { error: submitError } = await supabase.rpc("cc_player_submit_session_challenge", {
      p_join_code: code,
      p_player_token: token,
      p_challenge_id: challenge.id,
    });
    setBusyKey(null);
    if (submitError) { setError(submitError.message); return; }
    await loadView();
  }

  if (!token) {
    return <main className="cc-player-auth"><section className="cc-player-auth-card">
      <h1>Rejoin the chaos</h1><p>Enter the game code and the mobile number you used to join.</p>
      <Link className="cc-player-primary-button" to={`/join?code=${code}&returning=1`}>Rejoin game</Link>
    </section></main>;
  }

  if (loading && !view) {
    return <main className="cc-session-player-app"><div className="cc-player-loading"><LoaderCircle className="cc-spin" size={26}/> Loading your game…</div></main>;
  }

  if (!view) {
    return <main className="cc-player-auth"><section className="cc-player-auth-card">
      <div className="cc-player-mascot">?</div><h1>We lost your place.</h1>
      <p>{error || "Your saved player session could not be found."}</p>
      <Link className="cc-player-primary-button" to={`/join?code=${code}&returning=1`}>Rejoin with mobile number</Link>
    </section></main>;
  }

  const { session, player, teams, challenge, side_challenges: sideChallenges } = view;
  const teamSelectionAllowed = session.teams_enabled && !session.host_chooses_teams && (session.status === "lobby" || (session.status === "live" && !player.team_id));

  return (
    <main className="cc-session-player-app">
      <header className="cc-player-game-header">
        <Link to="/join" className="cc-player-brand"><span className="cc-player-brand-icon"><Gamepad2 size={21}/></span><span>CHAOS<span>CRAWL</span></span></Link>
        <div className="cc-player-code-pill">GAME {session.join_code}</div>
      </header>

      <div className="cc-player-game-content">
        <section className="cc-player-profile">
          <div className="cc-player-avatar-large">{player.name.slice(0, 1).toUpperCase()}</div>
          <div className="cc-player-profile-copy"><span className="cc-player-eyebrow">PLAYER</span><h1>{player.name}</h1><p>{player.team_name || (session.teams_enabled ? "Choose your team" : "Solo player")}</p></div>
          <div className="cc-player-score"><strong>{player.score}</strong><span>POINTS</span></div>
        </section>

        {error && <div className="cc-player-error" role="alert">{error}</div>}

        {session.status === "lobby" && (
          <section className="cc-player-state-card">
            <div className="cc-player-state-icon"><Users size={25}/></div>
            <span className="cc-player-eyebrow">YOU'RE IN</span>
            <h2>Waiting for the host…</h2>
            <p>You're in <strong>{session.name}</strong>. The host will start the game when everyone is ready.</p>
            <div className="cc-player-lobby-count">{teams.reduce((sum, team) => sum + team.member_count, 0)} players in teams · {session.player_limit} player limit</div>
          </section>
        )}

        {session.status === "completed" && (
          <section className="cc-player-state-card">
            <div className="cc-player-state-icon"><Flag size={25}/></div>
            <span className="cc-player-eyebrow">THAT'S A WRAP</span>
            <h2>Game over. Chaos achieved.</h2>
            <p>You finished with <strong>{player.score} points</strong>. Thanks for playing!</p>
          </section>
        )}

        {session.teams_enabled && session.host_chooses_teams && !player.team_id && session.status !== "completed" && (
          <section className="cc-player-state-card">
            <div className="cc-player-state-icon"><Users size={25}/></div>
            <h2>The host is sorting teams.</h2>
            <p>Your team will appear here as soon as you're assigned.</p>
          </section>
        )}

        {teamSelectionAllowed && (
          <section className="cc-player-team-card">
            <div className="cc-player-section-heading"><div><span className="cc-player-eyebrow">SQUAD UP</span><h2>Choose your team</h2></div><span className="cc-player-count-chip">{session.team_size} max</span></div>
            <div className="cc-player-team-options">
              {teams.map((team) => {
                const full = team.member_count >= session.team_size && player.team_id !== team.id;
                return <button type="button" key={team.id} disabled={busyKey !== null || full} className={`cc-player-team-option${player.team_id === team.id ? " is-current" : ""}`} onClick={() => void chooseTeam(team.id)}>
                  <span className="cc-player-team-dot">{team.name.slice(0, 1).toUpperCase()}</span>
                  <span><strong>{team.name}</strong><small>{full ? "Team full" : `${team.member_count}/${session.team_size} players`}</small></span>
                  {player.team_id === team.id && <CheckCircle2 size={19}/>}
                </button>;
              })}
              <form className="cc-player-create-team" onSubmit={(event) => void createTeam(event)}>
                <input value={teamName} onChange={(event) => setTeamName(event.target.value)} placeholder="Or name a new team…" aria-label="New team name" maxLength={40}/>
                <button type="submit" disabled={busyKey !== null || !teamName.trim()}>{busyKey === "create-team" ? <LoaderCircle size={17} className="cc-spin"/> : "Create team"}</button>
              </form>
            </div>
          </section>
        )}

        {session.status === "live" && (
          <>
            <section className="cc-player-live-label"><span className="cc-player-live-dot"/> GAME LIVE <span>ROUND {session.current_round_number} OF {session.round_count}</span></section>
            {challenge ? (
              <section className="cc-player-challenge-card">
                <div className="cc-player-challenge-top"><span className="cc-player-eyebrow">YOUR CHALLENGE</span><span className="cc-player-points">+{challenge.points} POINTS</span></div>
                <h2>{challenge.title}</h2>
                <p>{challenge.description}</p>
                <div className="cc-player-challenge-meta"><span><Clock3 size={16}/> {challenge.duration_minutes} min</span>{challenge.allow_photo_upload && <span>Evidence may be requested by the host</span>}</div>
                {currentSubmission?.status === "approved" ? (
                  <div className="cc-player-submission-state is-approved"><CheckCircle2 size={19}/> Approved · +{currentSubmission.awarded_points} points</div>
                ) : currentSubmission?.status === "submitted" ? (
                  <div className="cc-player-submission-state"><CheckCircle2 size={19}/> Submitted · waiting for host review</div>
                ) : (
                  <button type="button" className="cc-player-primary-button" disabled={busyKey !== null || !player.team_id && session.teams_enabled} onClick={() => void submitChallenge(challenge)}>
                    {busyKey === challenge.id ? <LoaderCircle size={19} className="cc-spin"/> : <CheckCircle2 size={19}/>} Mark challenge complete
                  </button>
                )}
                {session.teams_enabled && !player.team_id && <p className="cc-player-hint">Wait for the host to assign your team before submitting.</p>}
              </section>
            ) : <section className="cc-player-state-card"><h2>Challenge not ready yet</h2><p>Ask the host to select a round.</p></section>}

            {sideChallenges.length > 0 && (
              <section className="cc-player-side-section">
                <div className="cc-player-section-heading"><div><span className="cc-player-eyebrow">EXTRA CHAOS</span><h2>Side challenges</h2></div><span className="cc-player-count-chip">{sideChallenges.length}</span></div>
                {sideChallenges.map((item) => {
                  const submitted = view.my_submissions.find((sub) => sub.challenge_id === item.id);
                  return <article className="cc-player-side-card" key={item.id}>
                    <div><h3>{item.title}</h3><p>{item.description}</p><span className="cc-player-points">+{item.points} pts</span></div>
                    {submitted?.status === "approved" ? <span className="cc-player-submission-state is-approved"><CheckCircle2 size={16}/> +{submitted.awarded_points}</span>
                      : submitted?.status === "submitted" ? <span className="cc-player-small-status">Submitted</span>
                      : <button type="button" className="cc-player-small-button" disabled={busyKey !== null} onClick={() => void submitChallenge(item)}>{busyKey === item.id ? <LoaderCircle size={16} className="cc-spin"/> : <Circle size={16}/>} Done</button>}
                  </article>;
                })}
              </section>
            )}
          </>
        )}

        {session.teams_enabled && (
          <section className="cc-player-team-roster">
            <div className="cc-player-section-heading"><div><span className="cc-player-eyebrow">THE OTHER CHAOS MERCHANTS</span><h2>Teams</h2></div><span className="cc-player-count-chip">{teams.length}</span></div>
            {teams.length ? teams.map((team) => <div key={team.id} className="cc-player-roster-row"><span className="cc-player-team-dot">{team.name.slice(0,1).toUpperCase()}</span><strong>{team.name}</strong><span>{team.member_count}/{session.team_size}</span>{player.team_id === team.id && <small>You</small>}</div>) : <p>No teams yet. Be the first to create one.</p>}
          </section>
        )}
        <div className="cc-player-sync-note"><span className="cc-player-live-dot"/> Live updates enabled {lastUpdated && <span>· synced {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>}</div>
        <button type="button" className="cc-player-text-button" onClick={() => navigate(`/join?code=${code}&returning=1`)}><RotateCcw size={15}/> Need to rejoin on this device?</button>
      </div>
    </main>
  );
}
