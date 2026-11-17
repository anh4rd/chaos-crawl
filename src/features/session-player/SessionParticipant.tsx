import SecretMissionCard from "./SecretMissionCard";
import SessionFeedback from "../../components/session/SessionFeedback";
import SessionSubmission from "../../components/session/SessionSubmission";
import SessionBreak from "../../components/session/SessionBreak";
import SessionNavigation from "../../components/session/SessionNavigation";
import SessionPage from "../../components/session/SessionPage";
import SessionState from "../../components/session/SessionState";
import Icon from "../../components/ui/Icon";
import {
  prepareSessionEvidence,
  uploadSessionEvidence,
} from "../../lib/sessionEvidence";
import PlayerRewardRoundPanel from "./PlayerRewardRoundPanel";
import SecretMissionReview from "./SecretMissionReview";
import SessionFinalGallery from "./SessionFinalGallery";
import SessionLeaderboard from "./SessionLeaderboard";
import SessionSideChallenges from "./SessionSideChallenges";
import type {
  ChallengeInfo,
  FinalGalleryItem,
  PlayerPage,
  SecretMission,
} from "./types";
import { useSessionPlayerData } from "./useSessionPlayerData";
import { useSessionTimer } from "./useSessionTimer";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import SessionMainChallengeCard from "../../components/session/SessionMainChallengeCard";
import GuidedTour, {
  type GuidedTourStep,
} from "../../components/tour/GuidedTour";
import { challengeIcon } from "../../lib/challengeVisuals";
import { supabase } from "../../lib/sessionSupabase";
import "../../styles/PlayerGame.css";
function playerStorageKey(code: string) {
  return `chaos-crawl-session-player:${code.replace(/\D/g, "")}`;
}

