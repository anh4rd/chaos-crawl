import { useClipboard } from "../../components/ui/useClipboard";
import { useHostScoreAdjustments } from "./useHostScoreAdjustments";
import { useNavigationFocus } from "../../components/ui/useNavigationFocus";
import Button from "../../components/ui/Button";
import HostPointsOverview, { type PointsChallenge } from "./HostPointsOverview";
import HostReviewOverview, { type ReviewFilter } from "./HostReviewOverview";
import { useHostTour } from "./useHostTour";
import SessionChallengeCard from "../../components/session/SessionChallengeCard";
import SessionFeedback from "../../components/session/SessionFeedback";
import SessionNavigation from "../../components/session/SessionNavigation";
import SessionPage from "../../components/session/SessionPage";
import SessionReview from "../../components/session/SessionReview";
import SessionRewardRound from "../../components/session/SessionRewardRound";
import SessionState from "../../components/session/SessionState";
import SessionTourPrompt from "../../components/session/SessionTourPrompt";
import SessionMemories from "../../components/session/SessionMemories";
import type { SessionMemoryItem } from "../../components/session/types";
import TabPanel from "../../components/ui/TabPanel";
import Icon from "../../components/ui/Icon";
import { sessionEvidenceUrl } from "../../lib/sessionMedia";
import { downloadSessionEvidence } from "../../lib/sessionEvidence";
import SessionParticipant from "../session-player/SessionParticipant";
import type { PlayerPage } from "../session-player/types";
import BreakTimerEditor from "./BreakTimerEditor";
import ChallengeEditor from "./ChallengeEditor";
import HostFinalRound from "./HostFinalRound";
import HostGameSchedule from "./HostGameSchedule";
import MissionAssignmentForm from "./MissionAssignmentForm";
import MissionCreationForm from "./MissionCreationForm";
import HostAddSideChallengeCard from "./HostAddSideChallengeCard";
import HostSideChallengeDialog from "./HostSideChallengeDialog";
import SessionInvite from "../../components/session/SessionInvite";
import HostLobby from "./HostLobby";
import HostMainSubmissions from "./HostMainSubmissions";
import HostManagement from "./HostManagement";
import HostRewardRound from "./HostRewardRound";
import HostRoundControls from "./HostRoundControls";
import HostControlOverrides from "./HostControlOverrides";
import HostSettings from "./HostSettings";
import HostSecretMissions from "./HostSecretMissions";
import HostSecretReview from "./HostSecretReview";
import HostSecretScreenControls from "./HostSecretScreenControls";
import HostSessionLeaderboard from "./HostSessionLeaderboard";
import HostBreakPanel from "./HostBreakPanel";
import HostRosterManagement from "./HostRosterManagement";
import HostSideSubmissions from "./HostSideSubmissions";
import { rewardPresentation } from "./rewardPresentation";
import RoundOverrideDialog from "./RoundOverrideDialog";
import { buildSecretReviewModel } from "./secretReviewModel";
import { buildHostSessionModel } from "./sessionModel";
import type { HostTab } from "./types";
import { useHostChallengeEditor } from "./useHostChallengeEditor";
import { useHostFinalRound } from "./useHostFinalRound";
import { useHostIdentity } from "./useHostIdentity";
import { useHostLobbyFlow } from "./useHostLobbyFlow";
import { useHostOperation } from "./useHostOperation";
import { useHostParticipation } from "./useHostParticipation";
import { useHostPlan } from "./useHostPlan";
import { useHostRewards } from "./useHostRewards";
import { useHostRoster } from "./useHostRoster";
import { useHostRoundTimer } from "./useHostRoundTimer";
import { useHostSecretMissions } from "./useHostSecretMissions";
import { useHostSecretReview } from "./useHostSecretReview";
import { useHostSessionActions } from "./useHostSessionActions";
import { useHostSessionData } from "./useHostSessionData";
import { useHostSettings } from "./useHostSettings";
import { useHostSideChallengeCreator } from "./useHostSideChallengeCreator";
import { useHostSubmissionReview } from "./useHostSubmissionReview";
import { useSlideshowConnection } from "./useSlideshowConnection";

import { useCallback, useId, useState } from "react";
import { Link } from "react-router-dom";
import SessionMainChallengeCard from "../../components/session/SessionMainChallengeCard";
import SessionPreview from "../../components/session/SessionPreview";
import GuidedTour from "../../components/tour/GuidedTour";
import { upcomingStageModel } from "./upcomingStageModel";
import HostWorkspaceNavigation from "../../components/session/HostWorkspaceNavigation";
import StagePreview from "../../components/session/StagePreview";

const hostManagementSections = [
  { id: "overrides", label: "Controls", icon: "gamepad2" },
  { id: "review", label: "Review", icon: "trophy" },
  { id: "roster", label: "Teams", icon: "users" },
  { id: "schedule", label: "Schedule", icon: "calendar-days" },
  { id: "settings", label: "Settings", icon: "settings" },
  { id: "memories", label: "Memories", icon: "film" },
] as const;
type HostManagementSection = (typeof hostManagementSections)[number]["id"];

