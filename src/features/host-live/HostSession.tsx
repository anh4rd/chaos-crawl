import { useClipboard } from "../../components/ui/useClipboard";
import { useNavigationFocus } from "../../components/ui/useNavigationFocus";
import Button from "../../components/ui/Button";
import { useHostTour } from "./useHostTour";
import SessionBreak from "../../components/session/SessionBreak";
import SessionChallengeCard from "../../components/session/SessionChallengeCard";
import SessionFeedback from "../../components/session/SessionFeedback";
import SessionNavigation from "../../components/session/SessionNavigation";
import SessionPage from "../../components/session/SessionPage";
import SessionReview from "../../components/session/SessionReview";
import SessionRewardRound from "../../components/session/SessionRewardRound";
import SessionState from "../../components/session/SessionState";
import Icon from "../../components/ui/Icon";
import { sessionEvidenceUrl } from "../../lib/sessionMedia";
import SessionParticipant from "../session-player/SessionParticipant";
import type { PlayerPage } from "../session-player/types";
import BreakTimerEditor from "./BreakTimerEditor";
import ChallengeEditor from "./ChallengeEditor";
import HostFinalRound from "./HostFinalRound";
import SessionInvite from "../../components/session/SessionInvite";
import HostLobby from "./HostLobby";
import HostMainSubmissions from "./HostMainSubmissions";
import HostManagement from "./HostManagement";
import HostRewardRound from "./HostRewardRound";
import HostRoundControls from "./HostRoundControls";
import HostRoundOverview from "./HostRoundOverview";
import HostSecretMissions from "./HostSecretMissions";
import HostSecretReview from "./HostSecretReview";
import HostSecretScreenControls from "./HostSecretScreenControls";
import HostSessionLeaderboard from "./HostSessionLeaderboard";
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
import { useHostSubmissionReview } from "./useHostSubmissionReview";
import { useSlideshowConnection } from "./useSlideshowConnection";

