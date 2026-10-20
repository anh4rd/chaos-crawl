import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft, ArrowRight, Check, Clipboard, Flag,
  LoaderCircle, Play, RotateCcw, Users, X,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import HostShell from "../components/host/HostShell";
import "../styles/HostPortal.css";
import "../styles/HostSessions.css";

type SessionStatus = "lobby" | "live" | "completed";
interface GameSession {
  id: string;
  host_game_id: string | null;
  host_id: string;
  name: string;
  event_date: string | null;
  start_time: string | null;
  end_time: string | null;
  venue_name: string | null;
  join_code: string;
  status: SessionStatus;
  teams_enabled: boolean;
  host_chooses_teams: boolean;
  team_size: number;
  player_limit: number;
  current_round_number: number;
  created_at: string;
}
interface SessionChallenge {
  id: string;
  session_id: string;
  kind: "main" | "side" | "secret";
  round_number: number | null;
  title: string;
  description: string;
  points: number;
  duration_minutes: number;
  sort_order: number;
  allow_photo_upload: boolean;
}
interface SessionPlayer {
  id: string;
  name: string;
  avatar_url: string | null;
  team_id: string | null;
  score: number;
  joined_at: string;
  last_seen_at: string;
}
interface SessionTeam {
  id: string;
  name: string;
  created_at: string;
}
interface SessionSubmission {
  id: string;
  player_id: string;
  challenge_id: string;
  status: "submitted" | "approved" | "rejected";
  awarded_points: number;
  submitted_at: string;
}
export default function HostLiveSession() {
  const { sessionId = "" } = useParams();
  const [session, setSession] = useState<GameSession | null>(null);
  const [challenges, setChallenges] = useState<SessionChallenge[]>([]);
  const [players, setPlayers] = useState<SessionPlayer[]>([]);
  const [teams, setTeams] = useState<SessionTeam[]>([]);
  const [submissions, setSubmissions] = useState<SessionSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [teamName, setTeamName] = useState("");

  const load = useCallback(async () => {
    if (!sessionId) return;
    const [sessionResult, challengeResult, playerResult, teamResult, submissionResult] = await Promise.all([
      supabase.from("cc_game_sessions").select("*").eq("id", sessionId).single(),
      supabase.from("cc_game_session_challenges").select("*").eq("session_id", sessionId).order("sort_order", { ascending: true }),
      supabase.from("cc_game_session_players").select("id,name,avatar_url,team_id,score,joined_at,last_seen_at").eq("session_id", sessionId).order("joined_at", { ascending: true }),
      supabase.from("cc_game_session_teams").select("id,name,created_at").eq("session_id", sessionId).order("created_at", { ascending: true }),
      supabase.from("cc_game_session_submissions").select("id,player_id,challenge_id,status,awarded_points,submitted_at").eq("session_id", sessionId).order("submitted_at", { ascending: false }),
    ]);

    if (sessionResult.error) {
      setError(`Couldn't load this game session: ${sessionResult.error.message}`);
      setLoading(false);
      return;
    }
    setSession(sessionResult.data as GameSession);
    setChallenges((challengeResult.data ?? []) as SessionChallenge[]);
    setPlayers((playerResult.data ?? []) as SessionPlayer[]);
    setTeams((teamResult.data ?? []) as SessionTeam[]);
    setSubmissions((submissionResult.data ?? []) as SessionSubmission[]);
    const loadError = challengeResult.error || playerResult.error || teamResult.error || submissionResult.error;
    if (loadError) setError(`Some game details could not load: ${loadError.message}`);
    else setError("");
    setLoading(false);
  }, [sessionId]);

  useEffect(() => {
    let mounted = true;
    const initial = async () => { if (mounted) await load(); };
    void initial();
    const timer = window.setInterval(() => { if (mounted) void load(); }, 3000);
    return () => { mounted = false; window.clearInterval(timer); };
  }, [load]);

  const mainRounds = useMemo(
    () => challenges.filter((item) => item.kind === "main" && item.round_number !== null)
      .sort((a, b) => Number(a.round_number) - Number(b.round_number)),
    [challenges],
  );
  const sideChallenges = challenges.filter((item) => item.kind === "side");
  const secretChallenges = challenges.filter((item) => item.kind === "secret");
  const currentChallenge = mainRounds.find((item) => item.round_number === session?.current_round_number);
  const joinUrl = session
    ? `${window.location.origin}${window.location.pathname}#/join?code=${session.join_code}`
    : "";

  async function startGame() {
    if (!session) return;
    if (players.length === 0) {
      setError("Wait for at least one player to join before starting.");
      return;
    }
    if (session.teams_enabled && players.some((player) => !player.team_id)) {
      setError("Make sure every player has a team before starting, or disable teams in the plan.");
      return;
    }
    if (!window.confirm(`Start "${session.name}"? Everyone currently in the lobby will see Round 1.`)) return;
    setBusy(true); setError(""); setNotice("");
    const { error: startError } = await supabase.rpc("cc_host_start_game_session", { p_session_id: session.id });
    setBusy(false);
    if (startError) { setError(startError.message); return; }
    setNotice("Game started. Players will see Round 1.");
    await load();
  }

  async function moveToRound(nextRound: number) {
    if (!session || busy) return;
    setBusy(true); setError(""); setNotice("");
    const { error: roundError } = await supabase.rpc("cc_host_set_game_session_round", {
      p_session_id: session.id,
      p_round_number: nextRound,
    });
    setBusy(false);
    if (roundError) { setError(roundError.message); return; }
    setNotice(`Moved everyone to Round ${nextRound}. You can move backwards or forwards at any time.`);
    await load();
  }

  async function finishGame() {
    if (!session) return;
    if (!window.confirm("Finish this game? Players will no longer be able to submit challenges.")) return;
    setBusy(true); setError(""); setNotice("");
    const { error: finishError } = await supabase.rpc("cc_host_complete_game_session", { p_session_id: session.id });
    setBusy(false);
    if (finishError) { setError(finishError.message); return; }
    setNotice("Game completed.");
    await load();
  }

  async function copyCode() {
    if (!session) return;
    try {
      await navigator.clipboard.writeText(session.join_code);
      setNotice("Join code copied.");
    } catch {
      setNotice(`Join code: ${session.join_code}`);
    }
  }

  async function createTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = teamName.trim();
    if (!session || !cleanName) return;
    setBusy(true); setError(""); setNotice("");
    const { error: createError } = await supabase.from("cc_game_session_teams")
      .insert({ session_id: session.id, name: cleanName });
    setBusy(false);
    if (createError) { setError(createError.message.includes("unique") ? "That team name is already used in this game." : createError.message); return; }
    setTeamName("");
    setNotice(`Team "${cleanName}" created.`);
    await load();
  }

  async function assignTeam(player: SessionPlayer, teamId: string) {
    if (!session) return;
    if (teamId) {
      const count = players.filter((person) => person.team_id === teamId && person.id !== player.id).length;
      if (count >= session.team_size) {
        setError("That team is full. Increase team size in the game plan or choose another team.");
        return;
      }
    }
    setBusy(true); setError(""); setNotice("");
    const { error: assignError } = await supabase.from("cc_game_session_players")
      .update({ team_id: teamId || null })
      .eq("id", player.id)
      .eq("session_id", session.id);
    setBusy(false);
    if (assignError) { setError(assignError.message); return; }
    await load();
  }

  async function reviewSubmission(submission: SessionSubmission, approve: boolean) {
    const challenge = challenges.find((item) => item.id === submission.challenge_id);
    const suggested = Number(challenge?.points ?? 0);
    const points = approve
      ? Number(window.prompt(`Points to award (suggested: ${suggested})`, String(suggested)) ?? "-1")
      : 0;
    if (approve && (!Number.isFinite(points) || points < 0)) return;
    setBusy(true); setError(""); setNotice("");
    const { error: reviewError } = await supabase.rpc("cc_host_review_session_submission", {
      p_submission_id: submission.id,
      p_approve: approve,
      p_points: points,
    });
    setBusy(false);
    if (reviewError) { setError(reviewError.message); return; }
    setNotice(approve ? `Approved submission for ${points} points.` : "Submission rejected.");
    await load();
  }

  const playerById = new Map(players.map((player) => [player.id, player]));
  const challengeById = new Map(challenges.map((challenge) => [challenge.id, challenge]));
  const teamById = new Map(teams.map((team) => [team.id, team]));

  if (loading) {
    return <HostShell title="Your live game" subtitle="Preparing your control panel…" showCreate={false}>
      <div className="host-empty-state"><LoaderCircle className="cc-spin" size={24}/> Loading your game session…</div>
    </HostShell>;
  }
  if (!session) {
    return <HostShell title="Game not found" subtitle="This session may have been removed." showCreate={false}>
      {error && <div className="host-alert host-alert--error">{error}</div>}
      <Link className="host-button host-button--primary" to="/host">Back to Host Hub</Link>
    </HostShell>;
  }

  return (
    <HostShell title={session.name} subtitle={`${session.venue_name || "Single venue"} · ${session.status === "lobby" ? "Waiting room" : session.status === "live" ? "Live game" : "Completed"}`} showCreate={false}>
      <div className="cc-session-page">
        <div className="cc-session-topbar">
          <Link to="/host" className="cc-session-back"><ArrowLeft size={17}/> Host Hub</Link>
          <span className={`cc-session-status cc-session-status--${session.status}`}>{session.status === "lobby" ? "LOBBY" : session.status === "live" ? "LIVE" : "COMPLETED"}</span>
        </div>

        {error && <div className="host-alert host-alert--error" role="alert">{error}</div>}
        {notice && <div className="host-alert host-alert--success" role="status">{notice}</div>}

        <div className="cc-session-grid">
          <section className="cc-session-card cc-invite-card">
            <div className="cc-section-kicker">YOUR GAME CODE</div>
            <div className="cc-join-code">{session.join_code}</div>
            <p>Players can scan this QR code or enter the six-digit code at the join screen.</p>
            <div className="cc-qr-wrap"><QRCodeSVG value={joinUrl} size={196} level="M" marginSize={4} /></div>
            <div className="cc-invite-actions">
              <button type="button" className="host-button host-button--secondary" onClick={() => void copyCode()}><Clipboard size={16}/> Copy code</button>
              <a className="host-button host-button--ghost" href={joinUrl} target="_blank" rel="noreferrer">Open join screen <ArrowRight size={16}/></a>
            </div>
            <div className="cc-player-count"><Users size={17}/> {players.length} / {session.player_limit} players joined</div>
            {session.teams_enabled && <p className="cc-helper-text">{session.host_chooses_teams ? "You'll assign teams below." : "Players can pick or create a team in the lobby."}</p>}
          </section>

          <section className="cc-session-card cc-live-controls">
            <div className="cc-section-kicker">GAME CONTROL</div>
            {session.status === "lobby" ? (
              <>
                <h2>Ready when you are.</h2>
                <p>Share the code, get everyone into the lobby, then start the game. Your first challenge stays hidden until you start.</p>
                <button type="button" className="host-button host-button--lime cc-primary-wide" onClick={() => void startGame()} disabled={busy || players.length === 0 || (session.teams_enabled && players.some((player) => !player.team_id))}>
                  {busy ? <LoaderCircle size={17} className="cc-spin"/> : <Play size={17}/>} Start game
                </button>
                {players.length === 0
                  ? <p className="cc-helper-text">The start button becomes available when the first player joins.</p>
                  : session.teams_enabled && players.some((player) => !player.team_id)
                    ? <p className="cc-helper-text">Wait until every player has a team. {session.host_chooses_teams ? "Assign teams below." : "Players can choose teams from their lobby screen."}</p>
                    : null}
              </>
            ) : session.status === "completed" ? (
              <>
                <h2>Game complete!</h2>
                <p>This session is saved separately from every other game. You can still review the rounds and scores below.</p>
              </>
            ) : (
              <>
                <div className="cc-round-kicker">CURRENT ROUND</div>
                <div className="cc-round-number">{session.current_round_number}<span> / {mainRounds.length}</span></div>
                <h2>{currentChallenge?.title ?? "Round not found"}</h2>
                <p>{currentChallenge?.description ?? "Check that the saved plan contains a main challenge for this round."}</p>
                <div className="cc-round-controls">
                  <button type="button" className="host-button host-button--secondary" disabled={busy || session.current_round_number <= 1} onClick={() => void moveToRound(session.current_round_number - 1)}><RotateCcw size={16}/> Previous round</button>
                  <button type="button" className="host-button host-button--primary" disabled={busy || session.current_round_number >= mainRounds.length} onClick={() => void moveToRound(session.current_round_number + 1)}>Next round <ArrowRight size={16}/></button>
                </div>
                <div className="cc-round-list" aria-label="Jump to round">
                  {mainRounds.map((round) => <button
                    type="button"
                    key={round.id}
                    className={`cc-round-chip${round.round_number === session.current_round_number ? " is-current" : ""}`}
                    disabled={busy || round.round_number === session.current_round_number}
                    onClick={() => void moveToRound(Number(round.round_number))}
                  >{round.round_number}. {round.title}</button>)}
                </div>
                <button type="button" className="host-button host-button--ghost cc-finish-game" disabled={busy} onClick={() => void finishGame()}><Flag size={16}/> Finish game</button>
              </>
            )}
          </section>
        </div>

        <section className="cc-session-card cc-session-section">
          <div className="cc-session-section-heading"><div><div className="cc-section-kicker">{session.teams_enabled ? "TEAM SETUP" : "PLAYER LOBBY"}</div><h2>{session.teams_enabled ? "Players & teams" : "Players"}</h2><p>{session.teams_enabled ? (session.host_chooses_teams ? "Assign players to teams." : "See who has joined and which teams they picked.") + ` Team limit: ${session.team_size} players.` : "Everyone who joins this game appears here."}</p></div><span className="cc-count-pill">{players.length} players</span></div>
          {session.teams_enabled && session.host_chooses_teams && session.status === "lobby" && (
            <form className="cc-create-team-form" onSubmit={(event) => void createTeam(event)}>
              <input aria-label="New team name" value={teamName} onChange={(event) => setTeamName(event.target.value)} placeholder="New team name" maxLength={40}/>
              <button className="host-button host-button--secondary" type="submit" disabled={busy || !teamName.trim()}>Create team</button>
            </form>
          )}
          {session.teams_enabled && teams.length > 0 && <div className="cc-team-summary">{teams.map((team) => <span key={team.id}>{team.name} <b>{players.filter((player) => player.team_id === team.id).length}/{session.team_size}</b></span>)}</div>}
          <div className="cc-player-table">
            {players.map((player) => (
              <div className="cc-player-row" key={player.id}>
                <div className="cc-player-avatar">{player.name.slice(0, 1).toUpperCase()}</div>
                <div className="cc-player-name"><strong>{player.name}</strong><small>{player.score} points</small></div>
                {session.teams_enabled && session.host_chooses_teams && session.status === "lobby" ? (
                  <select aria-label={`Team for ${player.name}`} value={player.team_id ?? ""} disabled={busy} onChange={(event) => void assignTeam(player, event.target.value)}>
                    <option value="">Unassigned</option>
                    {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
                  </select>
                ) : (
                  <span className="cc-player-team">{session.teams_enabled ? (teamById.get(player.team_id ?? "")?.name ?? "No team yet") : "Joined"}</span>
                )}
              </div>
            ))}
            {players.length === 0 && <p className="cc-helper-text">No players yet. Share the QR code or join code above.</p>}
          </div>
        </section>

        <section className="cc-session-card cc-session-section">
          <div className="cc-session-section-heading"><div><div className="cc-section-kicker">ROUND PLAN</div><h2>Your challenges</h2><p>Jump to a round at any time while the game is live, including previous rounds.</p></div><span className="cc-count-pill">{mainRounds.length} rounds</span></div>
          <div className="cc-challenge-list">
            {mainRounds.map((round) => (
              <button type="button" key={round.id} className={`cc-challenge-row${session.status === "live" && round.round_number === session.current_round_number ? " is-current" : ""}`} onClick={() => session.status === "live" && void moveToRound(Number(round.round_number))} disabled={session.status !== "live" || round.round_number === session.current_round_number || busy}>
                <span className="cc-challenge-index">{round.round_number}</span>
                <span className="cc-challenge-copy"><strong>{round.title}</strong><small>{round.description}</small></span>
                <span className="cc-challenge-points">{round.points} pts</span>
              </button>
            ))}
          </div>
          {sideChallenges.length > 0 && (
            <div className="cc-side-challenges">
              <h3>Side challenges <span>{sideChallenges.length}</span></h3>
              {sideChallenges.map((challenge) => <div key={challenge.id} className="cc-side-row"><span>{challenge.title}</span><strong>{challenge.points} pts</strong></div>)}
            </div>
          )}
          {secretChallenges.length > 0 && (
            <div className="cc-side-challenges">
              <h3>Host-only secret tasks <span>{secretChallenges.length}</span></h3>
              <p className="cc-helper-text">These tasks stay hidden from the player app. Assign them verbally if you want to use them; automatic private delivery is not included in this version.</p>
              {secretChallenges.map((challenge) => <div key={challenge.id} className="cc-side-row"><span>{challenge.title}</span><strong>{challenge.points} pts</strong></div>)}
            </div>
          )}
        </section>

        <section className="cc-session-card cc-session-section">
          <div className="cc-session-section-heading"><div><div className="cc-section-kicker">SUBMISSIONS</div><h2>Review & award points</h2><p>Approve a submission to add points to that player's score in this game only.</p></div><span className="cc-count-pill">{submissions.filter((item) => item.status === "submitted").length} pending</span></div>
          {submissions.length === 0 ? <p className="cc-helper-text">No challenge submissions yet.</p> : (
            <div className="cc-submission-list">
              {submissions.map((submission) => {
                const player = playerById.get(submission.player_id);
                const challenge = challengeById.get(submission.challenge_id);
                return <div className="cc-submission-row" key={submission.id}>
                  <div className="cc-submission-info"><strong>{player?.name ?? "Player"}</strong><span>{challenge?.title ?? "Challenge"}</span><small>{new Date(submission.submitted_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small></div>
                  <span className={`cc-submission-status cc-submission-status--${submission.status}`}>{submission.status === "submitted" ? "Needs review" : submission.status === "approved" ? `+${submission.awarded_points} pts` : "Rejected"}</span>
                  {submission.status === "submitted" && <div className="cc-submission-actions"><button type="button" className="host-button host-button--lime" disabled={busy} onClick={() => void reviewSubmission(submission, true)}><Check size={15}/> Approve</button><button type="button" className="host-button host-button--ghost" disabled={busy} onClick={() => void reviewSubmission(submission, false)}><X size={15}/> Reject</button></div>}
                </div>;
              })}
            </div>
          )}
        </section>
      </div>
    </HostShell>
  );
}
