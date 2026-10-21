import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, Circle, Clock3, Flag, Gamepad2, LoaderCircle, RotateCcw, Trophy, ClipboardList, Users, Crown } from "lucide-react";
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
interface LeaderboardEntry { player_id: string; name: string; score: number; team_id: string | null; team_name: string | null; }
type PlayerPage = "game" | "leaderboard" | "side-challenges";
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
interface SecretMission {
  assignment_id: string;
  challenge_id: string;
  title: string;
  description: string;
  points: number;
  duration_minutes: number;
  status: "sent" | "submitted" | "approved" | "rejected";
  scheduled_at: string;
  sent_at: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  awarded_points: number;
}
function playerStorageKey(code: string) {
  return `chaos-crawl-session-player:${code.replace(/\D/g, "")}`;
}

export default function SessionPlayerGame() {
  const { joinCode = "", page: pageParam } = useParams();
  const navigate = useNavigate();
  const activePage: PlayerPage = pageParam === "leaderboard" || pageParam === "side-challenges" ? pageParam : "game";
  const code = joinCode.replace(/\D/g, "").slice(0, 6);
  const [token, setToken] = useState(() => localStorage.getItem(playerStorageKey(code)));
  const [view, setView] = useState<SessionView | null>(null);
  const [secretMissions, setSecretMissions] = useState<SecretMission[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
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
    let nextError = "";
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
    }

    const { data: missionData, error: missionError } = await supabase.rpc("cc_get_player_secret_missions", {
      p_join_code: code,
      p_player_token: token,
    });
    if (missionError) {
      nextError = `Your game loaded, but secret missions couldn't refresh: ${missionError.message}`;
    } else {
      setSecretMissions((missionData ?? []) as SecretMission[]);
    }

    if (activePage === "leaderboard") {
      const { data: leaderboardData, error: leaderboardError } = await supabase.rpc("cc_get_player_session_leaderboard", {
        p_join_code: code,
        p_player_token: token,
      });
      if (leaderboardError) {
        nextError = nextError || `The leaderboard couldn't refresh: ${leaderboardError.message}`;
      } else {
        setLeaderboard((leaderboardData ?? []) as LeaderboardEntry[]);
      }
    }

    setError(nextError);
    setLoading(false);
  }, [activePage, code, token]);

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

  async function submitSecretMission(mission: SecretMission) {
    if (!token || !code) return;
    setBusyKey(mission.assignment_id);
    setError("");
    const { error: submitError } = await supabase.rpc("cc_player_submit_secret_mission", {
      p_join_code: code,
      p_player_token: token,
      p_assignment_id: mission.assignment_id,
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
  const teamLeaderboard = teams
    .map((team) => ({
      ...team,
      score: leaderboard.filter((entry) => entry.team_id === team.id).reduce((total, entry) => total + entry.score, 0),
    }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

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

        <nav className="cc-player-page-nav" aria-label="Game pages">
          <Link to={`/play/${code}/game`} className={`cc-player-page-tab${activePage === "game" ? " is-active" : ""}`} aria-current={activePage === "game" ? "page" : undefined}>
            <Gamepad2 size={17}/><span>Game</span>
          </Link>
          <Link to={`/play/${code}/leaderboard`} className={`cc-player-page-tab${activePage === "leaderboard" ? " is-active" : ""}`} aria-current={activePage === "leaderboard" ? "page" : undefined}>
            <Trophy size={17}/><span>Leaderboard</span>
          </Link>
          <Link to={`/play/${code}/side-challenges`} className={`cc-player-page-tab${activePage === "side-challenges" ? " is-active" : ""}`} aria-current={activePage === "side-challenges" ? "page" : undefined}>
            <ClipboardList size={17}/><span>Side challenges</span>{sideChallenges.length > 0 && <span className="cc-player-nav-count">{sideChallenges.length}</span>}
          </Link>
        </nav>

        {error && <div className="cc-player-error" role="alert">{error}</div>}

        {activePage === "game" && (
          <>
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
                <Link className="cc-player-inline-link" to={`/play/${code}/leaderboard`}>See the final leaderboard →</Link>
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
                {secretMissions.length > 0 && (
                  <section className="cc-player-secret-section" aria-label="Your private secret missions">
                    <div className="cc-player-secret-heading"><span className="cc-player-secret-icon">✦</span><div><span className="cc-player-eyebrow">JUST FOR YOU</span><h2>Your secret mission{secretMissions.length === 1 ? "" : "s"}</h2></div><span className="cc-player-secret-badge">PRIVATE</span></div>
                    <p className="cc-player-secret-intro">These missions were sent to you by the host. Keep them under wraps.</p>
                    <div className="cc-player-secret-list">
                      {secretMissions.map((mission) => (
                        <article className="cc-player-secret-card" key={mission.assignment_id}>
                          <div className="cc-player-secret-card-top"><span className="cc-player-secret-label">SECRET TASK</span><span className="cc-player-points">+{mission.points} pts</span></div>
                          <h3>{mission.title}</h3>
                          <p>{mission.description}</p>
                          <div className={`cc-player-secret-status cc-player-secret-status--${mission.status}`}>
                            {mission.status === "sent" ? "Mission received — go do your thing"
                              : mission.status === "submitted" ? "Marked complete · waiting for host review"
                              : mission.status === "approved" ? `Mission approved · +${mission.awarded_points} points`
                              : "The host asked you to try again"}
                          </div>
                          {(mission.status === "sent" || mission.status === "rejected") && (
                            <button type="button" className="cc-player-primary-button cc-player-secret-complete" disabled={busyKey !== null} onClick={() => void submitSecretMission(mission)}>
                              {busyKey === mission.assignment_id ? <LoaderCircle className="cc-spin" size={18}/> : <CheckCircle2 size={18}/>} {mission.status === "rejected" ? "Try again — I've done it" : "I've completed my mission"}
                            </button>
                          )}
                        </article>
                      ))}
                    </div>
                  </section>
                )}
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
              </>
            )}
          </>
        )}

        {activePage === "leaderboard" && (
          <section className="cc-player-leaderboard-page">
            <div className="cc-player-page-heading"><div><span className="cc-player-eyebrow">THE RACE IS ON</span><h2>{session.status === "completed" ? "Final leaderboard" : "Leaderboard"}</h2><p>Scores update automatically as the host approves challenges.</p></div><span className="cc-player-count-chip">{leaderboard.length} players</span></div>
            {session.status === "lobby" && <div className="cc-player-page-notice">The leaderboard will start moving when the host starts the game.</div>}
            {leaderboard.length === 0 ? <div className="cc-player-state-card"><h2>No players yet</h2><p>Once players join, their scores will appear here.</p></div> : (
              <div className="cc-player-leaderboard-list">
                {leaderboard.map((entry, index) => (
                  <article key={entry.player_id} className={`cc-player-rank-row${entry.player_id === player.id ? " is-you" : ""}`}>
                    <div className={`cc-player-rank-number${index < 3 ? ` is-top rank-${index + 1}` : ""}`}>{index === 0 ? <Crown size={17}/> : index + 1}</div>
                    <div className="cc-player-rank-avatar">{entry.name.slice(0, 1).toUpperCase()}</div>
                    <div className="cc-player-rank-copy"><strong>{entry.name}{entry.player_id === player.id && <span className="cc-player-you-chip">YOU</span>}</strong><span>{entry.team_name || "Solo player"}</span></div>
                    <div className="cc-player-rank-score"><strong>{entry.score}</strong><span>PTS</span></div>
                  </article>
                ))}
              </div>
            )}

            {session.teams_enabled && (
              <div className="cc-player-team-leaderboard">
                <div className="cc-player-section-heading"><div><span className="cc-player-eyebrow">SQUAD SCORES</span><h2>Team leaderboard</h2></div><span className="cc-player-count-chip">{teamLeaderboard.length} teams</span></div>
                {teamLeaderboard.length === 0 ? <p className="cc-player-empty-copy">Teams will appear when players create or join them.</p> : teamLeaderboard.map((team, index) => (
                  <article className={`cc-player-team-rank-row${player.team_id === team.id ? " is-you" : ""}`} key={team.id}>
                    <span className="cc-player-team-rank-number">{index + 1}</span><span className="cc-player-team-dot">{team.name.slice(0, 1).toUpperCase()}</span><strong>{team.name}{player.team_id === team.id && <small>YOUR TEAM</small>}</strong><span className="cc-player-team-rank-score">{team.score} pts</span>
                  </article>
                ))}
                <p className="cc-player-score-footnote">Team scores are the combined points earned by members.</p>
              </div>
            )}
          </section>
        )}

        {activePage === "side-challenges" && (
          <section className="cc-player-side-page">
            <div className="cc-player-page-heading"><div><span className="cc-player-eyebrow">EXTRA CHAOS</span><h2>Side challenges</h2><p>Complete these alongside the main round for extra points.</p></div><span className="cc-player-count-chip">{sideChallenges.length}</span></div>
            {session.status === "lobby" && <div className="cc-player-page-notice">Side challenges become active when the host starts the game.</div>}
            {session.status === "completed" && <div className="cc-player-page-notice">The game has ended. Here's how your side challenges finished.</div>}
            {sideChallenges.length === 0 ? <div className="cc-player-state-card"><h2>No side challenges added</h2><p>Ask the host if side challenges are part of this game.</p></div> : (
              <div className="cc-player-side-list">
                {sideChallenges.map((item) => {
                  const submitted = view.my_submissions.find((sub) => sub.challenge_id === item.id);
                  return <article className="cc-player-side-card" key={item.id}>
                    <div className="cc-player-side-card-copy"><div className="cc-player-side-card-top"><h3>{item.title}</h3><span className="cc-player-points">+{item.points} pts</span></div><p>{item.description}</p></div>
                    {submitted?.status === "approved" ? <span className="cc-player-submission-state is-approved"><CheckCircle2 size={16}/> +{submitted.awarded_points}</span>
                      : submitted?.status === "submitted" ? <span className="cc-player-small-status">Submitted · awaiting review</span>
                      : session.status === "live" ? <button type="button" className="cc-player-small-button" disabled={busyKey !== null || (!player.team_id && session.teams_enabled)} onClick={() => void submitChallenge(item)}>{busyKey === item.id ? <LoaderCircle size={16} className="cc-spin"/> : <Circle size={16}/>} {submitted?.status === "rejected" ? "Try again" : "Done"}</button>
                      : <span className="cc-player-small-status">Not completed</span>}
                  </article>;
                })}
              </div>
            )}
          </section>
        )}

        <div className="cc-player-sync-note"><span className="cc-player-live-dot"/> Live updates enabled {lastUpdated && <span>· synced {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>}</div>
        <button type="button" className="cc-player-text-button" onClick={() => navigate(`/join?code=${code}&returning=1`)}><RotateCcw size={15}/> Need to rejoin on this device?</button>
      </div>
    </main>
  );
}
