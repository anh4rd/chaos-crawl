import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft, ArrowRight, CalendarClock, Check, Clipboard, Flag,
  LoaderCircle, Play, RotateCcw, Send, Shield, Users, X, Heart, Trophy, Crown, Sparkles,
  Gamepad2, Medal, ClipboardList, Star, UserRound,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import HostShell from "../components/host/HostShell";
import "../styles/HostPortal.css";
import "../styles/HostSessions.css";
import "../styles/HostLiveGameRedesign.css";

type SessionStatus = "lobby" | "live" | "completed";
type RewardMethod = "voting" | "host_awards" | "audience_cheers";
type RewardTargetKind = "player" | "team";
type HostTab = "game" | "leaderboard" | "side-challenges" | "reward-round" | "host-controls";
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
  host_participates: boolean;
  host_player_id: string | null;
  current_round_number: number;
  reward_methods: RewardMethod[];
  created_at: string;
  final_gallery_open: boolean;
  final_voting_open: boolean;
  final_vote_completed_at: string | null;
  final_vote_winner_player_id: string | null;
  final_vote_winner_evidence_id: string | null;
  final_vote_winner_points: number;
  final_vote_winner_vote_count: number;
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
interface SecretMissionAssignment {
  id: string;
  session_id: string;
  player_id: string;
  challenge_id: string;
  status: "scheduled" | "sent" | "submitted" | "approved" | "rejected" | "cancelled";
  scheduled_at: string;
  sent_at: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  awarded_points: number;
  created_at: string;
}
interface SessionEvidence {
  id: string;
  session_id: string;
  player_id: string;
  challenge_id: string;
  secret_assignment_id: string | null;
  storage_path: string;
  media_type: "image" | "video";
  saved_for_final: boolean;
  created_at: string;
}
interface SessionFinalVote { id: string; session_id: string; player_id: string; evidence_id: string; voted_at: string; }
interface SessionRewardRound {
  id: string; session_id: string; challenge_id: string; reward_method: RewardMethod;
  target_kind: RewardTargetKind; points: number; status: "open" | "completed" | "cancelled";
  created_at: string; started_at: string; completed_at: string | null; released_at: string | null;
}
interface SessionRewardVote {
  id: string; session_id: string; reward_round_id: string; voter_player_id: string;
  target_player_id: string | null; target_team_id: string | null; voted_at: string;
}
interface SessionRewardAward {
  id: string; session_id: string; reward_round_id: string; winner_player_id: string | null;
  winner_team_id: string | null; points_awarded: number; votes_received: number;
}
export default function HostLiveSession() {
  const { sessionId = "" } = useParams();
  const [session, setSession] = useState<GameSession | null>(null);
  const [challenges, setChallenges] = useState<SessionChallenge[]>([]);
  const [players, setPlayers] = useState<SessionPlayer[]>([]);
  const [teams, setTeams] = useState<SessionTeam[]>([]);
  const [submissions, setSubmissions] = useState<SessionSubmission[]>([]);
  const [secretAssignments, setSecretAssignments] = useState<SecretMissionAssignment[]>([]);
  const [evidence, setEvidence] = useState<SessionEvidence[]>([]);
  const [finalVotes, setFinalVotes] = useState<SessionFinalVote[]>([]);
  const [rewardRounds, setRewardRounds] = useState<SessionRewardRound[]>([]);
  const [rewardVotes, setRewardVotes] = useState<SessionRewardVote[]>([]);
  const [rewardAwards, setRewardAwards] = useState<SessionRewardAward[]>([]);
  const [showRewardSetup, setShowRewardSetup] = useState(false);
  const [rewardChallengeId, setRewardChallengeId] = useState("");
  const [rewardMethod, setRewardMethod] = useState<RewardMethod>("voting");
  const [rewardTargetKind, setRewardTargetKind] = useState<RewardTargetKind>("player");
  const [rewardPoints, setRewardPoints] = useState(10);
  const [rewardFinalPoints, setRewardFinalPoints] = useState(10);
  const [selectedRewardWinnerIds, setSelectedRewardWinnerIds] = useState<string[]>([]);
  const [selectedSecretPlayerId, setSelectedSecretPlayerId] = useState("");
  const [selectedSecretChallengeId, setSelectedSecretChallengeId] = useState("");
  const [secretScheduleAt, setSecretScheduleAt] = useState("");
  const [newSecretTitle, setNewSecretTitle] = useState("");
  const [newSecretDescription, setNewSecretDescription] = useState("");
  const [newSecretPoints, setNewSecretPoints] = useState(10);
  const [newSecretEvidenceRequired, setNewSecretEvidenceRequired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [teamName, setTeamName] = useState("");
  const [activeTab, setActiveTab] = useState<HostTab>("game");
  const [leaderboardScope, setLeaderboardScope] = useState<"players" | "teams">("players");
  const [hostPlayerName, setHostPlayerName] = useState("Host");
  const [hostPlayerViewUrl, setHostPlayerViewUrl] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!sessionId) return;
    // Send any scheduled missions whose time has arrived while this game is live.
    const { error: dispatchError } = await supabase.rpc("cc_host_dispatch_due_secret_missions", { p_session_id: sessionId });
    if (dispatchError) console.warn("SECRET MISSION DISPATCH:", dispatchError.message);

    const [sessionResult, challengeResult, playerResult, teamResult, submissionResult, secretAssignmentResult, evidenceResult, voteResult, rewardRoundResult, rewardVoteResult, rewardAwardResult] = await Promise.all([
      supabase.from("cc_game_sessions").select("*").eq("id", sessionId).single(),
      supabase.from("cc_game_session_challenges").select("*").eq("session_id", sessionId).order("sort_order", { ascending: true }),
      supabase.from("cc_game_session_players").select("id,name,avatar_url,team_id,score,joined_at,last_seen_at").eq("session_id", sessionId).order("joined_at", { ascending: true }),
      supabase.from("cc_game_session_teams").select("id,name,created_at").eq("session_id", sessionId).order("created_at", { ascending: true }),
      supabase.from("cc_game_session_submissions").select("id,player_id,challenge_id,status,awarded_points,submitted_at").eq("session_id", sessionId).order("submitted_at", { ascending: false }),
      supabase.from("cc_game_session_secret_assignments").select("id,session_id,player_id,challenge_id,status,scheduled_at,sent_at,submitted_at,reviewed_at,awarded_points,created_at").eq("session_id", sessionId).order("created_at", { ascending: false }),
      supabase.from("cc_game_session_evidence").select("id,session_id,player_id,challenge_id,secret_assignment_id,storage_path,media_type,saved_for_final,created_at").eq("session_id", sessionId).order("created_at", { ascending: false }),
      supabase.from("cc_game_session_final_votes").select("id,session_id,player_id,evidence_id,voted_at").eq("session_id", sessionId),
      supabase.from("cc_game_session_reward_rounds").select("*").eq("session_id", sessionId).is("released_at", null).in("status", ["open", "completed"]).order("created_at", { ascending: false }).limit(1),
      supabase.from("cc_game_session_reward_votes").select("id,session_id,reward_round_id,voter_player_id,target_player_id,target_team_id,voted_at").eq("session_id", sessionId),
      supabase.from("cc_game_session_reward_awards").select("id,session_id,reward_round_id,winner_player_id,winner_team_id,points_awarded,votes_received").eq("session_id", sessionId),
    ]);

    if (sessionResult.error) {
      setError(`Couldn't load this game session: ${sessionResult.error.message}`);
      setLoading(false);
      return;
    }
    setSession(sessionResult.data as GameSession);
    const loadedChallenges = (challengeResult.data ?? []) as SessionChallenge[];
    setChallenges(loadedChallenges);
    setRewardChallengeId((current) => current || loadedChallenges.find((item) => item.kind === "main" && item.round_number === Number(sessionResult.data.current_round_number))?.id || loadedChallenges.find((item) => item.kind === "main")?.id || loadedChallenges[0]?.id || "");
    const allowedRewardMethods = ((sessionResult.data as GameSession).reward_methods ?? ["voting", "host_awards", "audience_cheers"]) as RewardMethod[];
    setRewardMethod((current) => allowedRewardMethods.includes(current) ? current : allowedRewardMethods[0] ?? "host_awards");
    setPlayers((playerResult.data ?? []) as SessionPlayer[]);
    setTeams((teamResult.data ?? []) as SessionTeam[]);
    setSubmissions((submissionResult.data ?? []) as SessionSubmission[]);
    setSecretAssignments((secretAssignmentResult.data ?? []) as SecretMissionAssignment[]);
    setEvidence((evidenceResult.data ?? []) as SessionEvidence[]);
    setFinalVotes((voteResult.data ?? []) as SessionFinalVote[]);
    setRewardRounds((rewardRoundResult.data ?? []) as SessionRewardRound[]);
    setRewardVotes((rewardVoteResult.data ?? []) as SessionRewardVote[]);
    setRewardAwards((rewardAwardResult.data ?? []) as SessionRewardAward[]);
    const loadError = challengeResult.error || playerResult.error || teamResult.error || submissionResult.error || secretAssignmentResult.error || evidenceResult.error || voteResult.error || rewardRoundResult.error || rewardVoteResult.error || rewardAwardResult.error;
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
  const activeRewardRound = rewardRounds.find((item) => item.released_at === null && (item.status === "open" || item.status === "completed")) ?? null;
  useEffect(() => { if (activeRewardRound) setRewardFinalPoints(activeRewardRound.points); }, [activeRewardRound?.id]);
  const activeRewardVotes = activeRewardRound ? rewardVotes.filter((item) => item.reward_round_id === activeRewardRound.id) : [];
  const activeRewardAwards = activeRewardRound ? rewardAwards.filter((item) => item.reward_round_id === activeRewardRound.id) : [];
  const activeRewardChallenge = activeRewardRound ? challenges.find((item) => item.id === activeRewardRound.challenge_id) : undefined;
  const rewardTargetRows = activeRewardRound?.target_kind === "team"
    ? teams.map((team) => ({ id: team.id, name: team.name, detail: `${players.filter((player) => player.team_id === team.id).length} players`, score: players.filter((player) => player.team_id === team.id).reduce((sum, player) => sum + player.score, 0) }))
    : players.map((player) => ({ id: player.id, name: player.name, detail: teams.find((team) => team.id === player.team_id)?.name ?? "Player", score: player.score }));
  const enabledRewardMethods = (session?.reward_methods ?? ["voting", "host_awards", "audience_cheers"]).filter((method): method is RewardMethod => ["voting", "host_awards", "audience_cheers"].includes(method));
  const rewardMethodLabel = (method: RewardMethod) => method === "voting" ? "Player voting" : method === "host_awards" ? "Host awards" : "Audience cheers";
  const rewardVoteCount = (targetId: string) => activeRewardVotes.filter((vote) => activeRewardRound?.target_kind === "team" ? vote.target_team_id === targetId : vote.target_player_id === targetId).length;
  const joinUrl = session
    ? `${window.location.origin}${window.location.pathname}#/join?code=${session.join_code}`
    : "";

  function embeddedPlayerUrl(joinCode: string, page: "game" | "leaderboard" | "side-challenges" | "final" = "game") {
    // Preserve Vite deployments such as /chaos-crawl/ and keep the player
    // experience inside the HashRouter instead of navigating to the domain root.
    const configuredBase = import.meta.env.BASE_URL || "/";
    const basePath = configuredBase.endsWith("/") ? configuredBase : `${configuredBase}/`;
    return `${window.location.origin}${basePath}#/play/${joinCode}/${page}?hostEmbed=1`;
  }

  useEffect(() => {
    // If the host has already joined and this browser still has the player's
    // token, restore the embedded player experience after refresh.
    if (!session?.host_participates || !session.host_player_id) {
      setHostPlayerViewUrl(null);
      return;
    }
    const code = session.join_code.replace(/\D/g, "");
    if (localStorage.getItem(`chaos-crawl-session-player:${code}`)) {
      setHostPlayerViewUrl(embeddedPlayerUrl(session.join_code));
    }
  }, [session?.host_participates, session?.host_player_id, session?.join_code]);

  async function openHostPlayerView() {
    if (!session || !session.host_participates) return;
    setBusy(true); setError(""); setNotice("");
    const { data, error: joinError } = await supabase.rpc("cc_host_join_as_player", {
      p_session_id: session.id,
      p_player_name: hostPlayerName.trim() || "Host",
    });
    setBusy(false);
    if (joinError) {
      setError(joinError.message);
      return;
    }
    const result = data as { join_code?: string; player_token?: string; name?: string } | null;
    const joinCode = result?.join_code ?? session.join_code;
    const playerToken = result?.player_token;
    if (!playerToken) {
      setError("The host player profile was created, but no player token was returned. Check the host participation migration.");
      return;
    }
    localStorage.setItem(`chaos-crawl-session-player:${joinCode.replace(/\D/g, "")}`, playerToken);
    setHostPlayerViewUrl(embeddedPlayerUrl(joinCode));
    setActiveTab("game");
    setNotice(`You're in the game${result?.name ? ` as ${result.name}` : " as Host"}. Host tools remain available in the Host Controls tab.`);
    await load();
  }

  function renderHostPlayerTab(page: "leaderboard" | "side-challenges" | "final") {
    if (!session?.host_participates || !hostPlayerViewUrl) return null;
    const pageTitle = page === "leaderboard" ? "Leaderboard" : page === "side-challenges" ? "Side challenges" : "Final vote";
    return (
      <section className="cc-host-embedded-player-shell cc-host-embedded-player-shell--tab">
        <div className="cc-host-embedded-player-bar"><span><i/> PLAYER EXPERIENCE · {pageTitle.toUpperCase()}</span><button type="button" onClick={() => setActiveTab("host-controls")}>Open host controls <ArrowRight size={14}/></button></div>
        <iframe key={`${session.id}-${page}`} className="cc-host-embedded-player-frame" title={`${pageTitle} player experience for ${session.name}`} src={embeddedPlayerUrl(session.join_code, page)} />
      </section>
    );
  }

  async function startGame() {
    if (!session) return;
    if (session.host_participates && !session.host_player_id) {
      setError("Host participation is enabled. Join as a player before starting so you appear on the roster and can be assigned to a team.");
      return;
    }
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
    if (activeRewardRound) { setError("Complete or cancel the reward flow before moving to another round."); return; }
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
    if (activeRewardRound) { setError("Complete or cancel the reward flow and return everyone to the game before finishing."); return; }
    if (!window.confirm("Finish this game? Players will no longer be able to submit challenges.")) return;
    setBusy(true); setError(""); setNotice("");
    const { error: finishError } = await supabase.rpc("cc_host_complete_game_session", { p_session_id: session.id });
    setBusy(false);
    if (finishError) { setError(finishError.message); return; }
    setNotice("Game completed.");
    await load();
  }

  async function startRewardRound(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session || !rewardChallengeId) { setError("Choose a challenge to reward."); return; }
    if (!enabledRewardMethods.includes(rewardMethod)) { setError("Choose a reward method enabled in game setup."); return; }
    if (rewardTargetKind === "team" && (!session.teams_enabled || teams.length === 0)) { setError("Create teams before rewarding a team."); return; }
    setBusy(true); setError(""); setNotice("");
    const { data, error: startError } = await supabase.rpc("cc_host_start_session_reward_round", {
      p_session_id: session.id,
      p_challenge_id: rewardChallengeId,
      p_reward_method: rewardMethod,
      p_target_kind: rewardTargetKind,
      p_points: Math.max(0, Math.min(10000, Number(rewardPoints) || 0)),
    });
    setBusy(false);
    if (startError) { setError(startError.message); return; }
    setShowRewardSetup(false);
    setSelectedRewardWinnerIds([]);
    const method = (data as { reward_method?: RewardMethod } | null)?.reward_method ?? rewardMethod;
    setNotice(`${rewardMethodLabel(method)} started. Players' screens have updated.`);
    await load();
  }

  function toggleRewardWinner(id: string) {
    setSelectedRewardWinnerIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  async function completeRewardRound() {
    if (!activeRewardRound || busy) return;
    const manual = activeRewardRound.reward_method !== "voting";
    if (manual && selectedRewardWinnerIds.length === 0) { setError("Select at least one winner first."); return; }
    const confirmText = activeRewardRound.reward_method === "voting"
      ? `Close voting and award ${activeRewardRound.points} points to the top vote-getter${activeRewardVotes.length ? "(s)" : ""}? Tied top votes will all win.`
      : `Award ${activeRewardRound.points} points to ${selectedRewardWinnerIds.length} selected winner${selectedRewardWinnerIds.length === 1 ? "" : "s"}?`;
    if (!window.confirm(confirmText)) return;
    setBusy(true); setError(""); setNotice("");
    const { data, error: awardError } = await supabase.rpc("cc_host_complete_session_reward_round", {
      p_reward_round_id: activeRewardRound.id,
      p_winner_player_ids: activeRewardRound.target_kind === "player" ? selectedRewardWinnerIds : [],
      p_winner_team_ids: activeRewardRound.target_kind === "team" ? selectedRewardWinnerIds : [],
      p_points: activeRewardRound.reward_method === "voting" ? null : Math.max(0, Math.min(10000, Number(rewardFinalPoints) || 0)),
    });
    setBusy(false);
    if (awardError) { setError(awardError.message); return; }
    const result = data as { winner_count?: number; points_awarded?: number } | null;
    setNotice(`Reward complete. ${result?.winner_count ?? 0} winner${result?.winner_count === 1 ? "" : "s"}; ${result?.points_awarded ?? 0} points awarded. Players can see the updated leaderboard.`);
    setSelectedRewardWinnerIds([]);
    await load();
  }

  async function returnFromRewardRound() {
    if (!activeRewardRound || busy) return;
    setBusy(true); setError(""); setNotice("");
    const { error: releaseError } = await supabase.rpc("cc_host_release_session_reward_round", { p_reward_round_id: activeRewardRound.id });
    setBusy(false);
    if (releaseError) { setError(releaseError.message); return; }
    setNotice("Everyone has been returned to the game.");
    await load();
  }

  async function cancelRewardRound() {
    if (!activeRewardRound || busy || !window.confirm("Cancel this reward flow and return everyone to the game without awarding points?")) return;
    setBusy(true); setError(""); setNotice("");
    const { error: cancelError } = await supabase.rpc("cc_host_cancel_session_reward_round", { p_reward_round_id: activeRewardRound.id });
    setBusy(false);
    if (cancelError) { setError(cancelError.message); return; }
    setNotice("Reward flow cancelled. No points were awarded.");
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
    const isSideChallenge = challenge?.kind === "side";
    const suggested = Number(challenge?.points ?? 0);
    // Main-challenge points are assigned only after host review. Side-challenge
    // uploads are approved for gallery eligibility but stay unscored until voting closes.
    const points = approve && !isSideChallenge
      ? Number(window.prompt(`Points to award (suggested: ${suggested})`, String(suggested)) ?? "-1")
      : 0;
    if (approve && !isSideChallenge && (!Number.isFinite(points) || points < 0)) return;
    setBusy(true); setError(""); setNotice("");
    const { error: reviewError } = await supabase.rpc("cc_host_review_session_submission", {
      p_submission_id: submission.id,
      p_approve: approve,
      p_points: points,
    });
    setBusy(false);
    if (reviewError) { setError(reviewError.message); return; }
    setNotice(!approve
      ? "Submission rejected."
      : isSideChallenge
        ? "Side challenge approved for the gallery. Points will be awarded automatically when final voting closes."
        : `Approved submission for ${points} points.`);
    await load();
  }

  function evidenceUrl(path: string) {
    return supabase.storage.from("session-evidence").getPublicUrl(path).data.publicUrl;
  }

  function evidenceForChallenge(playerId: string, challengeId: string) {
    return evidence.filter((item) => item.player_id === playerId && item.challenge_id === challengeId && item.secret_assignment_id === null);
  }

  function evidenceForAssignment(assignmentId: string) {
    return evidence.filter((item) => item.secret_assignment_id === assignmentId);
  }

  async function toggleEvidenceFinal(item: SessionEvidence) {
    if (!session) return;
    setBusy(true); setError(""); setNotice("");
    const { error: updateError } = await supabase.from("cc_game_session_evidence")
      .update({ saved_for_final: !item.saved_for_final })
      .eq("id", item.id).eq("session_id", session.id);
    setBusy(false);
    if (updateError) { setError(updateError.message); return; }
    setNotice(!item.saved_for_final ? "Saved for the final vote gallery." : "Removed from the final vote gallery.");
    await load();
  }

  async function setFinalGallery(galleryOpen: boolean, votingOpen: boolean) {
    if (!session) return;
    const closingVote = session.final_voting_open && !votingOpen;
    setBusy(true); setError(""); setNotice("");
    const { data: galleryResult, error: galleryError } = await supabase.rpc("cc_host_set_session_final_gallery", {
      p_session_id: session.id,
      p_gallery_open: galleryOpen,
      p_voting_open: votingOpen,
    });
    setBusy(false);
    if (galleryError) { setError(galleryError.message); return; }
    if (closingVote) {
      const winnerId = (galleryResult as { final_vote_winner_player_id?: string | null } | null)?.final_vote_winner_player_id;
      const winnerPoints = Number((galleryResult as { final_vote_winner_points?: number } | null)?.final_vote_winner_points ?? 0);
      const winnerName = winnerId ? players.find((player) => player.id === winnerId)?.name : null;
      setNotice(winnerId
        ? `Voting closed. ${winnerName ?? "The winning player"} automatically received ${winnerPoints} vote points.`
        : "Voting closed. No eligible votes were cast, so no vote points were awarded.");
    } else {
      setNotice(galleryOpen ? (votingOpen ? "Final gallery and voting are open for players." : "Final results are visible; voting is closed.") : "Final gallery hidden from players.");
    }
    await load();
  }

  async function copyFinalVoteLink() {
    if (!session) return;
    const url = `${window.location.origin}${window.location.pathname}#/play/${session.join_code}/final`;
    try {
      await navigator.clipboard.writeText(url);
      setNotice("Player final-vote link copied.");
    } catch {
      setNotice(`Copy this player link: ${url}`);
    }
  }

  async function createSecretChallenge(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session || !newSecretTitle.trim()) return;
    setBusy(true); setError(""); setNotice("");
    const nextSortOrder = Math.max(0, ...challenges.map((item) => Number(item.sort_order ?? 0))) + 1;
    const { data, error: createError } = await supabase
      .from("cc_game_session_challenges")
      .insert({
        session_id: session.id,
        kind: "secret",
        round_number: null,
        title: newSecretTitle.trim(),
        description: newSecretDescription.trim(),
        points: Math.max(0, Number(newSecretPoints) || 0),
        duration_minutes: 10,
        sort_order: nextSortOrder,
        allow_photo_upload: newSecretEvidenceRequired,
      })
      .select("id")
      .single();
    setBusy(false);
    if (createError || !data) {
      setError(createError?.message ?? "Couldn't add that secret mission.");
      return;
    }
    setNewSecretTitle("");
    setNewSecretDescription("");
    setNewSecretPoints(10);
    setNewSecretEvidenceRequired(false);
    setSelectedSecretChallengeId(data.id);
    setNotice("Secret mission added. Choose a player and send it now or schedule it.");
    await load();
  }

  async function assignSecretMission(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session || !selectedSecretPlayerId || !selectedSecretChallengeId) {
      setError("Choose one player and one secret mission.");
      return;
    }
    if (session.status === "completed") {
      setError("This game has finished.");
      return;
    }
    let scheduledAt: string;
    if (secretScheduleAt) {
      const when = new Date(secretScheduleAt);
      if (Number.isNaN(when.getTime())) {
        setError("Choose a valid delivery date and time.");
        return;
      }
      scheduledAt = when.toISOString();
    } else {
      scheduledAt = new Date().toISOString();
    }
    const targetPlayer = players.find((item) => item.id === selectedSecretPlayerId);
    setBusy(true); setError(""); setNotice("");
    const { error: assignError } = await supabase.rpc("cc_host_assign_secret_mission", {
      p_session_id: session.id,
      p_player_id: selectedSecretPlayerId,
      p_challenge_id: selectedSecretChallengeId,
      p_scheduled_at: scheduledAt,
    });
    setBusy(false);
    if (assignError) {
      setError(assignError.message);
      return;
    }
    setSecretScheduleAt("");
    const isFuture = new Date(scheduledAt).getTime() > Date.now() && session.status === "live";
    setNotice(isFuture
      ? `Secret mission scheduled for ${targetPlayer?.name ?? "the player"} at ${new Date(scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`
      : `Secret mission ${session.status === "live" ? "sent" : "queued for the start of the game"} to ${targetPlayer?.name ?? "the player"}.`);
    await load();
  }

  async function reviewSecretMission(assignment: SecretMissionAssignment, approve: boolean) {
    const challenge = challenges.find((item) => item.id === assignment.challenge_id);
    const suggested = Number(challenge?.points ?? 0);
    const points = approve
      ? Number(window.prompt(`Points to award for this secret mission (suggested: ${suggested})`, String(suggested)) ?? "-1")
      : 0;
    if (approve && (!Number.isFinite(points) || points < 0)) return;
    setBusy(true); setError(""); setNotice("");
    const { error: reviewError } = await supabase.rpc("cc_host_review_secret_mission", {
      p_assignment_id: assignment.id,
      p_approve: approve,
      p_points: points,
    });
    setBusy(false);
    if (reviewError) { setError(reviewError.message); return; }
    setNotice(approve ? `Secret mission approved for ${points} points.` : "Secret mission rejected. The player can try again.");
    await load();
  }

  const playerById = new Map(players.map((player) => [player.id, player]));
  const challengeById = new Map(challenges.map((challenge) => [challenge.id, challenge]));
  const teamById = new Map(teams.map((team) => [team.id, team]));
  const finalVoteWinner = session?.final_vote_winner_player_id
    ? playerById.get(session.final_vote_winner_player_id)
    : undefined;
  const finalVoteWinnerEvidence = session?.final_vote_winner_evidence_id
    ? evidence.find((item) => item.id === session.final_vote_winner_evidence_id)
    : undefined;
  const finalVoteWinnerChallenge = finalVoteWinnerEvidence
    ? challengeById.get(finalVoteWinnerEvidence.challenge_id)
    : undefined;

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
      <div className="cc-session-page cc-host-game-redesign cc-host-live-integrated">
        <div className="cc-session-topbar">
          <Link to="/host" className="cc-session-back"><ArrowLeft size={17}/> Host Hub</Link>
          <div className="cc-host-topbar-right">
            <span className="cc-host-controls-badge"><span className="cc-host-controls-dot"/> HOST CONTROLS</span>
            <span className={`cc-session-status cc-session-status--${session.status}`}>{session.status === "lobby" ? "LOBBY" : session.status === "live" ? "LIVE" : "COMPLETED"}</span>
          </div>
        </div>

        <section className="cc-host-live-intro" aria-label="Live game overview">
          <div className="cc-host-live-intro-copy">
            <span className="cc-host-live-eyebrow">ONE GAME. EVERYONE PLAYS.</span>
            <h2>Keep the chaos <span>moving.</span></h2>
            <p>Your player experience, with host controls where you need them.</p>
          </div>
          <div className="cc-host-live-role-legend" aria-label="Control colour key">
            <span><i className="cc-host-live-role-dot cc-host-live-role-dot--host" /> Host-only controls</span>
            <span><i className="cc-host-live-role-dot cc-host-live-role-dot--player" /> Player actions</span>
          </div>
        </section>

        {error && <div className="host-alert host-alert--error" role="alert">{error}</div>}
        {notice && <div className="host-alert host-alert--success" role="status">{notice}</div>}

        <nav className="cc-host-game-tabs" aria-label="Game sections">
          <button type="button" className={activeTab === "game" ? "is-active" : ""} aria-current={activeTab === "game" ? "page" : undefined} onClick={() => setActiveTab("game")}><Gamepad2 size={18}/><span>Game</span></button>
          <button type="button" className={activeTab === "leaderboard" ? "is-active" : ""} aria-current={activeTab === "leaderboard" ? "page" : undefined} onClick={() => setActiveTab("leaderboard")}><Medal size={18}/><span>Leaderboard</span></button>
          <button type="button" className={activeTab === "side-challenges" ? "is-active" : ""} aria-current={activeTab === "side-challenges" ? "page" : undefined} onClick={() => setActiveTab("side-challenges")}><ClipboardList size={18}/><span>Side challenges</span>{submissions.filter((item) => item.status === "submitted" && challengeById.get(item.challenge_id)?.kind !== "main").length > 0 && <b className="cc-host-tab-badge">{submissions.filter((item) => item.status === "submitted" && challengeById.get(item.challenge_id)?.kind !== "main").length}</b>}</button>
          <button type="button" className={activeTab === "reward-round" ? "is-active" : ""} aria-current={activeTab === "reward-round" ? "page" : undefined} onClick={() => setActiveTab("reward-round")}><Star size={18}/><span>Reward round</span></button>
          <button type="button" className={`cc-host-controls-tab${activeTab === "host-controls" ? " is-active" : ""}`} aria-current={activeTab === "host-controls" ? "page" : undefined} onClick={() => setActiveTab("host-controls")}><Shield size={18}/><span>Host controls</span></button>
        </nav>