export default function SessionParticipant({
  joinCode,
  section: activePage,
  playerToken,
  embedded = false,
  onSectionChange,
  onRecover,
  focusChallengeId: focusedChallenge,
}: {
  joinCode: string;
  section: PlayerPage;
  playerToken?: string;
  embedded?: boolean;
  onSectionChange?: (section: PlayerPage) => void;
  onRecover?: () => void;
  focusChallengeId?: string | null;
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const embeddedHostMode = embedded || searchParams.get("hostEmbed") === "1";
  const focusChallengeId = focusedChallenge ?? searchParams.get("challengeId");
  const code = joinCode.replace(/\D/g, "").slice(0, 6);
  const [storedToken, setStoredToken] = useState(() =>
    localStorage.getItem(playerStorageKey(code)),
  );
  const token = playerToken ?? storedToken;
  const {
    view,
    secretMissions,
    secretReview,
    leaderboard,
    playerRank,
    evidence,
    finalGallery,
    rewardRound,
    loading,
    error,
    setError,
    gamePhotoUrl,
    lastUpdated,
    loadView,
  } = useSessionPlayerData(code, token, activePage);
  const [activeSecretMissionId, setActiveSecretMissionId] = useState<
    string | null
  >(null);
  const [dismissedSecretMissionKeys, setDismissedSecretMissionKeys] = useState<
    string[]
  >([]);
  const [dismissedSecretMissionCardIds, setDismissedSecretMissionCardIds] =
    useState<string[]>([]);
  const [copiedCode, setCopiedCode] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [teamName, setTeamName] = useState("");
  const [tourOpen, setTourOpen] = useState(false);
  const { sharedTimer, sharedTimerError, timerReceivedAt, timerNow } =
    useSessionTimer(view?.session.id, view?.session.status, activePage);

  useEffect(() => {
    setStoredToken(localStorage.getItem(playerStorageKey(code)));
  }, [code]);

  useEffect(() => {
    const playerId = view?.player.id;
    if (!playerId) return;
    const storageKey = `chaos-crawl-dismissed-secret-missions:${code}:${playerId}`;
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
      setDismissedSecretMissionCardIds(
        Array.isArray(parsed) ? parsed.map(String) : [],
      );
    } catch {
      setDismissedSecretMissionCardIds([]);
    }
  }, [code, view?.player.id]);

  useEffect(() => {
    if (!view) return;
    const embeddedQuery = embeddedHostMode ? "?hostEmbed=1" : "";
    if (view.session.final_gallery_open && activePage !== "final") {
      if (onSectionChange) onSectionChange("final");
      else navigate(`/play/${code}/final${embeddedQuery}`, { replace: true });
    } else if (!view.session.final_gallery_open && activePage === "final") {
      if (onSectionChange) onSectionChange("game");
      else navigate(`/play/${code}/game${embeddedQuery}`, { replace: true });
    }
  }, [
    activePage,
    code,
    embeddedHostMode,
    navigate,
    onSectionChange,
    view?.session.final_gallery_open,
  ]);

  useEffect(() => {
    const playerId = view?.player.id;
    if (
      !playerId ||
      activePage !== "game" ||
      view?.session.status !== "live" ||
      rewardRound ||
      sharedTimer?.is_on_break
    )
      return;
    const storageKey = `chaos-crawl-seen-secret-missions:${code}:${playerId}`;
    let seenIds: string[] = [];
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
      if (Array.isArray(parsed)) seenIds = parsed.map(String);
    } catch {
      /* Use in-memory dismissal if local storage is unavailable. */
    }
    const seen = new Set([
      ...seenIds,
      ...dismissedSecretMissionKeys
        .filter((key) => key.startsWith(`${storageKey}:`))
        .map((key) => key.slice(storageKey.length + 1)),
    ]);
    const unseenMission = secretMissions.find(
      (mission) => !seen.has(mission.assignment_id),
    );
    setActiveSecretMissionId(unseenMission?.assignment_id ?? null);
  }, [
    activePage,
    code,
    dismissedSecretMissionKeys,
    rewardRound,
    secretMissions,
    sharedTimer?.is_on_break,
    view?.player.id,
    view?.session.status,
  ]);

  useEffect(() => {
    if (activePage !== "side-challenges" || !focusChallengeId) return;
    const frame = window.requestAnimationFrame(() => {
      document
        .getElementById(`cc-side-challenge-${focusChallengeId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activePage, focusChallengeId, view?.side_challenges.length]);

  async function voteInRewardRound(candidateId: string) {
    if (
      !rewardRound ||
      !token ||
      !code ||
      busyKey !== null ||
      rewardRound.status !== "open"
    )
      return;
    setBusyKey("reward-vote");
    setError("");
    const { error: voteError } = await supabase.rpc(
      "cc_player_cast_session_reward_vote",
      {
        p_join_code: code,
        p_player_token: token,
        p_reward_round_id: rewardRound.id,
        p_target_player_id:
          rewardRound.target_kind === "player" ? candidateId : null,
        p_target_team_id:
          rewardRound.target_kind === "team" ? candidateId : null,
      },
    );
    setBusyKey(null);
    if (voteError) {
      setError(voteError.message);
      return;
    }
    await loadView();
  }

  const currentSubmission = useMemo(() => {
    if (!view?.challenge) return null;
    return (
      view.my_submissions.find(
        (item) => item.challenge_id === view.challenge?.id,
      ) ?? null
    );
  }, [view]);
  const navigatePlayerTour = useCallback(
    (page: string) => {
      if (page !== activePage) {
        if (onSectionChange) onSectionChange(page as PlayerPage);
        else navigate(`/play/${code}/${page}`);
      }
    },
    [activePage, code, navigate, onSectionChange],
  );

  function mediaUrl(path: string) {
    return supabase.storage.from("session-evidence").getPublicUrl(path).data
      .publicUrl;
  }

  function evidenceForChallenge(challengeId: string) {
    return evidence.filter(
      (item) =>
        item.challenge_id === challengeId && item.secret_assignment_id === null,
    );
  }

  function evidenceForSecret(assignmentId: string) {
    return evidence.filter(
      (item) => item.secret_assignment_id === assignmentId,
    );
  }

  async function uploadEvidence(
    event: ChangeEvent<HTMLInputElement>,
    parent:
      | { type: "challenge"; challenge: ChallengeInfo }
      | { type: "secret"; mission: SecretMission },
  ) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file || !view || !token || !code) return;

    const prepared = prepareSessionEvidence(file);
    if (prepared.error || !prepared.data) {
      setError(prepared.error?.message ?? "Choose a supported file.");
      return;
    }
    const parentKey =
      parent.type === "challenge"
        ? parent.challenge.id
        : parent.mission.assignment_id;
    if (
      parent.type === "challenge" &&
      parent.challenge.submission_status === "approved"
    ) {
      setError(
        "This challenge has already been approved, so no more evidence can be added.",
      );
      return;
    }
    if (parent.type === "secret") {
      const finalReview = secretReview?.my_final_reviews.find(
        (item) => item.assignment_id === parent.mission.assignment_id,
      );
      if (parent.mission.status === "approved" || finalReview) {
        setError(
          "This secret mission has a final result, so no more evidence can be added.",
        );
        return;
      }
    }

    setBusyKey(`upload:${parentKey}`);
    setError("");
    const result = await uploadSessionEvidence({
      file,
      sessionId: view.session.id,
      playerId: view.player.id,
      code,
      token,
      challengeId:
        parent.type === "challenge"
          ? parent.challenge.id
          : parent.mission.challenge_id,
      assignmentId:
        parent.type === "secret" ? parent.mission.assignment_id : null,
      metadata: prepared.data,
    });
    setBusyKey(null);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    await loadView();
  }

  async function voteForFinalMedia(item: FinalGalleryItem) {
    if (!token || !code) return;
    setBusyKey(`vote:${item.id}`);
    setError("");
    const { error: voteError } = await supabase.rpc(
      "cc_player_cast_session_final_round_vote",
      {
        p_join_code: code,
        p_player_token: token,
        p_evidence_id: item.id,
      },
    );
    setBusyKey(null);
    if (voteError) {
      setError(voteError.message);
      return;
    }
    await loadView();
  }

  async function chooseTeam(teamId: string) {
    if (!token || !code) return;
    setBusyKey(`team:${teamId}`);
    setError("");
    const { error: chooseError } = await supabase.rpc(
      "cc_player_choose_session_team",
      {
        p_join_code: code,
        p_player_token: token,
        p_team_id: teamId,
      },
    );
    setBusyKey(null);
    if (chooseError) {
      setError(chooseError.message);
      return;
    }
    await loadView();
  }

  async function createTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !code || !teamName.trim()) return;
    setBusyKey("create-team");
    setError("");
    const { error: createError } = await supabase.rpc(
      "cc_player_create_session_team",
      {
        p_join_code: code,
        p_player_token: token,
        p_team_name: teamName.trim(),
      },
    );
    setBusyKey(null);
    if (createError) {
      setError(createError.message);
      return;
    }
    setTeamName("");
    await loadView();
  }

  async function submitChallenge(challenge: ChallengeInfo) {
    if (!token || !code) return;
    if (
      (challenge.kind === "side" || challenge.allow_photo_upload) &&
      evidenceForChallenge(challenge.id).length === 0
    ) {
      setError(
        "Upload at least one photo or video before marking this challenge complete.",
      );
      return;
    }
    setBusyKey(challenge.id);
    setError("");
    const { error: submitError } = await supabase.rpc(
      "cc_player_submit_session_challenge",
      {
        p_join_code: code,
        p_player_token: token,
        p_challenge_id: challenge.id,
      },
    );
    setBusyKey(null);
    if (submitError) {
      setError(submitError.message);
      return;
    }
    await loadView();
  }

  async function submitSecretMission(mission: SecretMission) {
    if (!token || !code) return;
    if (
      secretReview?.my_final_reviews.some(
        (item) => item.assignment_id === mission.assignment_id,
      )
    ) {
      setError(
        "This secret mission has already received a final review result.",
      );
      return;
    }
    if (
      mission.allow_photo_upload &&
      evidenceForSecret(mission.assignment_id).length === 0
    ) {
      setError(
        "Upload at least one photo or video before submitting this secret mission.",
      );
      return;
    }
    setBusyKey(mission.assignment_id);
    setError("");
    const { error: submitError } = await supabase.rpc(
      "cc_player_submit_secret_mission",
      {
        p_join_code: code,
        p_player_token: token,
        p_assignment_id: mission.assignment_id,
      },
    );
    setBusyKey(null);
    if (submitError) {
      setError(submitError.message);
      return;
    }
    await loadView();
  }

  async function voteOnSecretReview(vote: "success" | "fail") {
    if (
      !token ||
      !code ||
      !secretReview?.assignment_id ||
      !secretReview.voting_open
    )
      return;
    setBusyKey("secret-review-vote");
    setError("");
    const { error: voteError } = await supabase.rpc(
      "cc_player_cast_secret_review_vote",
      {
        p_join_code: code,
        p_player_token: token,
        p_assignment_id: secretReview.assignment_id,
        p_vote: vote,
      },
    );
    setBusyKey(null);
    if (voteError) {
      setError(voteError.message);
      return;
    }
    await loadView();
  }

  function playSecretMission(mission: SecretMission) {
    const playerId = view?.player.id;
    if (!playerId) return;
    const storageKey = `chaos-crawl-seen-secret-missions:${code}:${playerId}`;
    const dismissalKey = `${storageKey}:${mission.assignment_id}`;
    setDismissedSecretMissionKeys((keys) =>
      keys.includes(dismissalKey) ? keys : [...keys, dismissalKey],
    );
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
      const seenIds = Array.isArray(parsed) ? parsed.map(String) : [];
      localStorage.setItem(
        storageKey,
        JSON.stringify([...new Set([...seenIds, mission.assignment_id])]),
      );
    } catch {
      /* The mission remains dismissed for this visit. */
    }
    setActiveSecretMissionId(null);
  }

  function dismissCompletedSecretMission(mission: SecretMission) {
    const playerId = view?.player.id;
    if (!playerId) return;
    const storageKey = `chaos-crawl-dismissed-secret-missions:${code}:${playerId}`;
    const nextIds = [
      ...new Set([...dismissedSecretMissionCardIds, mission.assignment_id]),
    ];
    setDismissedSecretMissionCardIds(nextIds);
    try {
      localStorage.setItem(storageKey, JSON.stringify(nextIds));
    } catch {
      setError(
        "The mission was dismissed for this visit, but the dismissal couldn't be saved on this device.",
      );
    }
    playSecretMission(mission);
  }

  async function copyGameCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(true);
      window.setTimeout(() => setCopiedCode(false), 1800);
    } catch {
      setError("Copy isn't available in this browser. Game code: " + code);
    }
  }

  if (embedded && (!token || (!loading && !view)))
    return (
      <SessionState
        title="Your player session needs to reconnect"
        action={
          onRecover && (
            <button type="button" onClick={onRecover}>
              Rejoin as host
            </button>
          )
        }
      >
        {error}
      </SessionState>
    );

  if (!token) {
    return (
      <SessionPage viewerRole="player">
        <SessionState
          title="Rejoin the chaos"
          action={
            <Link className="btn" to={`/join?code=${code}&returning=1`}>
              Rejoin game
            </Link>
          }
        >
          <p>Enter the game code and the mobile number you used to join.</p>
        </SessionState>
      </SessionPage>
    );
  }

  if (embedded && loading && !view)
    return <SessionState title="Loading your player session…" />;

  if (loading && !view) {
    return (
      <SessionPage viewerRole="player">
        <SessionState title="Loading your game…" />
      </SessionPage>
    );
  }

  if (!view) {
    return (
      <SessionPage viewerRole="player">
        <SessionState
          title="We lost your place."
          action={
            <Link className="btn" to={`/join?code=${code}&returning=1`}>
              Rejoin with mobile number
            </Link>
          }
        >
          <p>{error || "Your saved player session could not be found."}</p>
        </SessionState>
      </SessionPage>
    );
  }

  const {
    session,
    player,
    teams,
    challenge,
    side_challenges: sideChallenges,
  } = view;
  const finalRoundTakeover =
    activePage === "final" && session.final_gallery_open;
  const secretReviewTakeover = Boolean(
    secretReview?.open && secretReview.mission,
  );
  const playerTourSteps: GuidedTourStep[] = [
    {
      target: '[data-tour="player-profile"]',
      title: "Your player card",
      body: "Your avatar, team and points live here. Your score updates as approved challenges and reward rounds are completed.",
      page: "game",
    },
    {
      target: '[data-tour="player-navigation"]',
      title: "Move around the game",
      body: "Use these tabs to switch between your current challenge, the leaderboard, side challenges and the final vote when it opens.",
      page: "game",
    },
    {
      target: '[data-tour="player-challenge"]',
      title: "Your main challenge",
      body: "Read the task, instructions and time allowance. The evidence label tells you whether a photo or video is required before you can submit.",
      page: "game",
    },
    {
      target: '[data-tour="player-upload"]',
      title: "Upload and submit",
      body: "Tap the upload control to add a photo or video. Once you've completed the task, mark it complete; your host reviews it before any main-challenge points are awarded.",
      page: "game",
    },
    {
      target: '[data-tour="player-leaderboard"]',
      title: "Track the leaderboard",
      body: "See how you rank against other players and how your team is doing. Scores refresh as the host approves work and awards points.",
      page: "leaderboard",
    },
    {
      target: '[data-tour="player-side-challenges"]',
      title: "Find extra challenges",
      body: "Complete a side challenge and upload evidence to receive 5 points automatically. Tied top submissions also receive the challenge bonus.",
      page: "side-challenges",
    },
    ...(session.final_gallery_open
      ? [
          {
            target: '[data-tour="player-final"]',
            title: "Vote in the final gallery",
            body: "The host opens one side challenge at a time. Vote for a favourite, then review the vote counts, voter identities and updated leaderboard after the host closes voting.",
            page: "final",
          },
        ]
      : []),
  ];
  const teamSelectionAllowed =
    session.teams_enabled &&
    !session.host_chooses_teams &&
    (session.status === "lobby" ||
      (session.status === "live" && !player.team_id));
  const teamLeaderboard = teams
    .map((team) => ({
      ...team,
      score: leaderboard
        .filter((entry) => entry.team_id === team.id)
        .reduce((total, entry) => total + entry.score, 0),
    }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  const activeSecretMission =
    secretMissions.find(
      (mission) => mission.assignment_id === activeSecretMissionId,
    ) ?? null;
  const visibleSecretMissions = secretMissions.filter(
    (mission) => !dismissedSecretMissionCardIds.includes(mission.assignment_id),
  );
  const sharedTimerSeconds =
    sharedTimer &&
    (sharedTimer.is_on_break ||
      sharedTimer.round_number === session.current_round_number)
      ? Math.max(
          0,
          sharedTimer.remaining_seconds -
            (sharedTimer.is_running && timerReceivedAt !== null
              ? Math.floor((timerNow - timerReceivedAt) / 1000)
              : 0),
        )
      : Math.max(0, Number(challenge?.duration_minutes ?? 0) * 60);
  const sharedTimerLabel = `${Math.floor(sharedTimerSeconds / 60)
    .toString()
    .padStart(
      2,
      "0",
    )}:${(sharedTimerSeconds % 60).toString().padStart(2, "0")}`;

  const sessionContent = (
    <>
      {(error || sharedTimerError) && (
        <SessionFeedback message={error || sharedTimerError} />
      )}
      {secretReviewTakeover && secretReview?.mission && (
        <SecretMissionReview
          secretReview={secretReview}
          mediaUrl={mediaUrl}
          busyKey={busyKey}
          voteOnSecretReview={voteOnSecretReview}
          player={player}
        />
      )}
      {!secretReviewTakeover && (
        <>
          {rewardRound && (
            <PlayerRewardRoundPanel
              rewardRound={rewardRound}
              busyKey={busyKey}
              voteInRewardRound={voteInRewardRound}
              player={player}
            />
          )}

          {!rewardRound && activePage === "game" && (
            <>
              {session.status === "lobby" && (
                <SessionState title="Waiting for the host…">
                  <p>
                    You're in <strong>{session.name}</strong>. The host will
                    start the game when everyone is ready.
                  </p>
                  <div className="cc-player-lobby-count">
                    {teams.reduce((sum, team) => sum + team.member_count, 0)}{" "}
                    players in teams · {session.player_limit} player limit
                  </div>
                </SessionState>
              )}

              {session.status === "completed" && (
                <SessionState title="Game over. Chaos achieved.">
                  <p>
                    You finished with <strong>{player.score} points</strong>.
                    Thanks for playing!
                  </p>
                  <Link
                    className="cc-player-inline-link"
                    to={`/play/${code}/leaderboard`}
                    onClick={
                      onSectionChange
                        ? (event) => {
                            event.preventDefault();
                            onSectionChange("leaderboard");
                          }
                        : undefined
                    }
                  >
                    See the final leaderboard →
                  </Link>
                </SessionState>
              )}

              {session.teams_enabled &&
                session.host_chooses_teams &&
                !player.team_id &&
                session.status !== "completed" && (
                  <SessionState title="The host is sorting teams.">
                    <p>
                      Your team will appear here as soon as you're assigned.
                    </p>
                  </SessionState>
                )}

              {teamSelectionAllowed && (
                <section className="cc-player-team-card">
                  <div className="cc-player-section-heading">
                    <div>
                      <span className="cc-player-eyebrow">SQUAD UP</span>
                      <h2>Choose your team</h2>
                    </div>
                    <span className="cc-player-count-chip">
                      {session.team_size} max
                    </span>
                  </div>
                  <div className="cc-player-team-options">
                    {teams.map((team) => {
                      const full =
                        team.member_count >= session.team_size &&
                        player.team_id !== team.id;
                      return (
                        <button
                          type="button"
                          key={team.id}
                          disabled={busyKey !== null || full}
                          className={`cc-player-team-option${player.team_id === team.id ? " is-current" : ""}`}
                          onClick={() => void chooseTeam(team.id)}
                        >
                          <span className="cc-player-team-dot">
                            {team.name.slice(0, 1).toUpperCase()}
                          </span>
                          <span>
                            <strong>{team.name}</strong>
                            <small>
                              {full
                                ? "Team full"
                                : `${team.member_count}/${session.team_size} players`}
                            </small>
                          </span>
                          {player.team_id === team.id && (
                            <Icon
                              name="check-circle2"
                              className="icon--size-19"
                            />
                          )}
                        </button>
                      );
                    })}
                    <form
                      className="cc-player-create-team"
                      onSubmit={(event) => void createTeam(event)}
                    >
                      <input
                        value={teamName}
                        onChange={(event) => setTeamName(event.target.value)}
                        placeholder="Or name a new team…"
                        aria-label="New team name"
                        maxLength={40}
                      />
                      <button
                        type="submit"
                        disabled={busyKey !== null || !teamName.trim()}
                      >
                        {busyKey === "create-team" ? (
                          <Icon
                            name="loader-circle"
                            className="icon--size-17 cc-spin"
                          />
                        ) : (
                          "Create team"
                        )}
                      </button>
                    </form>
                  </div>
                </section>
              )}

              {session.status === "live" && (
                <>
                  {sharedTimer?.is_on_break ? (
                    <SessionBreak
                      label={sharedTimerLabel}
                      running={sharedTimer.is_running}
                    />
                  ) : challenge ? (
                    <SessionMainChallengeCard
                      viewerRole={embedded ? "host" : "player"}
                      title={challenge.title}
                      description={challenge.description}
                      points={challenge.points}
                      round={session.current_round_number}
                      roundCount={session.round_count}
                      durationMinutes={challenge.duration_minutes}
                      timerLabel={sharedTimerLabel}
                      timerCaption={
                        sharedTimer?.is_on_break
                          ? "BREAK"
                          : sharedTimer?.is_running
                            ? "TIME LEFT"
                            : sharedTimer
                              ? "READY"
                              : "TIME"
                      }
                      actionTourTarget="player-upload"
                    >
                      <SessionSubmission
                        title={challenge.title}
                        allowUpload={challenge.allow_photo_upload}
                        evidenceRequired={challenge.allow_photo_upload}
                        evidence={evidenceForChallenge(challenge.id).map(
                          (item) => ({
                            id: item.id,
                            url: mediaUrl(item.storage_path),
                            mediaType: item.media_type,
                            description: `Evidence for ${challenge.title}`,
                          }),
                        )}
                        status={currentSubmission?.status}
                        awardedPoints={currentSubmission?.awarded_points}
                        busy={busyKey !== null}
                        uploading={busyKey === `upload:${challenge.id}`}
                        disabled={session.teams_enabled && !player.team_id}
                        onUpload={(event) =>
                          void uploadEvidence(event, {
                            type: "challenge",
                            challenge,
                          })
                        }
                        onSubmit={() => void submitChallenge(challenge)}
                      />
                    </SessionMainChallengeCard>
                  ) : (
                    <SessionState title="Challenge not ready yet">
                      <p>Ask the host to select a round.</p>
                    </SessionState>
                  )}
                  {visibleSecretMissions.length > 0 && (
                    <section
                      className="cc-player-secret-section"
                      aria-label="Your private secret missions"
                    >
                      <div className="cc-player-secret-list">
                        {visibleSecretMissions.map((mission) => (
                          <SecretMissionCard
                            key={mission.assignment_id}
                            mission={mission}
                            evidence={evidenceForSecret(
                              mission.assignment_id,
                            ).map((item) => ({
                              id: item.id,
                              url: mediaUrl(item.storage_path),
                              mediaType: item.media_type,
                              description: "Your secret mission evidence",
                            }))}
                            finalOutcome={
                              secretReview?.my_final_reviews.find(
                                (item) =>
                                  item.assignment_id === mission.assignment_id,
                              )?.outcome
                            }
                            busy={busyKey !== null}
                            uploading={
                              busyKey === `upload:${mission.assignment_id}`
                            }
                            onUpload={(event) =>
                              void uploadEvidence(event, {
                                type: "secret",
                                mission,
                              })
                            }
                            onSubmit={() => void submitSecretMission(mission)}
                            onDismiss={() =>
                              dismissCompletedSecretMission(mission)
                            }
                          />
                        ))}
                      </div>
                    </section>
                  )}
                </>
              )}
            </>
          )}

          {!rewardRound && activePage === "leaderboard" && (
            <SessionLeaderboard
              session={session}
              leaderboard={leaderboard}
              player={player}
              teamLeaderboard={teamLeaderboard}
            />
          )}

          {!rewardRound && activePage === "side-challenges" && (
            <SessionSideChallenges
              sideChallenges={sideChallenges}
              session={session}
              view={view}
              evidenceForChallenge={evidenceForChallenge}
              busyKey={busyKey}
              uploadEvidence={uploadEvidence}
              player={player}
              submitChallenge={submitChallenge}
              mediaUrl={mediaUrl}
            />
          )}

          {!rewardRound && activePage === "final" && (
            <SessionFinalGallery
              finalGallery={finalGallery}
              mediaUrl={mediaUrl}
              busyKey={busyKey}
              voteForFinalMedia={voteForFinalMedia}
              leaderboard={leaderboard}
              player={player}
              session={session}
              teamLeaderboard={teamLeaderboard}
            />
          )}

          {!embeddedHostMode && !finalRoundTakeover && (
            <div className="cc-player-sync-note">
              <span className="cc-player-live-dot" /> Live updates enabled{" "}
              {lastUpdated && (
                <span>
                  · synced{" "}
                  {lastUpdated.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
              )}
            </div>
          )}

          {!embeddedHostMode && !finalRoundTakeover && (
            <button
              type="button"
              className="cc-player-text-button"
              onClick={() => navigate(`/join?code=${code}&returning=1`)}
            >
              <Icon name="rotate-ccw" className="icon--size-15" /> Need to
              rejoin on this device?
            </button>
          )}

          {activeSecretMission &&
            activePage === "game" &&
            session.status === "live" &&
            !rewardRound &&
            !secretReviewTakeover && (
              <div className="cc-player-secret-modal-backdrop">
                <section
                  className="cc-player-secret-modal"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="cc-player-secret-modal-title"
                  aria-describedby="cc-player-secret-modal-description"
                >
                  <div className="cc-player-secret-modal-top">
                    <span className="cc-player-secret-modal-label">
                      SECRET
                      <br />
                      MISSION
                    </span>
                    <span
                      className="cc-player-secret-modal-art"
                      aria-hidden="true"
                    >
                      {challengeIcon(
                        activeSecretMission.title,
                        activeSecretMission.description,
                      )}
                    </span>
                  </div>
                  <h2 id="cc-player-secret-modal-title">
                    {activeSecretMission.title}
                  </h2>
                  <p id="cc-player-secret-modal-description">
                    {activeSecretMission.description}
                  </p>
                  <div className="cc-player-secret-modal-points">
                    +{activeSecretMission.points} points
                  </div>
                  <button
                    type="button"
                    className="cc-player-secret-modal-play"
                    onClick={() => playSecretMission(activeSecretMission)}
                  >
                    Play <Icon name="check" className="icon--size-17" />
                  </button>
                </section>
              </div>
            )}

          {tourOpen && (
            <GuidedTour
              steps={playerTourSteps}
              onNavigate={navigatePlayerTour}
              onClose={() => setTourOpen(false)}
              label="PLAYER TOUR"
            />
          )}
        </>
      )}
    </>
  );
  if (embedded) return sessionContent;
  return (
    <SessionPage
      viewerRole="player"
      profile={
        !secretReviewTakeover
          ? {
              name: player.name,
              subtitle:
                player.team_name ||
                (session.teams_enabled ? "Choose your team" : "Solo player"),
              avatarUrl: player.avatar_url,
              score: player.score,
              rank: playerRank,
            }
          : null
      }
      game={
        !finalRoundTakeover && !secretReviewTakeover
          ? {
              name: session.name,
              code,
              photoUrl: gamePhotoUrl,
              copied: copiedCode,
              onCopy: () => void copyGameCode(),
            }
          : null
      }
      toolbar={
        !embeddedHostMode && !finalRoundTakeover && !secretReviewTakeover ? (
          <button
            type="button"
            className="session-page__tour"
            onClick={() => setTourOpen(true)}
          >
            ✦ How to play / Take a tour
          </button>
        ) : null
      }
      navigation={
        !embeddedHostMode && !finalRoundTakeover && !secretReviewTakeover ? (
          <SessionNavigation
            active={activePage}
            showFinal={session.final_gallery_open}
            challengeCount={sideChallenges.length}
            countLabel={`${sideChallenges.length} available challenges`}
            tourTarget="player-navigation"
            hrefFor={(section) => `/play/${code}/${section}`}
          />
        ) : null
      }
    >
      {sessionContent}
    </SessionPage>
  );
}