export default function HostSession({ sessionId }: { sessionId: string }) {
  const {
    session,
    setSession,
    challenges,
    players,
    teams,
    submissions,
    secretAssignments,
    secretReviewState,
    secretReviewAssignments,
    secretReviewVotes,
    evidence,
    finalVotes,
    finalRoundState,
    finalRoundChallenges,
    rewardRounds,
    rewardVotes,
    rewardAwards,
    loading,
    error: queryError,
    setError: setQueryError,
    load,
  } = useHostSessionData(sessionId);
  const navigateParticipant = useCallback(
    (section: PlayerPage) =>
      setActiveTab(
        section === "final"
          ? "final-round"
          : section === "recap"
            ? "game"
            : section,
      ),
    [],
  );
  const { busy, setBusy } = useHostOperation();
  const [notice, setNotice] = useState("");
  const [copyError, setCopyError] = useState("");
  const [codeCopyTarget, setCodeCopyTarget] = useState<
    "lobby" | "titlebar" | "invite" | null
  >(null);
  const [linkCopyFeedback, setLinkCopyFeedback] = useState(false);
  const [actionError, setError] = useState("");
  const [activeTab, setActiveTab] = useState<HostTab>("game");
  const [tourDismissed, setTourDismissed] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("main");
  const [activeHostSection, setActiveHostSection] =
    useState<HostManagementSection>("overrides");
  const hostManagementId = useId();
  const { navigationRef, restoreFocus } = useNavigationFocus();
  const {
    teamPhotoUrls,
    setTeamPhotoUrls,
    gamePhotoUrl,
    autoplayEnabled,
    decideRewardInGame,
    gameSchedule,
    plannedTasks,
    setPlannedTasks,
    defaultBreakMinutes,
    error: planError,
    setError: setPlanError,
  } = useHostPlan({ session });
  const {
    hostPlayerName,
    hostDisplayName,
    userId,
    error: identityError,
    setError: setIdentityError,
  } = useHostIdentity();
  const isGameOwner = Boolean(userId && session?.host_id === userId);
  const error = actionError || planError || queryError || identityError;
  const dismissError = useCallback(() => {
    setError("");
    setPlanError("");
    setQueryError("");
    setIdentityError("");
  }, [setPlanError, setQueryError, setIdentityError]);
  const { adjustScore, scoreAdjustmentCount } = useHostScoreAdjustments({
    sessionId,
    setBusy,
    setError,
    setNotice,
    load,
  });

  const {
    mainRounds,
    sideChallenges,
    secretChallenges,
    currentChallenge,
    readyTeamsCount,
    unassignedPlayers,
    playerById,
    hostPlayer,
    rankedPlayers,
    headerPlayer,
    headerRank,
    challengeById,
    sideSubmissions,
    teamById,
    finalSideEvidence,
    selectedFinalChallengeId,
    selectedFinalChallengeState,
    selectedFinalChallengeStatus,
    selectedFinalChallenge,
    selectedFinalChallengeEvidence,
    selectedFinalEvidenceIndex,
    selectedFinalEvidence,
    selectedFinalChallengeVotes,
    finalWinningEvidenceIds,
    nextPendingFinalChallenge,
    nextReviewedFinalChallenge,
  } = buildHostSessionModel({
    challenges,
    session,
    teams,
    players,
    submissions,
    evidence,
    finalRoundState,
    finalRoundChallenges,
    finalVotes,
  });
  const currentChallengeArtUrl =
    plannedTasks.find((task) => task.id === currentChallenge?.id)?.artUrl ??
    plannedTasks.find((task) => task.title === currentChallenge?.title)?.artUrl;

  const joinUrl = session
    ? `${window.location.origin}${window.location.pathname}#/join?code=${session.join_code}`
    : "";
  const {
    secretReviewOptions,
    hasPendingSecretReviews,
    selectedSecretReviewAssignmentId,
    selectedSecretReviewAssignment,
    selectedSecretReview,
    secretReviewVotingOpen,
    selectedSecretReviewChallenge,
    selectedSecretReviewEvidence,
    currentSecretReviewEvidenceIndex,
    currentSecretReviewVoteCount,
    hostSecretReviewVote,
  } = buildSecretReviewModel({
    secretAssignments,
    secretReviewAssignments,
    secretReviewState,
    challenges,
    evidence,
    secretReviewVotes,
    session,
  });

  const { copied: codeCopied, copy: copyJoinCode } = useClipboard({
    text: session?.join_code ?? "",
    resetAfterMs: 1800,
  });
  async function copyCode(target: "lobby" | "titlebar" | "invite") {
    if (!session) return;
    const result = await copyJoinCode();
    if (result === "copied") {
      setCodeCopyTarget(target);
      setCopyError("");
    }
    if (result === "failed") {
      setCodeCopyTarget(null);
      setCopyError(`Copy isn't available. Join code: ${session.join_code}`);
    }
  }
  const { copied: linkCopied, copy: copyJoinLink } = useClipboard({
    text: joinUrl,
    resetAfterMs: 1800,
  });
  async function copyLink() {
    const result = await copyJoinLink();
    if (result === "copied") {
      setLinkCopyFeedback(true);
      setCopyError("");
    }
    if (result === "failed") {
      setLinkCopyFeedback(false);
      setCopyError(`Copy isn't available. Game link: ${joinUrl}`);
    }
  }

  function evidenceUrl(path: string) {
    return sessionEvidenceUrl(path);
  }

  function evidenceForChallenge(playerId: string, challengeId: string) {
    return evidence.filter(
      (item) =>
        item.player_id === playerId &&
        item.challenge_id === challengeId &&
        item.secret_assignment_id === null,
    );
  }

  function evidenceForAssignment(assignmentId: string) {
    return evidence.filter(
      (item) => item.secret_assignment_id === assignmentId,
    );
  }
  const {
    hostBreakActive,
    roundClockSeconds,
    roundClockRunning,
    editingBreakTimer,
    setEditingBreakTimer,
    editBreakMinutes,
    setEditBreakMinutes,
    breakResumeRound,
    nextBreakChallenge,
    nextBreakTask,
    nextRoundStartAt,
    nextRoundEndAt,
    plannedBreakAfter,
    upcomingBreakMinutes,
    roundClockText,
    roundTimerHydrated,
    toggleTimer,
    initializeRoundClock,
    startScheduledBreak,
    openBreakTimerEditor,
    saveBreakTimer,
    skipTimerAndReview,
    restartRoundTimer,
    resetRoundTimer,
    setRoundTimerSeconds,
    addRoundTimerMinutes,
  } = useHostRoundTimer({
    mainRounds,
    session,
    plannedTasks,
    gameSchedule,
    defaultBreakMinutes,
    currentChallenge,
    busy,
    setNotice,
    setError,
    setBusy,
    openPointReview: (...args) => openPointReview(...args),
  });
  const {
    rewardChallengeId,
    setRewardChallengeId,
    rewardMethod,
    setRewardMethod,
    showRewardSetup,
    setShowRewardSetup,
    showRewardOverlay,
    setShowRewardOverlay,
    rewardTargetKind,
    setRewardTargetKind,
    rewardPoints,
    setRewardPoints,
    rewardFinalPoints,
    setRewardFinalPoints,
    selectedRewardWinnerIds,
    setSelectedRewardWinnerIds,
    activeRewardRound,
    currentRoundPointsAwarded,
    activeRewardVotes,
    activeRewardAwards,
    activeRewardChallenge,
    hostRewardVoteTargetId,
    rewardTargetRows,
    enabledRewardMethods,
    rewardMethodLabel,
    openPointReview,
    startRewardRound,
    toggleRewardWinner,
    castHostRewardVote,
    completeRewardRound,
    returnFromRewardRound,
    cancelRewardRound,
  } = useHostRewards({
    onReturnToGame: restoreFocus,
    rewardRounds,
    currentChallenge,
    rewardVotes,
    rewardAwards,
    challenges,
    session,
    teams,
    players,
    setError,
    setBusy,
    setNotice,
    load,
    busy,
    ensureHostPlayerToken: (...args) => ensureHostPlayerToken(...args),
  });
  const {
    selectedSecretPlayerId,
    setSelectedSecretPlayerId,
    selectedSecretChallengeId,
    setSelectedSecretChallengeId,
    secretScheduleAt,
    setSecretScheduleAt,
    newSecretTitle,
    setNewSecretTitle,
    newSecretDescription,
    setNewSecretDescription,
    newSecretPoints,
    setNewSecretPoints,
    newSecretEvidenceRequired,
    setNewSecretEvidenceRequired,
    createSecretChallenge,
    assignSecretMission,
    rescheduleSecretMission,
  } = useHostSecretMissions({
    session,
    setBusy,
    setError,
    setNotice,
    challenges,
    load,
    players,
  });
  const {
    selectSecretReviewAssignment,
    openSecretReviewVote,
    reopenSecretReviewVote,
    closeSecretReviewVote,
    advanceSecretReview,
    castHostSecretReviewVote,
    setSecretReviewEvidence,
  } = useHostSecretReview({
    session,
    busy,
    evidence,
    setBusy,
    setError,
    setNotice,
    load,
    secretAssignments,
    challenges,
    secretReviewState,
    ensureHostPlayerToken: (...args) => ensureHostPlayerToken(...args),
    setActiveTab,
  });
  const {
    setFinalGallery,
    advanceFinalChallenge,
    reopenFinalChallengeVoting,
    selectFinalChallenge,
    setFinalSlideshow,
    castHostFinalVote,
  } = useHostFinalRound({
    session,
    setBusy,
    setError,
    setNotice,
    load,
    nextReviewedFinalChallenge,
    nextPendingFinalChallenge,
    selectedFinalChallenge,
    challenges,
    busy,
    finalSideEvidence,
    selectedFinalChallengeStatus,
    ensureHostPlayerToken: (...args) => ensureHostPlayerToken(...args),
    setActiveTab,
  });
  const {
    teamName,
    setTeamName,
    selectedLobbyPlayerId,
    setSelectedLobbyPlayerId,
    teamNameEdits,
    setTeamNameEdits,
    playerNameEdits,
    setPlayerNameEdits,
    renamePlayer,
    updatePlayersPerTeam,
    createTeam,
    renameTeam,
    uploadTeamPhoto,
    assignTeam,
  } = useHostRoster({
    teams,
    players,
    session,
    setBusy,
    setError,
    setNotice,
    setSession,
    load,
    setTeamPhotoUrls,
  });
  const {
    hostPlayerToken,
    focusedHostChallenge,
    setHostAvatarFile,
    hostAvatarPreview,
    setHostAvatarPreview,
    setHostParticipation,
    saveHostAvatar,
    ensureHostPlayerToken,
    openHostPlayerView,
    openHostSideChallengeUpload,
  } = useHostParticipation({
    sessionId,
    session,
    canUseHostPlayer: isGameOwner,
    setBusy,
    setError,
    setNotice,
    setSession,
    hostPlayerName,
    setActiveTab,
    load,
  });
  const { saveSettings } = useHostSettings({
    session,
    setBusy,
    setError,
    setNotice,
    setSession,
    load,
  });
  const { lobbyStep, goToLobbyStep } = useHostLobbyFlow({ sessionId });
  const {
    open: hostTourOpen,
    steps: hostTourSteps,
    start: startHostTour,
    close: closeHostTour,
    navigate: navigateHostTour,
  } = useHostTour({
    status: session?.status,
    onTab: setActiveTab,
    onLobbyStep: goToLobbyStep,
    onHostSection: setActiveHostSection,
  });
  const {
    startOverrideReasons,
    startGame,
    moveToRound,
    finishGame,
    overridePrompt,
    setOverridePrompt,
    startGameOrToggleTimer,
    requestMoveToRound,
    requestStartBreak,
    confirmHostOverride,
  } = useHostSessionActions({
    autoplayEnabled,
    isGameOwner,
    players,
    session,
    teams,
    unassignedPlayers,
    setError,
    setBusy,
    setNotice,
    setSession,
    sessionId,
    mainRounds,
    load,
    busy,
    activeRewardRound,
    hostBreakActive,
    plannedBreakAfter,
    startScheduledBreak,
    initializeRoundClock,
    toggleTimer,
    roundClockSeconds,
    breakResumeRound,
  });
  const { reviewSubmission } = useHostSubmissionReview({
    challenges,
    setError,
    setBusy,
    setNotice,
    load,
  });
  const {
    editingBreakChallenge,
    canEditEquipment,
    setEditingBreakChallenge,
    editChallengeTitle,
    setEditChallengeTitle,
    editChallengeDescription,
    setEditChallengeDescription,
    editChallengeEquipment,
    setEditChallengeEquipment,
    editChallengeDuration,
    setEditChallengeDuration,
    editChallengePoints,
    setEditChallengePoints,
    editChallengeEvidence,
    setEditChallengeEvidence,
    openBreakChallengeEditor,
    saveBreakChallengeEdit,
  } = useHostChallengeEditor({
    nextBreakChallenge,
    nextBreakTask,
    plannedTasks,
    session,
    setBusy,
    setError,
    setNotice,
    setPlannedTasks,
    load,
  });
  const {
    dialogOpen: sideChallengeDialogOpen,
    title: newSideChallengeTitle,
    setTitle: setNewSideChallengeTitle,
    description: newSideChallengeDescription,
    setDescription: setNewSideChallengeDescription,
    points: newSideChallengePoints,
    setPoints: setNewSideChallengePoints,
    duration: newSideChallengeDuration,
    setDuration: setNewSideChallengeDuration,
    openDialog: openSideChallengeDialog,
    closeDialog: closeSideChallengeDialog,
    createSideChallenge,
  } = useHostSideChallengeCreator({
    session,
    challenges,
    busy,
    setBusy,
    setError,
    setNotice,
    load,
  });
  const baseUrl = session
    ? window.location.origin + window.location.pathname
    : "";
  const {
    connected: isFinalSlideshowConnected,
    cast: castFinalSlideshow,
    disconnect: disconnectFinalSlideshow,
  } = useSlideshowConnection({
    url: session ? baseUrl + "#/final-slideshow/" + session.id : null,
    available: Boolean(selectedFinalEvidence),
    setError,
    setNotice,
  });
  const {
    connected: isSecretSlideshowConnected,
    cast: castSecretReviewSlideshow,
    disconnect: disconnectSecretReviewSlideshow,
  } = useSlideshowConnection({
    url: session ? baseUrl + "#/secret-slideshow/" + session.id : null,
    secret: true,
    setError,
    setNotice,
  });

  if (loading) {
    return (
      <SessionPage viewerRole="host">
        <SessionState title="Loading your game session…" />
      </SessionPage>
    );
  }
  if (!session) {
    return (
      <SessionPage viewerRole="host">
        <SessionState
          title="Could not load this game session"
          action={
            <Link className="btn" to="/host">
              Back to Host Hub
            </Link>
          }
        >
          {error && <SessionFeedback message={error} />}
        </SessionState>
      </SessionPage>
    );
  }

  const feedback = (
    <>
      {error && (
        <SessionFeedback
          message={error}
          kind="error"
          onDismiss={dismissError}
        />
      )}
      {copyError && (
        <SessionFeedback
          message={copyError}
          kind="error"
          onDismiss={() => setCopyError("")}
        />
      )}
      <output className="u-visually-hidden" aria-atomic="true">
        {notice}
      </output>
    </>
  );
  const sideChallengeAddAction =
    session.status === "completed" ? null : (
      <HostAddSideChallengeCard
        disabled={busy}
        onClick={() => {
          dismissError();
          openSideChallengeDialog();
        }}
      />
    );

  const lobbyFlow = (
    <HostLobby
      lobbyStep={lobbyStep}
      gamePhotoUrl={gamePhotoUrl}
      session={session}
      joinUrl={joinUrl}
      copyCode={() => copyCode("lobby")}
      copyLink={copyLink}
      codeCopied={codeCopied && codeCopyTarget === "lobby"}
      linkCopied={linkCopied && linkCopyFeedback}
      players={players}
      hostAvatarPreview={hostAvatarPreview}
      setHostAvatarFile={setHostAvatarFile}
      setHostAvatarPreview={setHostAvatarPreview}
      hostPlayerToken={hostPlayerToken}
      isGameOwner={isGameOwner}
      busy={busy}
      setHostParticipation={(participates) =>
        setHostParticipation(participates, { requireAvatar: true })
      }
      ensureHostPlayerToken={() =>
        ensureHostPlayerToken(undefined, { requireAvatar: true })
      }
      saveHostAvatar={saveHostAvatar}
      hostPlayer={hostPlayer}
      teams={teams}
      teamById={teamById}
      updatePlayersPerTeam={updatePlayersPerTeam}
      readyTeamsCount={readyTeamsCount}
      selectedLobbyPlayerId={selectedLobbyPlayerId}
      setSelectedLobbyPlayerId={setSelectedLobbyPlayerId}
      unassignedPlayers={unassignedPlayers}
      teamPhotoUrls={teamPhotoUrls}
      assignTeam={assignTeam}
      createTeam={createTeam}
      teamName={teamName}
      setTeamName={setTeamName}
      goToLobbyStep={goToLobbyStep}
      teamNameEdits={teamNameEdits}
      setTeamNameEdits={setTeamNameEdits}
      renameTeam={renameTeam}
      uploadTeamPhoto={uploadTeamPhoto}
      startGame={startGame}
    />
  );

  const canParticipate = Boolean(
    session.host_participates && hostPlayer && hostPlayerToken,
  );
  function openHostSection(section: HostManagementSection) {
    document.getElementById(`${hostManagementId}-tab-${section}`)?.focus();
    setActiveHostSection(section);
  }
  const sumPoints = (items: { awarded_points: number }[]) =>
    items.reduce((sum, item) => sum + item.awarded_points, 0);
  const mainSubmissions = submissions.filter(
    (item) => challengeById.get(item.challenge_id)?.kind === "main",
  );
  const reviewPending = {
    main: submissions.filter(
      (item) =>
        item.status === "submitted" &&
        challengeById.get(item.challenge_id)?.kind === "main",
    ).length,
    side: sideSubmissions.filter((item) => item.status === "submitted").length,
    secret: secretAssignments.filter((item) => item.status === "submitted")
      .length,
  };
  const evidenceRequired = (kind: ReviewFilter) =>
    challenges.some((item) => item.kind === kind && item.allow_photo_upload) ||
    (kind === "main"
      ? mainSubmissions.length > 0
      : kind === "side"
        ? sideSubmissions.length > 0
        : secretAssignments.length > 0);
  const visibleReviewFilters = (["main", "side", "secret"] as const).filter(
    evidenceRequired,
  );
  const activeReviewFilter = visibleReviewFilters.includes(reviewFilter)
    ? reviewFilter
    : (visibleReviewFilters[0] ?? reviewFilter);
  const hostAwardedPoints = (challengeId: string) => {
    const roundIds = new Set(
      rewardRounds
        .filter(
          (round) =>
            round.challenge_id === challengeId && round.status === "completed",
        )
        .map((round) => round.id),
    );
    return rewardAwards
      .filter((award) => roundIds.has(award.reward_round_id))
      .reduce((sum, award) => sum + award.points_awarded, 0);
  };
  const pointsByChallenge: PointsChallenge[] = challenges
    .map((challenge): PointsChallenge => {
      const entries: PointsChallenge["entries"] = [];
      const playerName = (id: string | null) =>
        playerById.get(id ?? "")?.name ?? "Player";
      const finalVotesFor = (playerId: string) =>
        finalVotes.filter(
          (vote) =>
            vote.challenge_id === challenge.id &&
            evidence.find((item) => item.id === vote.evidence_id)?.player_id ===
              playerId,
        ).length;
      if (challenge.kind === "secret") {
        secretAssignments
          .filter(
            (item) =>
              item.challenge_id === challenge.id && item.awarded_points > 0,
          )
          .forEach((item) =>
            entries.push({
              id: item.id,
              name: playerName(item.player_id),
              points: item.awarded_points,
              votes: secretReviewAssignments.find(
                (review) => review.assignment_id === item.id,
              )?.success_votes,
            }),
          );
      } else {
        submissions
          .filter(
            (item) =>
              item.challenge_id === challenge.id && item.awarded_points > 0,
          )
          .forEach((item) =>
            entries.push({
              id: item.id,
              name: playerName(item.player_id),
              points: item.awarded_points,
              votes:
                challenge.kind === "side"
                  ? finalVotesFor(item.player_id)
                  : undefined,
            }),
          );
      }
      const roundIds = new Set(
        rewardRounds
          .filter((round) => round.challenge_id === challenge.id)
          .map((round) => round.id),
      );
      rewardAwards
        .filter(
          (award) =>
            roundIds.has(award.reward_round_id) && award.points_awarded > 0,
        )
        .forEach((award) =>
          entries.push({
            id: award.id,
            name: award.winner_team_id
              ? (teamById.get(award.winner_team_id)?.name ?? "Team")
              : playerName(award.winner_player_id),
            points: award.points_awarded,
            votes: award.votes_received,
          }),
        );
      return {
        id: challenge.id,
        title: challenge.title,
        kind: challenge.kind,
        entries,
      };
    })
    .filter((item) => item.entries.length > 0);
  const secretMissionForms = (
    <>
      <MissionAssignmentForm
        assignSecretMission={assignSecretMission}
        selectedSecretPlayerId={selectedSecretPlayerId}
        setSelectedSecretPlayerId={setSelectedSecretPlayerId}
        busy={busy}
        players={players}
        selectedSecretChallengeId={selectedSecretChallengeId}
        setSelectedSecretChallengeId={setSelectedSecretChallengeId}
        secretChallenges={secretChallenges}
        secretScheduleAt={secretScheduleAt}
        setSecretScheduleAt={setSecretScheduleAt}
      />
      <MissionCreationForm
        createSecretChallenge={createSecretChallenge}
        newSecretTitle={newSecretTitle}
        setNewSecretTitle={setNewSecretTitle}
        newSecretDescription={newSecretDescription}
        setNewSecretDescription={setNewSecretDescription}
        newSecretPoints={newSecretPoints}
        setNewSecretPoints={setNewSecretPoints}
        newSecretEvidenceRequired={newSecretEvidenceRequired}
        setNewSecretEvidenceRequired={setNewSecretEvidenceRequired}
        busy={busy}
      />
    </>
  );
  const secretReviewControls = (
    <HostSecretReview
      secretReviewOptions={secretReviewOptions}
      votingOpen={secretReviewVotingOpen}
      selectedSecretReview={selectedSecretReview}
      selectedSecretReviewAssignmentId={selectedSecretReviewAssignmentId}
      busy={busy}
      selectSecretReviewAssignment={selectSecretReviewAssignment}
      challenges={challenges}
      secretReviewAssignments={secretReviewAssignments}
      players={players}
      selectedSecretReviewChallenge={selectedSecretReviewChallenge}
      selectedSecretReviewAssignment={selectedSecretReviewAssignment}
      secretReviewVotes={secretReviewVotes}
      reopenSecretReviewVote={reopenSecretReviewVote}
      advanceSecretReview={advanceSecretReview}
      hasPendingSecretReviews={hasPendingSecretReviews}
      currentSecretReviewVoteCount={currentSecretReviewVoteCount}
      closeSecretReviewVote={closeSecretReviewVote}
      session={session}
      openSecretReviewVote={openSecretReviewVote}
    />
  );
  const upcomingStage = upcomingStageModel({
    status: session.status,
    nextRound: nextBreakChallenge,
    currentRound: session.current_round_number,
    onBreak: hostBreakActive,
    breakMinutes: upcomingBreakMinutes,
    resumeRound: breakResumeRound,
  });
  const upcomingStagePreview = upcomingStage && (
    <StagePreview {...upcomingStage}>
      {!hostBreakActive && nextBreakChallenge && (
        <Button
          type="button"
          variant="session-edit"
          fullWidth={false}
          disabled={busy}
          aria-label="Edit next challenge"
          onClick={() => openBreakChallengeEditor(nextBreakChallenge)}
        >
          <Icon name="pencil" className="icon--size-14" />
        </Button>
      )}
    </StagePreview>
  );
  const hostRoundControls = (
    <HostRoundControls
      key={`${session.id}:${session.current_round_number}:${session.status}:${Boolean(activeRewardRound)}:${hostBreakActive}:${currentRoundPointsAwarded}`}
      session={session}
      rewardActive={Boolean(activeRewardRound)}
      openPointReview={openPointReview}
      hostBreakActive={hostBreakActive}
      currentRoundPointsAwarded={currentRoundPointsAwarded}
      roundClockText={roundClockText}
      busy={busy}
      moveToRound={moveToRound}
      breakResumeRound={breakResumeRound}
      requestMoveToRound={requestMoveToRound}
      totalRounds={mainRounds.length}
      requestStartBreak={requestStartBreak}
      roundTimerHydrated={roundTimerHydrated}
      roundClockSeconds={roundClockSeconds}
      roundClockRunning={roundClockRunning}
      restartRoundTimer={restartRoundTimer}
      enabledRewardMethods={enabledRewardMethods}
      startGameOrToggleTimer={startGameOrToggleTimer}
      resetRoundTimer={resetRoundTimer}
      setRoundTimerSeconds={setRoundTimerSeconds}
      addRoundTimerMinutes={addRoundTimerMinutes}
      skipTimerAndReview={skipTimerAndReview}
      onEditBreak={openBreakTimerEditor}
      nextStage={
        hostBreakActive ? nextBreakChallenge?.title : upcomingStage?.title
      }
    />
  );
  const gameTabHostControls = (
    <SessionPreview>
      <HostManagement>
        {hostRoundControls}
        {upcomingStagePreview}
      </HostManagement>
    </SessionPreview>
  );
  const hostBreakView = hostBreakActive ? (
    <>
      <SessionPreview>
        <HostManagement>{hostRoundControls}</HostManagement>
      </SessionPreview>
      <HostBreakPanel
        busy={busy || Boolean(activeRewardRound)}
        nextChallenge={nextBreakChallenge}
        nextRound={breakResumeRound ?? session.current_round_number + 1}
        roundCount={mainRounds.length}
        artUrl={nextBreakTask?.artUrl}
        preparation={nextBreakTask}
        schedule={
          nextBreakChallenge
            ? `Starts ${nextRoundStartAt?.toLocaleTimeString() ?? "when the host resumes"} · ends ${nextRoundEndAt?.toLocaleTimeString() ?? "after the timer"}`
            : undefined
        }
        onEditChallenge={() => {
          if (nextBreakChallenge) openBreakChallengeEditor(nextBreakChallenge);
        }}
      />
    </>
  ) : null;
  const participantSection =
    activeTab === "final-round"
      ? "final"
      : activeTab === "leaderboard" || activeTab === "side-challenges"
        ? activeTab
        : "game";
  return (
    <SessionPage
      viewerRole="host"
      contentTourTarget="host-player-game"
      profile={{
        name:
          hostPlayer?.name ??
          (session.status === "lobby"
            ? hostDisplayName
            : (headerPlayer?.name ?? hostDisplayName)),
        subtitle:
          session.status === "lobby"
            ? "Game host"
            : hostPlayer
              ? (teamById.get(hostPlayer.team_id ?? "")?.name ??
                "Playing in this game")
              : headerPlayer
                ? "Current leader"
                : "Game host",
        avatarUrl:
          (session.status === "lobby" ? hostAvatarPreview || null : null) ??
          hostPlayer?.avatar_url ??
          (session.status === "lobby" ? null : headerPlayer?.avatar_url),
        score:
          session.status === "lobby"
            ? (hostPlayer?.score ?? 0)
            : (headerPlayer?.score ?? 0),
        rank: session.status === "lobby" && !hostPlayer ? null : headerRank,
        showScore: session.status !== "lobby",
        badge:
          hostPlayer || session.status === "lobby"
            ? "HOST"
            : headerPlayer
              ? "LEADER"
              : "HOST",
      }}
      game={
        session.status !== "lobby" &&
        activeTab !== "host-controls" &&
        activeTab !== "reward-round"
          ? {
              name: session.name,
              code: session.join_code,
              photoUrl: gamePhotoUrl,
              tourTarget: "host-overview",
              copied: codeCopied && codeCopyTarget === "titlebar",
              onCopy: () => void copyCode("titlebar"),
            }
          : null
      }
      toolbar={
        session.status !== "lobby" && !tourDismissed ? (
          <HostManagement>
            <SessionTourPrompt
              label="✦ Take the host tour"
              dismissLabel="Dismiss host tour button"
              onStart={startHostTour}
              onDismiss={() => {
                setTourDismissed(true);
                restoreFocus();
              }}
            />
          </HostManagement>
        ) : null
      }
      navigation={
        session.status !== "lobby" ? (
          <SessionNavigation
            elementRef={navigationRef}
            active={
              activeTab === "final-round"
                ? "game"
                : activeTab === "reward-round"
                  ? "host-controls"
                  : activeTab
            }
            showHost
            tourTarget="host-sections"
            onSelect={(section) =>
              setActiveTab(section === "final" ? "final-round" : section)
            }
          />
        ) : undefined
      }
      feedback={showRewardOverlay ? undefined : feedback}
      overlays={
        <>
          {editingBreakChallenge && (
            <ChallengeEditor
              busy={busy}
              error={error}
              onDismissError={dismissError}
              setEditingBreakChallenge={setEditingBreakChallenge}
              saveBreakChallengeEdit={saveBreakChallengeEdit}
              editingBreakChallenge={editingBreakChallenge}
              canEditEquipment={canEditEquipment}
              editChallengeTitle={editChallengeTitle}
              setEditChallengeTitle={setEditChallengeTitle}
              editChallengeDescription={editChallengeDescription}
              setEditChallengeDescription={setEditChallengeDescription}
              editChallengeEquipment={editChallengeEquipment}
              setEditChallengeEquipment={setEditChallengeEquipment}
              editChallengeDuration={editChallengeDuration}
              setEditChallengeDuration={setEditChallengeDuration}
              editChallengePoints={editChallengePoints}
              setEditChallengePoints={setEditChallengePoints}
              editChallengeEvidence={editChallengeEvidence}
              setEditChallengeEvidence={setEditChallengeEvidence}
            />
          )}
          {sideChallengeDialogOpen && (
            <HostSideChallengeDialog
              title={newSideChallengeTitle}
              setTitle={setNewSideChallengeTitle}
              description={newSideChallengeDescription}
              setDescription={setNewSideChallengeDescription}
              points={newSideChallengePoints}
              setPoints={setNewSideChallengePoints}
              duration={newSideChallengeDuration}
              setDuration={setNewSideChallengeDuration}
              busy={busy}
              error={error}
              onDismissError={dismissError}
              onClose={() => {
                closeSideChallengeDialog();
                dismissError();
              }}
              onSubmit={createSideChallenge}
            />
          )}
          {editingBreakTimer && (
            <BreakTimerEditor
              busy={busy}
              setEditingBreakTimer={setEditingBreakTimer}
              saveBreakTimer={saveBreakTimer}
              breakResumeRound={breakResumeRound}
              session={session}
              editBreakMinutes={editBreakMinutes}
              setEditBreakMinutes={setEditBreakMinutes}
              error={error}
              onDismissError={dismissError}
            />
          )}
          {overridePrompt && (
            <RoundOverrideDialog
              busy={busy}
              setOverridePrompt={setOverridePrompt}
              overridePrompt={overridePrompt}
              startOverrideReasons={startOverrideReasons}
              players={players}
              session={session}
              unassignedPlayers={unassignedPlayers}
              autoplayEnabled={autoplayEnabled}
              teams={teams}
              confirmHostOverride={confirmHostOverride}
            />
          )}
          {hostTourOpen && (
            <GuidedTour
              steps={hostTourSteps}
              onNavigate={navigateHostTour}
              onClose={closeHostTour}
              label="HOST TOUR"
            />
          )}
        </>
      }
    >
      {session.status === "lobby" ? (
        <HostManagement>{lobbyFlow}</HostManagement>
      ) : (
        <>
          {canParticipate &&
            activeTab !== "host-controls" &&
            activeTab !== "reward-round" &&
            activeTab !== "leaderboard" && (
              <SessionParticipant
                key={`${session.id}:${hostPlayerToken}`}
                joinCode={session.join_code}
                section={participantSection}
                playerToken={hostPlayerToken ?? undefined}
                embedded
                onSectionChange={navigateParticipant}
                onRecover={() => void openHostPlayerView()}
                focusChallengeId={focusedHostChallenge}
                afterMainChallenge={gameTabHostControls}
                hostBreakView={hostBreakView}
                sideChallengeAddAction={sideChallengeAddAction}
              />
            )}
          {!canParticipate &&
            activeTab === "game" &&
            activeRewardRound &&
            !secretReviewState?.is_open && (
              <SessionRewardRound
                round={rewardPresentation(
                  activeRewardRound,
                  activeRewardChallenge?.title ?? "Reward round",
                  activeRewardVotes,
                  activeRewardAwards,
                  rewardTargetRows,
                  players,
                  teams,
                )}
              />
            )}
          {!canParticipate &&
            activeTab === "game" &&
            !activeRewardRound &&
            !secretReviewState?.is_open &&
            (session.status === "completed" ? (
              <SessionState title="Game over. Chaos achieved." icon="flag">
                <p>This session has finished.</p>
              </SessionState>
            ) : hostBreakActive ? (
              hostBreakView
            ) : (
              <>
                <SessionMainChallengeCard
                  viewerRole="host"
                  title={currentChallenge?.title ?? "Challenge not found"}
                  description={
                    currentChallenge?.description ??
                    "Check that this session has a main challenge assigned to the current round."
                  }
                  artUrl={currentChallengeArtUrl}
                  points={currentChallenge?.points ?? 0}
                  round={session.current_round_number}
                  roundCount={mainRounds.length}
                  durationMinutes={currentChallenge?.duration_minutes ?? 0}
                  timerLabel={roundClockText}
                  timerCaption={
                    hostBreakActive
                      ? "BREAK"
                      : roundClockRunning
                        ? "TIME LEFT"
                        : "READY"
                  }
                  actionTourTarget="host-round-timer"
                />
                {gameTabHostControls}
              </>
            ))}
          {!canParticipate && activeTab === "side-challenges" && (
            <section data-tour="player-side-challenges">
              <h2 className="session-page__heading">Side challenges</h2>
              {sideChallenges.length === 0 && (
                <SessionState title="No side challenges added" />
              )}
              <div className="challenge-list">
                {sideChallenges.map((challenge) => (
                  <SessionChallengeCard
                    key={challenge.id}
                    id={challenge.id}
                    title={challenge.title}
                    description={challenge.description}
                    teamsEnabled={session.teams_enabled}
                  >
                    {isGameOwner && (
                      <Button
                        type="button"
                        variant="session-action"
                        className="session-challenge-card__action"
                        aria-label={`Join and upload evidence for ${challenge.title}`}
                        disabled={busy || session.status !== "live"}
                        onClick={() =>
                          void openHostSideChallengeUpload(challenge)
                        }
                      >
                        <span>Upload Evidence</span>
                        <Icon name="check" className="icon--size-16" />
                      </Button>
                    )}
                  </SessionChallengeCard>
                ))}
                {sideChallengeAddAction}
              </div>
            </section>
          )}
          {!canParticipate &&
            (activeTab === "game" || activeTab === "side-challenges") &&
            session.status !== "completed" && (
              <SessionState
                title="Hosting without playing"
                icon="shield"
                action={
                  isGameOwner ? (
                    <button
                      type="button"
                      className="btn"
                      disabled={busy}
                      onClick={() => void setHostParticipation(true)}
                    >
                      Join and play
                    </button>
                  ) : undefined
                }
              >
                <p>
                  {isGameOwner
                    ? "Join the player list to submit your own evidence and vote. Host controls remain in the Host tab."
                    : "Co-host controls are available in the Host tab. The game owner's player profile is separate."}
                </p>
              </SessionState>
            )}
          {activeTab === "leaderboard" && (
            <HostSessionLeaderboard
              session={session}
              players={players}
              teams={teams}
              busy={busy}
              assignTeam={assignTeam}
              teamById={teamById}
              adjustScore={adjustScore}
              scoreAdjustmentCount={scoreAdjustmentCount}
            />
          )}
          {selectedSecretReviewAssignment &&
            selectedSecretReviewChallenge &&
            ((activeTab === "host-controls" &&
              activeHostSection === "review") ||
              (!canParticipate && activeTab === "game")) && (
              <SessionReview
                title={selectedSecretReviewChallenge.title}
                description={selectedSecretReviewChallenge.description}
                owner={
                  playerById.get(selectedSecretReviewAssignment.player_id)
                    ?.name ?? "Player"
                }
                points={selectedSecretReviewChallenge.points}
                evidence={selectedSecretReviewEvidence.map((item) => ({
                  id: item.id,
                  url: evidenceUrl(item.storage_path),
                  mediaType: item.media_type,
                  description: `Evidence for ${selectedSecretReviewChallenge.title}`,
                }))}
                open={secretReviewVotingOpen}
                vote={hostSecretReviewVote?.vote}
                outcome={
                  secretReviewVotingOpen ? null : selectedSecretReview?.outcome
                }
                votesCast={currentSecretReviewVoteCount}
                successVotes={
                  secretReviewVotingOpen
                    ? null
                    : (selectedSecretReview?.success_votes ?? 0)
                }
                failVotes={
                  secretReviewVotingOpen
                    ? null
                    : (selectedSecretReview?.fail_votes ?? 0)
                }
                busy={busy}
                onVote={
                  canParticipate && secretReviewState?.voting_open
                    ? (vote) => void castHostSecretReviewVote(vote)
                    : undefined
                }
                voters={
                  secretReviewVotingOpen
                    ? []
                    : secretReviewVotes
                        .filter(
                          (vote) =>
                            vote.assignment_id ===
                            selectedSecretReviewAssignmentId,
                        )
                        .map((vote) => ({
                          id: vote.player_id,
                          name:
                            playerById.get(vote.player_id)?.name ?? "Player",
                          vote: vote.vote,
                        }))
                }
                leaderboard={rankedPlayers.map((player) => ({
                  id: player.id,
                  name: player.name,
                  score: player.score,
                  avatarUrl: player.avatar_url,
                }))}
                viewerId={session.host_player_id}
              />
            )}
          <HostManagement>
            {activeTab === "host-controls" && (
              <HostWorkspaceNavigation
                idPrefix={hostManagementId}
                active={activeHostSection}
                items={hostManagementSections.filter(
                  (section) =>
                    section.id !== "memories" || session.status === "completed",
                )}
                onSelect={(id) => {
                  const section = hostManagementSections.find(
                    (item) => item.id === id,
                  );
                  if (section) setActiveHostSection(section.id);
                }}
              />
            )}
            {hostManagementSections.map((section) => (
              <TabPanel
                key={section.id}
                id={`${hostManagementId}-panel-${section.id}`}
                labelledBy={`${hostManagementId}-tab-${section.id}`}
                active={
                  activeTab === "host-controls" &&
                  activeHostSection === section.id
                }
              >
                {activeTab === "host-controls" &&
                  activeHostSection === section.id &&
                  section.id === "overrides" && (
                    <>
                      <HostControlOverrides
                        key={`${session.id}:${session.current_round_number}`}
                        rounds={mainRounds}
                        currentRound={session.current_round_number}
                        status={session.status}
                        busy={busy}
                        rewardActive={Boolean(activeRewardRound)}
                        timerReady={roundTimerHydrated}
                        onBreak={hostBreakActive}
                        timerRunning={roundClockRunning}
                        timerSeconds={roundClockSeconds}
                        timerText={roundClockText}
                        onMoveRound={(round) => requestMoveToRound(round, true)}
                        onToggleTimer={toggleTimer}
                        onResetTimer={resetRoundTimer}
                        onRestartTimer={restartRoundTimer}
                        onSetTimer={setRoundTimerSeconds}
                        onAddMinutes={addRoundTimerMinutes}
                        onEditBreak={openBreakTimerEditor}
                        onStartBreak={requestStartBreak}
                        onEditChallenge={(id) => {
                          const challenge = mainRounds.find(
                            (round) => round.id === id,
                          );
                          if (challenge) openBreakChallengeEditor(challenge);
                        }}
                        onReviewPoints={() => {
                          setShowRewardOverlay(false);
                          setShowRewardSetup(!activeRewardRound);
                          if (!activeRewardRound && currentChallenge) {
                            setRewardChallengeId(currentChallenge.id);
                            setRewardPoints(currentChallenge.points);
                            setRewardTargetKind(
                              session.teams_enabled ? "team" : "player",
                            );
                            setSelectedRewardWinnerIds([]);
                          }
                          setActiveTab("reward-round");
                          restoreFocus();
                        }}
                        onReviewSubmissions={() => openHostSection("review")}
                        onSecretReview={() => openHostSection("overrides")}
                        onSchedule={() => openHostSection("schedule")}
                        onFinish={() => {
                          void finishGame().then((finished) => {
                            if (finished) {
                              setActiveHostSection("memories");
                              restoreFocus();
                            }
                          });
                        }}
                        onMemories={() => openHostSection("memories")}
                        currentRoundPointsAwarded={currentRoundPointsAwarded}
                        resumeRound={breakResumeRound}
                        onNextRound={() =>
                          requestMoveToRound(session.current_round_number + 1)
                        }
                        sideChallengeControls={
                          <HostFinalRound
                            canVote={canParticipate}
                            participantView={canParticipate}
                            selectedFinalChallengeEvidence={
                              selectedFinalChallengeEvidence
                            }
                            sideChallenges={sideChallenges}
                            selectedFinalChallengeId={selectedFinalChallengeId}
                            busy={busy}
                            selectedFinalChallengeStatus={
                              selectedFinalChallengeStatus
                            }
                            selectFinalChallenge={selectFinalChallenge}
                            setFinalGallery={setFinalGallery}
                            selectedFinalChallengeVotes={
                              selectedFinalChallengeVotes
                            }
                            players={players}
                            session={session}
                            selectedFinalChallengeState={
                              selectedFinalChallengeState
                            }
                            reopenFinalChallengeVoting={
                              reopenFinalChallengeVoting
                            }
                            nextPendingFinalChallenge={
                              nextPendingFinalChallenge
                            }
                            advanceFinalChallenge={advanceFinalChallenge}
                            isFinalSlideshowConnected={
                              isFinalSlideshowConnected
                            }
                            selectedFinalEvidenceIndex={
                              selectedFinalEvidenceIndex
                            }
                            setFinalSlideshow={setFinalSlideshow}
                            selectedFinalEvidence={selectedFinalEvidence}
                            disconnectFinalSlideshow={disconnectFinalSlideshow}
                            castFinalSlideshow={castFinalSlideshow}
                            selectedFinalChallenge={selectedFinalChallenge}
                            playerById={playerById}
                            evidenceUrl={evidenceUrl}
                            castHostFinalVote={castHostFinalVote}
                            finalWinningEvidenceIds={finalWinningEvidenceIds}
                            rankedPlayers={rankedPlayers}
                          />
                        }
                        inviteControls={
                          <SessionInvite
                            joinUrl={joinUrl}
                            onCopy={() => copyCode("invite")}
                            copied={codeCopied && codeCopyTarget === "invite"}
                            playerCount={players.length}
                            playerLimit={session.player_limit}
                            teamsEnabled={session.teams_enabled}
                            hostChoosesTeams={session.host_chooses_teams}
                          />
                        }
                        secretMissionControls={
                          <>
                            {secretReviewControls}
                            <HostSecretMissions
                              secretAssignments={secretAssignments}
                              votingAssignmentId={
                                secretReviewVotingOpen
                                  ? selectedSecretReviewAssignmentId
                                  : null
                              }
                              session={session}
                              forms={secretMissionForms}
                              busy={busy}
                              secretChallenges={secretChallenges}
                              playerById={playerById}
                              challengeById={challengeById}
                              evidenceForAssignment={evidenceForAssignment}
                              evidenceUrl={evidenceUrl}
                              rescheduleSecretMission={rescheduleSecretMission}
                            />
                          </>
                        }
                      />
                      {canParticipate && session.final_gallery_open && (
                        <SessionParticipant
                          key={`${session.id}:${hostPlayerToken}:final`}
                          joinCode={session.join_code}
                          section="final"
                          playerToken={hostPlayerToken ?? undefined}
                          embedded
                          onSectionChange={navigateParticipant}
                          onRecover={() => void openHostPlayerView()}
                        />
                      )}
                    </>
                  )}
                {activeTab === "host-controls" &&
                  activeHostSection === section.id &&
                  section.id === "review" && (
                    <>
                      <HostReviewOverview
                        submissionCount={
                          mainSubmissions.length +
                          sideSubmissions.length +
                          secretAssignments.length
                        }
                        pendingCount={
                          reviewPending.main +
                          reviewPending.side +
                          reviewPending.secret
                        }
                        pending={reviewPending}
                        pointsAwarded={
                          [...mainSubmissions, ...sideSubmissions].reduce(
                            (sum, item) => sum + item.awarded_points,
                            0,
                          ) +
                          secretAssignments.reduce(
                            (sum, item) => sum + item.awarded_points,
                            0,
                          )
                        }
                        counts={{
                          main: mainSubmissions.length,
                          side: sideSubmissions.length,
                          secret: secretAssignments.length,
                        }}
                        visible={visibleReviewFilters}
                        filter={activeReviewFilter}
                        onFilter={setReviewFilter}
                      />
                      {activeReviewFilter === "secret" &&
                        secretReviewState?.is_open &&
                        secretReviewState.current_assignment_id ===
                          selectedSecretReviewAssignmentId && (
                          <HostSecretScreenControls
                            isSecretSlideshowConnected={
                              isSecretSlideshowConnected
                            }
                            busy={busy}
                            currentSecretReviewEvidenceIndex={
                              currentSecretReviewEvidenceIndex
                            }
                            setSecretReviewEvidence={setSecretReviewEvidence}
                            selectedSecretReviewEvidence={
                              selectedSecretReviewEvidence
                            }
                            disconnectSecretReviewSlideshow={
                              disconnectSecretReviewSlideshow
                            }
                            castSecretReviewSlideshow={
                              castSecretReviewSlideshow
                            }
                          />
                        )}
                      {activeReviewFilter === "secret" && secretReviewControls}
                      {activeReviewFilter === "main" && (
                        <HostMainSubmissions
                          submissions={submissions}
                          teamById={teamById}
                          challengeById={challengeById}
                          playerById={playerById}
                          evidenceForChallenge={evidenceForChallenge}
                          evidenceUrl={evidenceUrl}
                          busy={busy}
                          reviewSubmission={reviewSubmission}
                        />
                      )}
                      {activeReviewFilter === "side" && (
                        <HostSideSubmissions
                          sideSubmissions={sideSubmissions}
                          teamById={teamById}
                          playerById={playerById}
                          challengeById={challengeById}
                          evidenceForChallenge={evidenceForChallenge}
                          evidenceUrl={evidenceUrl}
                          votingEnabled={session.reward_methods.includes(
                            "voting",
                          )}
                          hostAwardsEnabled={session.reward_methods.includes(
                            "host_awards",
                          )}
                          busy={busy}
                          hostAwardedPoints={hostAwardedPoints}
                          onReviewChallenge={(challengeId) =>
                            void selectFinalChallenge(challengeId).then(() =>
                              openHostSection("overrides"),
                            )
                          }
                          onAwardPoints={(challenge) => {
                            setShowRewardOverlay(false);
                            setRewardChallengeId(challenge.id);
                            setRewardPoints(challenge.points);
                            setRewardMethod("host_awards");
                            setRewardTargetKind(
                              session.teams_enabled ? "team" : "player",
                            );
                            setSelectedRewardWinnerIds([]);
                            setShowRewardSetup(true);
                            setActiveTab("reward-round");
                            restoreFocus();
                          }}
                        />
                      )}
                      <HostPointsOverview
                        challenges={pointsByChallenge}
                        mainPoints={sumPoints(mainSubmissions)}
                        sidePoints={sumPoints(sideSubmissions)}
                        secretPoints={sumPoints(secretAssignments)}
                        teams={teams.map((team) => ({
                          id: team.id,
                          name: team.name,
                          score: players
                            .filter((player) => player.team_id === team.id)
                            .reduce(
                              (sum, player) => sum + player.score,
                              team.manual_score_adjustment,
                            ),
                        }))}
                        players={[...players].sort((a, b) => b.score - a.score)}
                      />
                    </>
                  )}
                {activeTab === "host-controls" &&
                  activeHostSection === section.id &&
                  section.id === "roster" && (
                    <HostRosterManagement
                      session={session}
                      players={players}
                      teams={teams}
                      teamPhotoUrls={teamPhotoUrls}
                      teamName={teamName}
                      setTeamName={setTeamName}
                      teamNameEdits={teamNameEdits}
                      setTeamNameEdits={setTeamNameEdits}
                      playerNameEdits={playerNameEdits}
                      setPlayerNameEdits={setPlayerNameEdits}
                      busy={busy}
                      createTeam={createTeam}
                      renameTeam={renameTeam}
                      renamePlayer={renamePlayer}
                      uploadTeamPhoto={uploadTeamPhoto}
                      assignTeam={assignTeam}
                      updatePlayersPerTeam={updatePlayersPerTeam}
                      joinUrl={joinUrl}
                      copyCode={() => copyCode("invite")}
                      codeCopied={codeCopied && codeCopyTarget === "invite"}
                      adjustScore={adjustScore}
                      scoreAdjustmentCount={scoreAdjustmentCount}
                    />
                  )}
                {activeTab === "host-controls" &&
                  activeHostSection === section.id &&
                  section.id === "schedule" && (
                    <HostGameSchedule
                      startTime={session.start_time}
                      teamsEnabled={session.teams_enabled}
                      onBreak={hostBreakActive}
                      onEditBreak={openBreakTimerEditor}
                      defaultBreakMinutes={defaultBreakMinutes}
                      plannedTasks={plannedTasks}
                      sessionStatus={session.status}
                      currentRound={session.current_round_number}
                      secretAssignments={secretAssignments}
                      secretMissionForms={secretMissionForms}
                      playerById={playerById}
                      schedule={gameSchedule}
                      challenges={challenges}
                      busy={busy}
                      editable={session.status !== "completed"}
                      onEdit={openBreakChallengeEditor}
                    />
                  )}
                {activeTab === "host-controls" &&
                  activeHostSection === section.id &&
                  section.id === "settings" && (
                    <HostSettings
                      key={session.id}
                      session={session}
                      playerCount={players.length}
                      joinUrl={joinUrl}
                      busy={busy}
                      canChangeHostParticipation={isGameOwner}
                      onSave={saveSettings}
                      onHostParticipationChange={setHostParticipation}
                    />
                  )}
                {activeTab === "host-controls" &&
                  activeHostSection === section.id &&
                  section.id === "memories" &&
                  session.status === "completed" && (
                    <SessionMemories
                      assets={evidence.map((item): SessionMemoryItem => ({
                        id: item.id,
                        title:
                          challengeById.get(item.challenge_id)?.title ??
                          "Challenge submission",
                        mediaType: item.media_type,
                        mediaUrl: evidenceUrl(item.storage_path),
                        storagePath: item.storage_path,
                        submittedAt: item.created_at,
                        submittedBy:
                          playerById.get(item.player_id)?.name ?? "Player",
                      }))}
                      heading="Memories from the game."
                      description={`Download original submissions from everyone in ${session.name}, or make a group photo reel to share.`}
                      reelCredit="The whole crew"
                      joinCode={session.join_code}
                      downloadAsset={downloadSessionEvidence}
                    />
                  )}
              </TabPanel>
            ))}
            {(activeTab === "reward-round" || showRewardOverlay) && (
              <HostRewardRound
                feedback={showRewardOverlay ? feedback : undefined}
                currentChallenge={currentChallenge}
                decideRewardInGame={decideRewardInGame}
                canParticipate={canParticipate}
                showRewardOverlay={showRewardOverlay}
                enabledRewardMethods={enabledRewardMethods}
                setShowRewardOverlay={setShowRewardOverlay}
                activeRewardRound={activeRewardRound}
                session={session}
                showRewardSetup={showRewardSetup}
                busy={busy}
                setShowRewardSetup={setShowRewardSetup}
                startRewardRound={startRewardRound}
                rewardChallengeId={rewardChallengeId}
                setRewardChallengeId={setRewardChallengeId}
                challenges={challenges}
                setRewardPoints={setRewardPoints}
                rewardMethod={rewardMethod}
                setRewardMethod={setRewardMethod}
                rewardMethodLabel={rewardMethodLabel}
                rewardTargetKind={rewardTargetKind}
                setRewardTargetKind={setRewardTargetKind}
                setSelectedRewardWinnerIds={setSelectedRewardWinnerIds}
                teams={teams}
                rewardPoints={rewardPoints}
                activeRewardChallenge={activeRewardChallenge}
                activeRewardVotes={activeRewardVotes}
                rewardTargetRows={rewardTargetRows}
                hostRewardVoteTargetId={hostRewardVoteTargetId}
                castHostRewardVote={castHostRewardVote}
                cancelRewardRound={cancelRewardRound}
                completeRewardRound={completeRewardRound}
                rewardFinalPoints={rewardFinalPoints}
                setRewardFinalPoints={setRewardFinalPoints}
                selectedRewardWinnerIds={selectedRewardWinnerIds}
                toggleRewardWinner={toggleRewardWinner}
                activeRewardAwards={activeRewardAwards}
                players={players}
                returnFromRewardRound={returnFromRewardRound}
              />
            )}
          </HostManagement>
        </>
      )}
    </SessionPage>
  );
}