{activeTab === "game" && (
        <section className="cc-session-card cc-session-section cc-host-shared-game-card">
          <div className="cc-session-section-heading cc-host-shared-game-heading">
            <div><div className="cc-section-kicker">PLAYER EXPERIENCE</div><h2>Game</h2><p>You're in the same game space as players. Host-only actions live in their own tab.</p></div>
            <button type="button" className="host-button cc-host-control-shortcut" onClick={() => setActiveTab("host-controls")}><Shield size={15}/> Host controls</button>
          </div>
          {session.host_participates && hostPlayerViewUrl ? (
            <div className="cc-host-embedded-player-shell">
              <div className="cc-host-embedded-player-bar"><span><i/> PLAYING AS HOST</span><button type="button" onClick={() => setActiveTab("host-controls")}>Open host controls <ArrowRight size={14}/></button></div>
              <iframe key={hostPlayerViewUrl} className="cc-host-embedded-player-frame" title={`Player game experience for ${session.name}`} src={hostPlayerViewUrl} />
            </div>
          ) : (
            <div className="cc-host-game-preview-layout">
              <section className="cc-host-game-preview-main">
                {session.status === "lobby" ? (
                  <div className="cc-host-preview-state"><span className="cc-host-preview-kicker">GAME LOBBY</span><h3>Get ready for the chaos</h3><p>Players see a waiting screen until you start the game.</p><div className="cc-host-preview-code">{session.join_code}</div><span>{players.length} / {session.player_limit} players joined</span></div>
                ) : session.status === "completed" ? (
                  <div className="cc-host-preview-state"><span className="cc-host-preview-kicker">GAME COMPLETE</span><h3>That's a wrap!</h3><p>Players can view their final scores and the completed challenge history.</p></div>
                ) : (
                  <article className="cc-host-preview-challenge">
                    <div className="cc-host-preview-challenge-top"><span className="cc-host-preview-kicker">YOUR CHALLENGE</span><span className="cc-host-preview-points">{currentChallenge?.points ?? 0} POINTS ON APPROVAL</span></div>
                    <div className="cc-host-preview-round-label"><span className="cc-player-live-dot"/> ROUND {session.current_round_number} OF {mainRounds.length}</div>
                    <h3>{currentChallenge?.title ?? "Challenge not found"}</h3>
                    <p>{currentChallenge?.description ?? "Check that this session has a main challenge assigned to the current round."}</p>
                    <div className="cc-host-preview-challenge-meta"><span>{currentChallenge?.duration_minutes ?? 0} min</span><span>{currentChallenge?.allow_photo_upload ? "Photo/video evidence required" : "Evidence optional"}</span></div>
                    {currentChallenge?.allow_photo_upload && <div className="cc-host-preview-upload-note"><ClipboardList size={17}/><span>Players can upload photo or video evidence, then submit for host review.</span></div>}
                  </article>
                )}
              </section>
              {session.host_participates ? (
                <aside className="cc-host-join-as-player-panel">
                  <div className="cc-host-player-illustration"><UserRound size={25}/></div>
                  <span className="cc-section-kicker">YOU CAN PLAY TOO</span><h3>Join the player roster</h3>
                  <p>Your player game will open right here. You won't be sent to another tab, and your host tools stay available in the Host Controls section.</p>
                  <label className="cc-host-player-name"><span>Your player name</span><input value={hostPlayerName} maxLength={40} onChange={(event) => setHostPlayerName(event.target.value)} placeholder="Enter your player name"/></label>
                  <button type="button" className="host-button cc-player-mode-action" onClick={() => void openHostPlayerView()} disabled={busy || session.status === "completed"}><Gamepad2 size={17}/>{session.host_player_id ? "Play game as host" : "Join & play game"}</button>
                </aside>
              ) : (
                <aside className="cc-host-join-as-player-panel cc-host-not-participating-panel">
                  <div className="cc-host-player-illustration"><Gamepad2 size={25}/></div><span className="cc-section-kicker">HOST VIEW</span><h3>Same game, host-side view</h3>
                  <p>This preview mirrors the challenge players see. Host participation wasn't enabled for this session, so challenge uploads remain on the player devices.</p>
                  <button type="button" className="host-button cc-host-control-shortcut" onClick={() => setActiveTab("host-controls")}><Shield size={15}/> Manage the game</button>
                </aside>
              )}
            </div>
          )}
        </section>
        )}