import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import SessionMainChallengeCard from "../../components/session/SessionMainChallengeCard";
import SessionPreview from "../../components/session/SessionPreview";
import GuidedTour from "../../components/tour/GuidedTour";
import { upcomingStageModel } from "./upcomingStageModel";
import StagePreview from "../../components/session/StagePreview";
import RoundPlan from "../../components/session/RoundPlan";
import PanelGrid from "../../components/ui/PanelGrid";

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
      setActiveTab(section === "final" ? "final-round" : section),
    [],
  );
  const { busy, setBusy } = useHostOperation();
  const [notice, setNotice] = useState("");
  const [actionError, setError] = useState("");
  const [activeTab, setActiveTab] = useState<HostTab>("game");
  const { navigationRef, restoreFocus } = useNavigationFocus();
  const {
    teamPhotoUrls,
    setTeamPhotoUrls,
    gamePhotoUrl,
    autoplayEnabled,
    gameSchedule,
    plannedTasks,
    setPlannedTasks,
    defaultBreakMinutes,
    error: planError,
    setError: setPlanError,
  } = useHostPlan({ session });
  const error = actionError || planError || queryError;
  const dismissError = useCallback(() => {
    setError("");
    setPlanError("");
    setQueryError("");
  }, [setPlanError, setQueryError]);

  const { hostPlayerName, hostDisplayName } = useHostIdentity();
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

  const { copy: copyJoinCode } = useClipboard({
    text: session?.join_code ?? "",
  });
  async function copyCode() {
    if (!session) return;
    const result = await copyJoinCode();
    if (result === "copied") setNotice("Join code copied.");
    if (result === "failed") setNotice(`Join code: ${session.join_code}`);
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
    hostJoinChoice,
    setHostAvatarFile,
    hostAvatarPreview,
    setHostAvatarPreview,
    setHostParticipation,
    ensureHostPlayerToken,
    openHostPlayerView,
    openHostSideChallengeUpload,
  } = useHostParticipation({
    sessionId,
    session,
    setBusy,
    setError,
    setNotice,
    setSession,
    hostPlayerName,
    setActiveTab,
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
    nextBreakTask,
    session,
    setBusy,
    setError,
    setNotice,
    setPlannedTasks,
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
      {notice && (
        <SessionFeedback
          message={notice}
          kind="success"
          onDismiss={() => setNotice("")}
        />
      )}
    </>
  );

  const lobbyFlow = (
    <HostLobby
      lobbyStep={lobbyStep}
      gamePhotoUrl={gamePhotoUrl}
      session={session}
      joinUrl={joinUrl}
      copyCode={copyCode}
      players={players}
      hostAvatarPreview={hostAvatarPreview}
      setHostAvatarFile={setHostAvatarFile}
      setHostAvatarPreview={setHostAvatarPreview}
      hostJoinChoice={hostJoinChoice}
      busy={busy}
      setHostParticipation={setHostParticipation}
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
  const upcomingStage = upcomingStageModel({
    status: session.status,
    nextRound: mainRounds[session.current_round_number],
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
          onClick={() => openBreakChallengeEditor(nextBreakChallenge)}
        >
          <Icon name="pencil" className="icon--size-14" /> Edit next challenge
        </Button>
      )}
    </StagePreview>
  );
  const hostRoundControls = (
    <HostRoundControls
      session={session}
      activeRewardRound={activeRewardRound}
      openPointReview={openPointReview}
      hostBreakActive={hostBreakActive}
      currentRoundPointsAwarded={currentRoundPointsAwarded}
      roundClockText={roundClockText}
      busy={busy}
      moveToRound={moveToRound}
      breakResumeRound={breakResumeRound}
      openBreakTimerEditor={openBreakTimerEditor}
      requestMoveToRound={requestMoveToRound}
      mainRounds={mainRounds}
      requestStartBreak={requestStartBreak}
      roundTimerHydrated={roundTimerHydrated}
      roundClockSeconds={roundClockSeconds}
      roundClockRunning={roundClockRunning}
      restartRoundTimer={restartRoundTimer}
      enabledRewardMethods={enabledRewardMethods}
      startGameOrToggleTimer={startGameOrToggleTimer}
      resetRoundTimer={resetRoundTimer}
      skipTimerAndReview={skipTimerAndReview}
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
        name: hostPlayer?.name ?? headerPlayer?.name ?? hostDisplayName,
        subtitle: hostPlayer
          ? (teamById.get(hostPlayer.team_id ?? "")?.name ??
            "Playing in this game")
          : headerPlayer
            ? "Current leader"
            : "Game host",
        avatarUrl: hostPlayer?.avatar_url ?? headerPlayer?.avatar_url,
        score: headerPlayer?.score ?? 0,
        rank: headerRank,
        badge: hostPlayer ? "HOST" : headerPlayer ? "LEADER" : "HOST",
      }}
      game={{
        name: session.name,
        code: session.join_code,
        photoUrl: gamePhotoUrl,
        tourTarget: "host-overview",
        onCopy: () => void copyCode(),
      }}
      toolbar={
        <HostManagement>
          <Button
            variant="session-tour"
            fullWidth={false}
            type="button"
            onClick={startHostTour}
          >
            ✦ Take the host tour
          </Button>
        </HostManagement>
      }
      navigation={
        session.status !== "lobby" ? (
          <SessionNavigation
            elementRef={navigationRef}
            active={
              activeTab === "final-round"
                ? "final"
                : activeTab === "reward-round"
                  ? "host-controls"
                  : activeTab
            }
            showFinal
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
              <SessionBreak label={roundClockText} running={roundClockRunning}>
                {nextBreakChallenge && (
                  <p>
                    Up next: {nextBreakChallenge.title} · starts{" "}
                    {nextRoundStartAt?.toLocaleTimeString() ??
                      "when the host resumes"}{" "}
                    · ends{" "}
                    {nextRoundEndAt?.toLocaleTimeString() ?? "after the timer"}
                  </p>
                )}
              </SessionBreak>
            ) : (
              <>
                <SessionMainChallengeCard
                  viewerRole="host"
                  title={currentChallenge?.title ?? "Challenge not found"}
                  description={
                    currentChallenge?.description ??
                    "Check that this session has a main challenge assigned to the current round."
                  }
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
                    points={challenge.points}
                  >
                    <button
                      type="button"
                      className="btn"
                      disabled={busy || session.status !== "live"}
                      onClick={() =>
                        void openHostSideChallengeUpload(challenge)
                      }
                    >
                      Join & upload evidence
                    </button>
                  </SessionChallengeCard>
                ))}
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
                  <button
                    type="button"
                    className="btn"
                    disabled={busy}
                    onClick={() => void setHostParticipation(true)}
                  >
                    Join and play
                  </button>
                }
              >
                <p>
                  Join the player list to submit your own evidence and vote.
                  Host controls remain in the Host tab.
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
            />
          )}
          {activeTab === "final-round" && (
            <HostFinalRound
              canVote={canParticipate}
              participantView={canParticipate}
              selectedFinalChallengeEvidence={selectedFinalChallengeEvidence}
              sideChallenges={sideChallenges}
              selectedFinalChallengeId={selectedFinalChallengeId}
              busy={busy}
              selectedFinalChallengeStatus={selectedFinalChallengeStatus}
              selectFinalChallenge={selectFinalChallenge}
              setFinalGallery={setFinalGallery}
              selectedFinalChallengeVotes={selectedFinalChallengeVotes}
              players={players}
              session={session}
              selectedFinalChallengeState={selectedFinalChallengeState}
              reopenFinalChallengeVoting={reopenFinalChallengeVoting}
              nextPendingFinalChallenge={nextPendingFinalChallenge}
              advanceFinalChallenge={advanceFinalChallenge}
              isFinalSlideshowConnected={isFinalSlideshowConnected}
              selectedFinalEvidenceIndex={selectedFinalEvidenceIndex}
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
          )}
          {secretReviewState?.is_open &&
            selectedSecretReviewAssignment &&
            selectedSecretReviewChallenge &&
            (activeTab === "host-controls" ||
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
                  canParticipate && secretReviewState.voting_open
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
              <>
                {hostRoundControls}
                {upcomingStagePreview}
              </>
            )}
            {activeTab === "host-controls" && (
              <PanelGrid>
                <SessionInvite
                  joinUrl={joinUrl}
                  onCopy={copyCode}
                  playerCount={players.length}
                  playerLimit={session.player_limit}
                  teamsEnabled={session.teams_enabled}
                  hostChoosesTeams={session.host_chooses_teams}
                />

                <HostRoundOverview
                  session={session}
                  mainRounds={mainRounds}
                  currentChallenge={currentChallenge}
                  busy={busy}
                  requestMoveToRound={requestMoveToRound}
                  activeRewardRound={activeRewardRound}
                  roundTimerHydrated={roundTimerHydrated}
                  hostBreakActive={hostBreakActive}
                  currentRoundPointsAwarded={currentRoundPointsAwarded}
                  enabledRewardMethods={enabledRewardMethods}
                  openPointReview={openPointReview}
                  skipTimerAndReview={skipTimerAndReview}
                  roundClockRunning={roundClockRunning}
                  breakResumeRound={breakResumeRound}
                  requestStartBreak={requestStartBreak}
                  startGameOrToggleTimer={startGameOrToggleTimer}
                  roundClockSeconds={roundClockSeconds}
                  restartRoundTimer={restartRoundTimer}
                  nextBreakChallenge={nextBreakChallenge}
                  openBreakChallengeEditor={openBreakChallengeEditor}
                  finishGame={finishGame}
                />
              </PanelGrid>
            )}
            {(activeTab === "reward-round" || showRewardOverlay) && (
              <HostRewardRound
                feedback={showRewardOverlay ? feedback : undefined}
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
            {activeTab === "host-controls" && (
              <>
                <HostSecretMissions
                  secretAssignments={secretAssignments}
                  votingAssignmentId={
                    secretReviewVotingOpen
                      ? selectedSecretReviewAssignmentId
                      : null
                  }
                  session={session}
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
                  createSecretChallenge={createSecretChallenge}
                  newSecretTitle={newSecretTitle}
                  setNewSecretTitle={setNewSecretTitle}
                  newSecretDescription={newSecretDescription}
                  setNewSecretDescription={setNewSecretDescription}
                  newSecretPoints={newSecretPoints}
                  setNewSecretPoints={setNewSecretPoints}
                  newSecretEvidenceRequired={newSecretEvidenceRequired}
                  setNewSecretEvidenceRequired={setNewSecretEvidenceRequired}
                  playerById={playerById}
                  challengeById={challengeById}
                  evidenceForAssignment={evidenceForAssignment}
                  evidenceUrl={evidenceUrl}
                />
                <HostSecretReview
                  secretReviewOptions={secretReviewOptions}
                  votingOpen={secretReviewVotingOpen}
                  selectedSecretReview={selectedSecretReview}
                  selectedSecretReviewAssignmentId={
                    selectedSecretReviewAssignmentId
                  }
                  busy={busy}
                  selectSecretReviewAssignment={selectSecretReviewAssignment}
                  challenges={challenges}
                  secretReviewAssignments={secretReviewAssignments}
                  players={players}
                  selectedSecretReviewChallenge={selectedSecretReviewChallenge}
                  selectedSecretReviewAssignment={
                    selectedSecretReviewAssignment
                  }
                  secretReviewVotes={secretReviewVotes}
                  reopenSecretReviewVote={reopenSecretReviewVote}
                  advanceSecretReview={advanceSecretReview}
                  hasPendingSecretReviews={hasPendingSecretReviews}
                  currentSecretReviewVoteCount={currentSecretReviewVoteCount}
                  closeSecretReviewVote={closeSecretReviewVote}
                  session={session}
                  openSecretReviewVote={openSecretReviewVote}
                />
              </>
            )}
            {activeTab === "host-controls" && (
              <RoundPlan
                rounds={mainRounds.map((round) => ({
                  id: round.id,
                  round: round.round_number,
                  title: round.title,
                  description: round.description,
                  points: round.points,
                }))}
                currentRound={session.current_round_number}
                interactive={session.status === "live"}
                busy={busy}
                onSelect={(round) => {
                  if (session.status === "live") requestMoveToRound(round);
                }}
              />
            )}
            {activeTab === "host-controls" &&
              secretReviewState?.is_open &&
              secretReviewState.current_assignment_id ===
                selectedSecretReviewAssignmentId && (
                <HostSecretScreenControls
                  isSecretSlideshowConnected={isSecretSlideshowConnected}
                  busy={busy}
                  currentSecretReviewEvidenceIndex={
                    currentSecretReviewEvidenceIndex
                  }
                  setSecretReviewEvidence={setSecretReviewEvidence}
                  selectedSecretReviewEvidence={selectedSecretReviewEvidence}
                  disconnectSecretReviewSlideshow={
                    disconnectSecretReviewSlideshow
                  }
                  castSecretReviewSlideshow={castSecretReviewSlideshow}
                />
              )}
            {activeTab === "host-controls" && (
              <HostMainSubmissions
                submissions={submissions}
                challengeById={challengeById}
                playerById={playerById}
                evidenceForChallenge={evidenceForChallenge}
                evidenceUrl={evidenceUrl}
                busy={busy}
                reviewSubmission={reviewSubmission}
              />
            )}
            {activeTab === "host-controls" && (
              <HostSideSubmissions
                sideSubmissions={sideSubmissions}
                playerById={playerById}
                challengeById={challengeById}
                evidenceForChallenge={evidenceForChallenge}
                evidenceUrl={evidenceUrl}
              />
            )}
          </HostManagement>
        </>
      )}
    </SessionPage>
  );
}