{activeTab === "host-controls" && (
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
                <button type="button" className="host-button host-button--lime cc-primary-wide" onClick={() => void startGame()} disabled={busy || players.length === 0 || (session.host_participates && !session.host_player_id) || (session.teams_enabled && players.some((player) => !player.team_id))}>
                  {busy ? <LoaderCircle size={17} className="cc-spin"/> : <Play size={17}/>} Start game
                </button>
                {players.length === 0
                  ? <p className="cc-helper-text">The start button becomes available when the first player joins.</p>
                  : session.host_participates && !session.host_player_id
                    ? <p className="cc-helper-text">Host play is enabled. Join as a player on this page first, then start when everyone's ready.</p>
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
        )}

{activeTab === "leaderboard" && renderHostPlayerTab("leaderboard")}
        {activeTab === "leaderboard" && (
        <section className="cc-session-card cc-session-section">
          <div className="cc-session-section-heading"><div><div className="cc-section-kicker">{session.teams_enabled ? "TEAM SETUP" : "PLAYER LOBBY"}</div><h2>{session.teams_enabled ? "Players & teams" : "Players"}</h2><p>{session.teams_enabled ? (session.host_chooses_teams ? "Assign players to teams." : "See who has joined and which teams they picked.") + ` Team limit: ${session.team_size} players.` : "Everyone who joins this game appears here."}</p></div><span className="cc-count-pill">{players.length} players</span></div>
          {session.teams_enabled && session.host_chooses_teams && session.status === "lobby" && (
            <form className="cc-create-team-form" onSubmit={(event) => void createTeam(event)}>
              <input aria-label="New team name" value={teamName} onChange={(event) => setTeamName(event.target.value)} placeholder="New team name" maxLength={40}/>
              <button className="host-button host-button--secondary" type="submit" disabled={busy || !teamName.trim()}>Create team</button>
            </form>
          )}
          <div className="cc-leaderboard-switch" role="tablist" aria-label="Leaderboard type">
            <button type="button" role="tab" aria-selected={leaderboardScope === "players"} className={leaderboardScope === "players" ? "is-active" : ""} onClick={() => setLeaderboardScope("players")}>Players</button>
            {session.teams_enabled && <button type="button" role="tab" aria-selected={leaderboardScope === "teams"} className={leaderboardScope === "teams" ? "is-active" : ""} onClick={() => setLeaderboardScope("teams")}>Teams</button>}
          </div>
          {session.teams_enabled && teams.length > 0 && leaderboardScope === "teams" ? (
            <div className="cc-team-leaderboard">{teams.map((team) => ({ ...team, score: players.filter((player) => player.team_id === team.id).reduce((sum, player) => sum + player.score, 0), count: players.filter((player) => player.team_id === team.id).length })).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name)).map((team, index) => <div className="cc-team-leaderboard-row" key={team.id}><span className="cc-leaderboard-rank">{index + 1}</span><span className="cc-team-badge"><Users size={18}/></span><span className="cc-player-name"><strong>{team.name}</strong><small>{team.count}/{session.team_size} players</small></span><strong className="cc-leaderboard-score">{team.score}<small> pts</small></strong></div>)}</div>
          ) : (
          <div className="cc-player-table">
            {[...players].sort((a, b) => session.status === "lobby" ? a.joined_at.localeCompare(b.joined_at) : b.score - a.score || a.name.localeCompare(b.name)).map((player, index) => (
              <div className="cc-player-row" key={player.id}>
                <div className="cc-leaderboard-rank">{index + 1}</div><div className="cc-player-avatar">{player.name.slice(0, 1).toUpperCase()}</div>
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
          )}
        </section>
        )}

{activeTab === "reward-round" && (
        <section className="cc-session-card cc-session-section cc-reward-points-section">
          <div className="cc-session-section-heading">
            <div><div className="cc-section-kicker">REWARD POINTS</div><h2>Reward points</h2><p>Choose how to decide the winner. Player voting awards points automatically; host awards and audience cheers are confirmed manually.</p></div>
            <span className="cc-count-pill">{enabledRewardMethods.length} methods enabled</span>
          </div>

          {!activeRewardRound && session.status === "live" && !showRewardSetup && (
            <button type="button" className="host-button host-button--lime" disabled={busy || enabledRewardMethods.length === 0} onClick={() => setShowRewardSetup(true)}><Sparkles size={16}/> Reward Points</button>
          )}

          {!activeRewardRound && showRewardSetup && session.status === "live" && (
            <form className="cc-reward-setup-form" onSubmit={(event) => void startRewardRound(event)}>
              <label><span>Challenge</span><select required value={rewardChallengeId} onChange={(event) => { const nextId = event.target.value; setRewardChallengeId(nextId); const chosen = challenges.find((item) => item.id === nextId); if (chosen) setRewardPoints(chosen.points); }} disabled={busy}>
                <option value="">Choose challenge…</option>{challenges.map((challenge) => <option key={challenge.id} value={challenge.id}>{challenge.kind === "main" ? `Round ${challenge.round_number}` : challenge.kind === "side" ? "Side challenge" : "Secret mission"} · {challenge.title}</option>)}
              </select></label>
              <label><span>Reward method</span><select value={rewardMethod} onChange={(event) => setRewardMethod(event.target.value as RewardMethod)} disabled={busy}>
                {enabledRewardMethods.map((method) => <option key={method} value={method}>{rewardMethodLabel(method)}</option>)}
              </select></label>
              <label><span>Reward players or teams?</span><select value={rewardTargetKind} onChange={(event) => { setRewardTargetKind(event.target.value as RewardTargetKind); setSelectedRewardWinnerIds([]); }} disabled={busy}>
                <option value="player">Individual players</option><option value="team" disabled={!session.teams_enabled || teams.length === 0}>Teams</option>
              </select></label>
              <label><span>Points per winner</span><input type="number" min={0} max={10000} value={rewardPoints} onChange={(event) => setRewardPoints(Number(event.target.value))} disabled={busy}/></label>
              <p className="cc-helper-text">The player screens will switch to the selected reward flow until you release them back to the game. If the vote is tied, every top-voted player/team wins.</p>
              <div className="cc-reward-actions"><button type="button" className="host-button host-button--ghost" disabled={busy} onClick={() => setShowRewardSetup(false)}>Cancel</button><button type="submit" className="host-button host-button--lime" disabled={busy || !rewardChallengeId || enabledRewardMethods.length === 0}>{busy ? <LoaderCircle size={16} className="cc-spin"/> : <Play size={16}/>} Start reward flow</button></div>
            </form>
          )}

          {activeRewardRound && (
            <div className="cc-reward-live-panel">
              <div className="cc-reward-mode-heading"><span className={`cc-reward-mode-icon cc-reward-mode-icon--${activeRewardRound.reward_method}`}>{activeRewardRound.reward_method === "voting" ? "VOTE" : activeRewardRound.reward_method === "host_awards" ? "HOST" : "CHEER"}</span><div><h3>{activeRewardChallenge?.title ?? "Reward round"}</h3><p>{rewardMethodLabel(activeRewardRound.reward_method)} · {activeRewardRound.points} points per winner · {activeRewardRound.target_kind === "team" ? "Teams" : "Players"}</p></div><span className={`cc-reward-status cc-reward-status--${activeRewardRound.status}`}>{activeRewardRound.status === "open" ? "In progress" : "Results shown"}</span></div>

              {activeRewardRound.status === "open" && activeRewardRound.reward_method === "voting" && (
                <>
                  <div className="cc-reward-instructions"><strong>Voting is live</strong><span>Players can choose or change one vote on their own device. The top-voted player/team wins automatically when you close voting.</span><b>{activeRewardVotes.length} vote{activeRewardVotes.length === 1 ? "" : "s"} cast</b></div>
                  <div className="cc-reward-candidate-list">{rewardTargetRows.map((candidate) => <div className="cc-reward-candidate-row" key={candidate.id}><span className="cc-reward-candidate-avatar">{candidate.name.slice(0, 1).toUpperCase()}</span><span className="cc-reward-candidate-copy"><strong>{candidate.name}</strong><small>{candidate.detail}</small></span><span className="cc-reward-vote-total">{rewardVoteCount(candidate.id)} vote{rewardVoteCount(candidate.id) === 1 ? "" : "s"}</span></div>)}</div>
                  <div className="cc-reward-actions"><button type="button" className="host-button host-button--ghost" disabled={busy} onClick={() => void cancelRewardRound()}>Cancel flow</button><button type="button" className="host-button host-button--lime" disabled={busy} onClick={() => void completeRewardRound()}><Check size={16}/> Close voting & award winner(s)</button></div>
                </>
              )}

              {activeRewardRound.status === "open" && activeRewardRound.reward_method !== "voting" && (
                <>
                  <div className="cc-reward-instructions"><strong>{activeRewardRound.reward_method === "audience_cheers" ? "Call out the contenders" : "Select the winners"}</strong><span>{activeRewardRound.reward_method === "audience_cheers" ? "Players' screens explain the rules. Call each name in turn, listen for the loudest cheers, then select the winner or winners below." : "Players are waiting on their devices. Select one or more winners below, then confirm the award."}</span></div>
                  <label className="cc-reward-final-points"><span>Points to award each winner</span><input type="number" min={0} max={10000} value={rewardFinalPoints} onChange={(event) => setRewardFinalPoints(Number(event.target.value))} disabled={busy}/></label>
                  <div className="cc-reward-candidate-list">{rewardTargetRows.map((candidate) => <label className={`cc-reward-candidate-row cc-reward-candidate-row--selectable${selectedRewardWinnerIds.includes(candidate.id) ? " is-selected" : ""}`} key={candidate.id}><input type="checkbox" checked={selectedRewardWinnerIds.includes(candidate.id)} onChange={() => toggleRewardWinner(candidate.id)} disabled={busy}/><span className="cc-reward-candidate-avatar">{candidate.name.slice(0, 1).toUpperCase()}</span><span className="cc-reward-candidate-copy"><strong>{candidate.name}</strong><small>{candidate.detail}</small></span><span className="cc-reward-candidate-score">{candidate.score} pts</span></label>)}</div>
                  <div className="cc-reward-actions"><button type="button" className="host-button host-button--ghost" disabled={busy} onClick={() => void cancelRewardRound()}>Cancel flow</button><button type="button" className="host-button host-button--lime" disabled={busy || selectedRewardWinnerIds.length === 0} onClick={() => void completeRewardRound()}><Check size={16}/> Confirm winners & award points</button></div>
                </>
              )}

              {activeRewardRound.status === "completed" && (
                <>
                  <div className="cc-reward-result-banner"><Trophy size={21}/><div><strong>Points awarded</strong><span>{activeRewardAwards.length ? `${activeRewardAwards.length} winner${activeRewardAwards.length === 1 ? "" : "s"} · ${activeRewardAwards.reduce((sum, award) => sum + award.points_awarded, 0)} total points allocated` : "No votes were cast, so no points were awarded."}</span></div></div>
                  {activeRewardAwards.length > 0 && <div className="cc-reward-winner-list">{activeRewardAwards.map((award) => { const winnerName = award.winner_player_id ? playerById.get(award.winner_player_id)?.name : teamById.get(award.winner_team_id ?? "")?.name; return <div className="cc-reward-winner-row" key={award.id}><span><Crown size={16}/></span><strong>{winnerName ?? "Winner"}</strong><span>+{award.points_awarded} pts{activeRewardRound.reward_method === "voting" ? ` · ${award.votes_received} votes` : ""}</span></div>; })}</div>}
                  <div className="cc-reward-scoreboard"><h4>Updated leaderboard</h4>{[...players].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name)).slice(0, 8).map((player, index) => <div className="cc-reward-score-row" key={player.id} style={{ animationDelay: `${index * 70}ms` }}><span>{index + 1}</span><strong>{player.name}</strong><b>{player.score} pts</b></div>)}</div>
                  <div className="cc-reward-actions"><button type="button" className="host-button host-button--lime" disabled={busy} onClick={() => void returnFromRewardRound()}><ArrowRight size={16}/> Return everyone to game</button></div>
                </>
              )}
            </div>
          )}

          {session.status !== "live" && !activeRewardRound && <p className="cc-helper-text">Start the game before opening a reward flow. Reward methods enabled in setup: {enabledRewardMethods.map(rewardMethodLabel).join(", ") || "none"}.</p>}
        </section>
        )}

{activeTab === "side-challenges" && renderHostPlayerTab("side-challenges")}
        {activeTab === "side-challenges" && (
        <>
        <section className="cc-session-card cc-session-section cc-side-challenge-library">
          <div className="cc-session-section-heading"><div><div className="cc-section-kicker">OPTIONAL MISSIONS</div><h2>Side challenges</h2><p>Extra tasks players can complete between rounds.</p></div><span className="cc-count-pill">{sideChallenges.length} available</span></div>
          {sideChallenges.length === 0 ? <p className="cc-helper-text">No side challenges were added to this game plan.</p> : (
            <div className="cc-host-side-challenge-grid">{sideChallenges.map((challenge) => <article className="cc-host-side-challenge-card" key={challenge.id}>
              <div className="cc-host-side-card-top"><span className="cc-host-side-icon"><Sparkles size={17}/></span><span className="cc-host-points-pill">{challenge.points} pts</span></div>
              <h3>{challenge.title}</h3><p>{challenge.description}</p><small>{challenge.allow_photo_upload ? "Photo/video evidence required" : "Evidence optional"}</small>
            </article>)}</div>
          )}
        </section>
        <section className="cc-session-card cc-session-section cc-secret-management">
          <div className="cc-session-section-heading">
            <div>
              <div className="cc-section-kicker cc-section-kicker--icon"><Shield size={14} /> PRIVATE MISSIONS</div>
              <h2>Secret missions</h2>
              <p>Assign each mission to one player. Leave the delivery time blank to send now, or schedule it for later in the game.</p>
            </div>
            <span className="cc-count-pill">{secretAssignments.filter((item) => item.status === "scheduled").length} scheduled</span>
          </div>

          {session.status !== "completed" && (
            <>
              <form className="cc-secret-assign-form" onSubmit={(event) => void assignSecretMission(event)}>
                <label>
                  <span>Send to one player</span>
                  <select value={selectedSecretPlayerId} onChange={(event) => setSelectedSecretPlayerId(event.target.value)} required disabled={busy || players.length === 0}>
                    <option value="">Choose player…</option>
                    {players.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}
                  </select>
                </label>
                <label>
                  <span>Secret mission</span>
                  <select value={selectedSecretChallengeId} onChange={(event) => setSelectedSecretChallengeId(event.target.value)} required disabled={busy || secretChallenges.length === 0}>
                    <option value="">Choose mission…</option>
                    {secretChallenges.map((challenge) => <option key={challenge.id} value={challenge.id}>{challenge.title} · {challenge.points} pts</option>)}
                  </select>
                </label>
                <label className="cc-secret-time-field">
                  <span><CalendarClock size={14}/> Deliver at (optional)</span>
                  <input type="datetime-local" value={secretScheduleAt} onChange={(event) => setSecretScheduleAt(event.target.value)} disabled={busy}/>
                  <small>Leave blank to send immediately, or queue until the game goes live.</small>
                </label>
                <button type="submit" className="host-button host-button--lime cc-secret-send-button" disabled={busy || !selectedSecretPlayerId || !selectedSecretChallengeId || players.length === 0 || secretChallenges.length === 0}>
                  {busy ? <LoaderCircle size={16} className="cc-spin"/> : <Send size={16}/>} Assign secret mission
                </button>
              </form>

              <details className="cc-secret-create-details">
                <summary>Add a custom secret mission to this game</summary>
                <form className="cc-secret-create-form" onSubmit={(event) => void createSecretChallenge(event)}>
                  <label><span>Mission title</span><input value={newSecretTitle} onChange={(event) => setNewSecretTitle(event.target.value)} maxLength={100} required placeholder="e.g. Get someone to start a conga line"/></label>
                  <label><span>Instructions (private to the assigned player)</span><textarea value={newSecretDescription} onChange={(event) => setNewSecretDescription(event.target.value)} rows={3} maxLength={1000} placeholder="What should this one player do?"/></label>
                  <label><span>Points</span><input type="number" min={0} max={10000} value={newSecretPoints} onChange={(event) => setNewSecretPoints(Number(event.target.value))}/></label>
                  <label className="cc-secret-evidence-checkbox"><span><input type="checkbox" checked={newSecretEvidenceRequired} onChange={(event) => setNewSecretEvidenceRequired(event.target.checked)}/> Require photo/video evidence</span></label>
                  <button type="submit" className="host-button host-button--secondary" disabled={busy || !newSecretTitle.trim()}><Check size={16}/> Add mission</button>
                </form>
              </details>
            </>
          )}

          {secretAssignments.length > 0 ? (
            <div className="cc-secret-assignment-list">
              {secretAssignments.map((assignment) => {
                const player = playerById.get(assignment.player_id);
                const challenge = challengeById.get(assignment.challenge_id);
                const statusLabel = assignment.status === "scheduled"
                  ? `Scheduled · ${new Date(assignment.scheduled_at).toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit" })}`
                  : assignment.status === "sent" ? "Sent to player"
                  : assignment.status === "submitted" ? "Needs review"
                  : assignment.status === "approved" ? `Approved · +${assignment.awarded_points} pts`
                  : assignment.status === "rejected" ? "Rejected · can retry" : "Cancelled";
                return (
                  <article className="cc-secret-assignment-row" key={assignment.id}>
                    <div className="cc-secret-assignment-icon"><Shield size={18}/></div>
                    <div className="cc-secret-assignment-copy">
                      <strong>{challenge?.title ?? "Secret mission"}</strong>
                      <span>For {player?.name ?? "player"}</span>
                      <small>{statusLabel}</small>
                    </div>
                    {evidenceForAssignment(assignment.id).length > 0 && <div className="cc-session-evidence-gallery">
                      <div className="cc-session-evidence-grid">{evidenceForAssignment(assignment.id).map((media) => (
                        <div className="cc-session-evidence-item" key={media.id}>
                          {media.media_type === "video" ? <video src={evidenceUrl(media.storage_path)} controls playsInline preload="metadata" /> : <img src={evidenceUrl(media.storage_path)} alt={`Evidence for ${challenge?.title ?? "secret mission"}`} loading="lazy" />}
                          <div className="cc-session-evidence-meta"><small>{media.media_type === "video" ? "Video evidence" : "Photo evidence"}</small><button type="button" className={media.saved_for_final ? "is-saved" : ""} disabled={busy || Boolean(session.final_vote_completed_at)} onClick={() => void toggleEvidenceFinal(media)}><Heart size={13}/> {media.saved_for_final ? "Saved for final" : "Save for final"}</button></div>
                        </div>
                      ))}</div>
                    </div>}
                    {assignment.status === "submitted" && (
                      <div className="cc-submission-actions">
                        <button type="button" className="host-button host-button--lime" disabled={busy} onClick={() => void reviewSecretMission(assignment, true)}><Check size={15}/> Approve</button>
                        <button type="button" className="host-button host-button--ghost" disabled={busy} onClick={() => void reviewSecretMission(assignment, false)}><X size={15}/> Retry</button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="cc-secret-empty">
              <Shield size={21}/>
              <p>{secretChallenges.length > 0
                ? "No secret missions assigned yet. Pick one player and a mission above."
                : "There are no secret missions in this plan yet. Add one here, or select secret missions in Explore before creating a new game."}</p>
            </div>
          )}
        </section>
        </>
        )}

{activeTab === "host-controls" && (
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
        </section>
        )}

        {activeTab === "host-controls" && (
          <section className="cc-session-card cc-session-section cc-host-main-review-card">
            <div className="cc-session-section-heading"><div><div className="cc-section-kicker">HOST REVIEW</div><h2>Main challenge submissions</h2><p>Review evidence from the main rounds and assign points when approving.</p></div><span className="cc-count-pill">{submissions.filter((item) => item.status === "submitted" && challengeById.get(item.challenge_id)?.kind === "main").length} pending</span></div>
            {submissions.filter((item) => challengeById.get(item.challenge_id)?.kind === "main").length === 0 ? <p className="cc-helper-text">Main challenge submissions will appear here as players submit them.</p> : (
              <div className="cc-submission-list">{submissions.filter((item) => challengeById.get(item.challenge_id)?.kind === "main").map((submission) => {
                const player = playerById.get(submission.player_id);
                const challenge = challengeById.get(submission.challenge_id);
                const submissionMedia = evidenceForChallenge(submission.player_id, submission.challenge_id);
                return <article className="cc-submission-row" key={submission.id}>
                  <div className="cc-submission-info"><strong>{player?.name ?? "Player"}</strong><span>{challenge?.title ?? "Main challenge"}</span><small>{new Date(submission.submitted_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small></div>
                  <span className={`cc-submission-status cc-submission-status--${submission.status}`}>{submission.status === "submitted" ? "Needs review" : submission.status === "approved" ? `+${submission.awarded_points} pts` : "Rejected"}</span>
                  {submissionMedia.length > 0 && <div className="cc-session-evidence-gallery"><strong>{submissionMedia.length} evidence file{submissionMedia.length === 1 ? "" : "s"}</strong><div className="cc-session-evidence-grid">{submissionMedia.map((media) => <div className="cc-session-evidence-item" key={media.id}>{media.media_type === "video" ? <video src={evidenceUrl(media.storage_path)} controls playsInline preload="metadata"/> : <img src={evidenceUrl(media.storage_path)} alt={`Evidence for ${challenge?.title ?? "challenge"}`} loading="lazy"/>}<div className="cc-session-evidence-meta"><small>{media.media_type === "video" ? "Video evidence" : "Photo evidence"}</small><small>Main-round media isn't included in the final vote.</small></div></div>)}</div></div>}
                  {submission.status === "submitted" && <div className="cc-submission-actions"><button type="button" className="host-button host-button--lime" disabled={busy} onClick={() => void reviewSubmission(submission, true)}><Check size={15}/> Approve & award points</button><button type="button" className="host-button host-button--ghost" disabled={busy} onClick={() => void reviewSubmission(submission, false)}><X size={15}/> Reject</button></div>}
                </article>;
              })}</div>
            )}
          </section>
        )}

{activeTab === "reward-round" && renderHostPlayerTab("final")}
        {activeTab === "reward-round" && (
        <section className="cc-session-card cc-session-section cc-session-final-vote-card">
          <div className="cc-session-section-heading"><div><div className="cc-section-kicker">FINAL ROUND</div><h2>Player favourite vote</h2><p>Save media from approved side challenges or secret missions above. Only approved entries marked “Saved for final” appear for players.</p></div><span className="cc-count-pill">{evidence.filter((item) => item.saved_for_final).length} saved</span></div>
          <div className="cc-session-final-vote-summary">
            <div><strong>{session.final_gallery_open ? "Open" : "Hidden"}</strong><span>Gallery visibility</span></div>
            <div><strong>{session.final_vote_completed_at ? "Voting complete" : session.final_voting_open ? "Voting open" : "Voting closed"}</strong><span>Player voting status</span></div>
            <div><strong>{finalVotes.length}</strong><span>Votes cast</span></div>
          </div>
          <div className="cc-session-final-vote-actions">
            {session.final_vote_completed_at
              ? (!session.final_gallery_open && <button type="button" className="host-button host-button--lime" disabled={busy} onClick={() => void setFinalGallery(true, false)}><Heart size={15}/> Show final results</button>)
              : (!session.final_gallery_open || !session.final_voting_open
                ? <button type="button" className="host-button host-button--lime" disabled={busy} onClick={() => void setFinalGallery(true, true)}><Heart size={15}/> Open final gallery & voting</button>
                : <button type="button" className="host-button host-button--secondary" disabled={busy} onClick={() => void setFinalGallery(true, false)}><Flag size={15}/> Close voting & award winner</button>)}
            {session.final_gallery_open && <button type="button" className="host-button host-button--ghost" disabled={busy} onClick={() => void setFinalGallery(false, false)}>Hide gallery</button>}
            <button type="button" className="host-button host-button--secondary" onClick={() => void copyFinalVoteLink()}>Copy player vote link</button>
          </div>
          <p className="cc-helper-text">Players use the Final vote tab on their game page. Each player can choose one favourite and change it until voting closes. Closing the vote automatically awards the winning entry the points configured for its challenge. A tie is resolved by the earliest uploaded winning entry.</p>
          {session.final_vote_completed_at && <div className="cc-session-final-vote-result">
            <strong>{finalVoteWinner ? `${finalVoteWinner.name} won the final vote` : "Final voting completed — no eligible votes"}</strong>
            {finalVoteWinner && <span>{finalVoteWinnerChallenge?.title ?? "Winning entry"} · {session.final_vote_winner_vote_count} vote{session.final_vote_winner_vote_count === 1 ? "" : "s"} · +{session.final_vote_winner_points} points awarded automatically</span>}
          </div>}
        </section>
        )}

        {activeTab === "side-challenges" && (
          <section className="cc-session-card cc-session-section cc-host-side-review-card">
            <div className="cc-session-section-heading"><div><div className="cc-section-kicker">SUBMISSION REVIEW</div><h2>Review side challenges</h2><p>Approve evidence for side challenges here. Side-challenge points are awarded only when final voting closes.</p></div><span className="cc-count-pill">{submissions.filter((item) => item.status === "submitted" && challengeById.get(item.challenge_id)?.kind === "side").length} pending</span></div>
            {submissions.filter((item) => challengeById.get(item.challenge_id)?.kind === "side").length === 0 ? <p className="cc-helper-text">Side-challenge submissions will appear here when players send them.</p> : (
              <div className="cc-submission-list">
                {submissions.filter((submission) => challengeById.get(submission.challenge_id)?.kind === "side").map((submission) => {
                  const player = playerById.get(submission.player_id);
                  const challenge = challengeById.get(submission.challenge_id);
                  const submissionMedia = evidenceForChallenge(submission.player_id, submission.challenge_id);
                  return <article className="cc-submission-row" key={submission.id}>
                    <div className="cc-submission-info"><strong>{player?.name ?? "Player"}</strong><span>{challenge?.title ?? "Side challenge"}</span><small>{new Date(submission.submitted_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small></div>
                    <span className={`cc-submission-status cc-submission-status--${submission.status}`}>{submission.status === "submitted" ? "Needs review" : submission.status === "approved" ? submission.awarded_points > 0 ? `Final vote winner · +${submission.awarded_points} pts` : session.final_vote_completed_at ? "Approved · no vote points" : "Approved · awaiting vote" : "Rejected"}</span>
                    {submissionMedia.length > 0 && <div className="cc-session-evidence-gallery"><strong>{submissionMedia.length} evidence file{submissionMedia.length === 1 ? "" : "s"}</strong><div className="cc-session-evidence-grid">{submissionMedia.map((media) => <div className="cc-session-evidence-item" key={media.id}>{media.media_type === "video" ? <video src={evidenceUrl(media.storage_path)} controls playsInline preload="metadata"/> : <img src={evidenceUrl(media.storage_path)} alt={`Evidence for ${challenge?.title ?? "side challenge"}`} loading="lazy"/>}<div className="cc-session-evidence-meta"><small>{media.media_type === "video" ? "Video evidence" : "Photo evidence"}</small><button type="button" className={media.saved_for_final ? "is-saved" : ""} disabled={busy || Boolean(session.final_vote_completed_at)} onClick={() => void toggleEvidenceFinal(media)}><Heart size={13}/> {media.saved_for_final ? "Saved for final" : "Save for final"}</button></div></div>)}</div></div>}
                    {submission.status === "submitted" && <div className="cc-submission-actions"><button type="button" className="host-button host-button--lime" disabled={busy} onClick={() => void reviewSubmission(submission, true)}><Check size={15}/> Approve for final</button><button type="button" className="host-button host-button--ghost" disabled={busy} onClick={() => void reviewSubmission(submission, false)}><X size={15}/> Reject</button></div>}
                  </article>;
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </HostShell>
  );
}
