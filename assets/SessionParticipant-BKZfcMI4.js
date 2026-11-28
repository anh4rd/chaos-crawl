var e=`import { useClipboard } from "../../components/ui/useClipboard";
import { useNavigationFocus } from "../../components/ui/useNavigationFocus";
import { isSecretVotingOpen } from "./votingState";
import ButtonLink from "../../components/ui/ButtonLink";
import Note from "../../components/ui/Note";
import ContentPanel from "../../components/ui/ContentPanel";
import PanelGrid from "../../components/ui/PanelGrid";
import SyncStatus from "../../components/session/SyncStatus";
import SessionBreak from "../../components/session/SessionBreak";
import SessionFeedback from "../../components/session/SessionFeedback";
import SessionNavigation from "../../components/session/SessionNavigation";
import SessionPage from "../../components/session/SessionPage";
import SessionState from "../../components/session/SessionState";
import SessionTourPrompt from "../../components/session/SessionTourPrompt";
import SessionSubmission from "../../components/session/SessionSubmission";
import JoinProgress from "../../components/ui/JoinProgress";
import { sessionEvidenceUrl } from "../../lib/sessionMedia";
import ParticipantTeams from "./ParticipantTeams";
import PlayerRewardRoundPanel from "./PlayerRewardRoundPanel";
import PrivateMissionDialog from "./PrivateMissionDialog";
import SecretMissionCard from "./SecretMissionCard";
import SecretMissionReview from "./SecretMissionReview";
import SessionFinalGallery from "./SessionFinalGallery";
import SessionLeaderboard from "./SessionLeaderboard";
import PlayerMemories from "./PlayerMemories";
import SessionSideChallenges from "./SessionSideChallenges";
import type { PlayerPage } from "./types";
import { useParticipantSubmissions } from "./useParticipantSubmissions";
import { useParticipantTeams } from "./useParticipantTeams";
import { useParticipantVoting } from "./useParticipantVoting";
import { usePrivateMissions } from "./usePrivateMissions";
import { useSessionPlayerData } from "./useSessionPlayerData";
import { useSessionTimer } from "./useSessionTimer";
import { usePlayerNotifications } from "./usePlayerNotifications";
import Button from "../../components/ui/Button";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import SessionMainChallengeCard from "../../components/session/SessionMainChallengeCard";
import GuidedTour, {
  type GuidedTourStep,
} from "../../components/tour/GuidedTour";
function playerStorageKey(code: string) {
  return \`chaos-crawl-session-player:\${code.replace(/\\D/g, "")}\`;
}

export default function SessionParticipant({
  joinCode,
  section: activePage,
  playerToken,
  embedded = false,
  onSectionChange,
  onRecover,
  focusChallengeId: focusedChallenge,
  afterMainChallenge,
  hostBreakView,
  sideChallengeAddAction,
}: {
  joinCode: string;
  section: PlayerPage;
  playerToken?: string;
  embedded?: boolean;
  onSectionChange?: (section: PlayerPage) => void;
  onRecover?: () => void;
  focusChallengeId?: string | null;
  afterMainChallenge?: ReactNode;
  hostBreakView?: ReactNode;
  sideChallengeAddAction?: ReactNode;
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const embeddedHostMode = embedded || searchParams.get("hostEmbed") === "1";
  const focusChallengeId = focusedChallenge ?? searchParams.get("challengeId");
  const code = joinCode.replace(/\\D/g, "").slice(0, 6);
  const [storedToken, setStoredToken] = useState(() =>
    localStorage.getItem(playerStorageKey(code)),
  );
  const token = playerToken ?? storedToken;
  const notifications = usePlayerNotifications(code, token);
  const {
    view,
    portraits,
    secretMissions,
    secretReview,
    leaderboard,
    teamAdjustments,
    playerRank,
    evidence,
    finalGallery,
    rewardRound,
    loading,
    error,
    errorWithArt,
    setError,
    gamePhotoUrl,
    mainChallengeArtUrl,
    lastUpdated,
    loadView,
  } = useSessionPlayerData(code, token, activePage);
  const { copied: copiedCode, copy: copyCode } = useClipboard({
    text: code,
    resetAfterMs: 1800,
  });
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [tourOpen, setTourOpen] = useState(false);
  const [tourDismissed, setTourDismissed] = useState(false);
  const { navigationRef, restoreFocus } = useNavigationFocus();
  const { sharedTimer, sharedTimerError, timerReceivedAt, timerNow } =
    useSessionTimer(view?.session.id, view?.session.status, activePage);
  const finalGalleryOpen = view?.session.final_gallery_open;
  const sessionStatus = view?.session.status;

  useEffect(() => {
    if (sessionStatus === "lobby") setTourOpen(false);
  }, [sessionStatus]);

  useEffect(() => {
    setStoredToken(localStorage.getItem(playerStorageKey(code)));
  }, [code]);

  useEffect(() => {
    if (finalGalleryOpen === undefined || sessionStatus === undefined) return;
    const embeddedQuery = embeddedHostMode ? "?hostEmbed=1" : "";
    if (finalGalleryOpen && activePage !== "final") {
      if (onSectionChange) onSectionChange("final");
      else navigate(\`/play/\${code}/final\${embeddedQuery}\`, { replace: true });
    } else if (activePage === "recap" && sessionStatus !== "completed") {
      if (onSectionChange) onSectionChange("game");
      else navigate(\`/play/\${code}/game\${embeddedQuery}\`, { replace: true });
    }
  }, [
    activePage,
    code,
    embeddedHostMode,
    finalGalleryOpen,
    navigate,
    onSectionChange,
    sessionStatus,
  ]);

  useEffect(() => {
    if (activePage !== "side-challenges" || !focusChallengeId) return;
    const frame = window.requestAnimationFrame(() => {
      document
        .getElementById(\`cc-side-challenge-\${focusChallengeId}\`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activePage, focusChallengeId, view?.side_challenges.length]);

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
        else navigate(\`/play/\${code}/\${page}\`);
      }
    },
    [activePage, code, navigate, onSectionChange],
  );

  function mediaUrl(path: string) {
    return sessionEvidenceUrl(path);
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

  async function copyGameCode() {
    if ((await copyCode()) === "failed") {
      setError("Copy isn't available in this browser. Game code: " + code);
    }
  }

  const { teamName, setTeamName, chooseTeam, createTeam } = useParticipantTeams(
    { token, code, setBusyKey, setError, loadView },
  );
  const { voteInRewardRound, voteForFinalMedia, voteOnSecretReview } =
    useParticipantVoting({
      rewardRound,
      token,
      code,
      busyKey,
      setBusyKey,
      setError,
      loadView,
      secretReview,
    });
  const { uploadEvidence, submitChallenge, submitSecretMission } =
    useParticipantSubmissions({
      view,
      token,
      code,
      setError,
      secretReview,
      setBusyKey,
      loadView,
      evidenceForChallenge: (...args) => evidenceForChallenge(...args),
      evidenceForSecret: (...args) => evidenceForSecret(...args),
    });
  const {
    activeSecretMissionId,
    dismissedSecretMissionCardIds,
    playSecretMission,
    dismissCompletedSecretMission,
  } = usePrivateMissions({
    view,
    code,
    activePage,
    rewardRound,
    sharedTimer,
    secretMissions,
    setError,
  });
  const memoryAssets = useMemo(
    () =>
      evidence.map((item) => {
        const mission = item.secret_assignment_id
          ? secretMissions.find(
              (candidate) =>
                candidate.assignment_id === item.secret_assignment_id,
            )
          : null;
        const sideChallenge = view?.side_challenges.find(
          (candidate) => candidate.id === item.challenge_id,
        );
        const mainChallenge =
          view?.challenge?.id === item.challenge_id ? view.challenge : null;
        return {
          ...item,
          title:
            mission?.title ??
            sideChallenge?.title ??
            mainChallenge?.title ??
            "Challenge submission",
        };
      }),
    [evidence, secretMissions, view],
  );

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
            <Link className="btn" to={\`/join?code=\${code}&returning=1\`}>
              Rejoin game
            </Link>
          }
        >
          <p>
            Enter the game code to rejoin with your phone number or recovery
            code.
          </p>
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
            <Link className="btn" to={\`/join?code=\${code}&returning=1\`}>
              Rejoin game
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
    secretReview?.open || isSecretVotingOpen(secretReview),
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
    {
      target: '[data-tour="player-final"]',
      title: "The final round",
      body: session.final_gallery_open
        ? "The host opens one side challenge at a time. Vote for a favourite, then review the results after voting closes."
        : "The host opens the final round when it is time to celebrate submissions.",
      page: "final",
    },
    ...(session.status === "completed" && !session.final_gallery_open
      ? [
          {
            target: '[data-tour="player-memories"]',
            title: "Keep your memories",
            body: "Download every photo and video you submitted, or make a vertical photo reel to share.",
            page: "recap",
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
        .reduce(
          (total, entry) => total + entry.score,
          teamAdjustments?.find((item) => item.team_id === team.id)
            ?.adjustment ?? 0,
        ),
    }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  const teamScoresUnavailable =
    session.teams_enabled &&
    (teamAdjustments === null ||
      teams.some(
        (team) => !teamAdjustments.some((item) => item.team_id === team.id),
      ));
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
  const sharedTimerLabel = \`\${Math.floor(sharedTimerSeconds / 60)
    .toString()
    .padStart(
      2,
      "0",
    )}:\${(sharedTimerSeconds % 60).toString().padStart(2, "0")}\`;

  const sessionContent = (
    <>
      {(errorWithArt || sharedTimerError) && (
        <SessionFeedback message={errorWithArt || sharedTimerError} />
      )}
      {notifications.error && <SessionFeedback message={notifications.error} />}
      {notifications.notifications.map((notification) => (
        <SessionFeedback
          key={notification.id}
          message={notification.body}
          kind="success"
          onDismiss={() => void notifications.dismiss(notification.id)}
        />
      ))}
      {notifications.canEnablePush && (
        <Button
          type="button"
          variant="session-secondary"
          disabled={notifications.busy}
          onClick={notifications.enablePush}
        >
          Enable game alerts
        </Button>
      )}
      {secretReviewTakeover && secretReview && (
        <SecretMissionReview
          secretReview={secretReview}
          mediaUrl={mediaUrl}
          busyKey={busyKey}
          voteOnSecretReview={voteOnSecretReview}
          player={player}
          portraits={portraits}
        />
      )}
      {!secretReviewTakeover && (
        <>
          {rewardRound && activePage !== "recap" && (
            <PlayerRewardRoundPanel
              rewardRound={rewardRound}
              busyKey={busyKey}
              voteInRewardRound={voteInRewardRound}
              player={player}
              portraits={portraits}
            />
          )}

          {!rewardRound && activePage === "game" && (
            <>
              {session.status === "lobby" && (
                <>
                  <SessionState title="Waiting for the host…">
                    <p>
                      You're in <strong>{session.name}</strong>. The host will
                      start the game when everyone is ready.
                    </p>
                    <Note as="div" variant="participant-count">
                      {teams.reduce((sum, team) => sum + team.member_count, 0)}{" "}
                      players in teams · {session.player_limit} player limit
                    </Note>
                  </SessionState>
                </>
              )}

              {session.status === "completed" && (
                <SessionState title="Game over. Chaos achieved.">
                  <p>
                    You finished with <strong>{player.score} points</strong>.
                    Thanks for playing!
                  </p>
                  <ButtonLink
                    variant="participant-leaderboard"
                    fullWidth={false}
                    to={\`/play/\${code}/leaderboard\`}
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
                  </ButtonLink>
                  {!session.final_gallery_open && (
                    <ButtonLink
                      variant="participant-leaderboard"
                      fullWidth={false}
                      to={\`/play/\${code}/recap\`}
                      onClick={
                        onSectionChange
                          ? (event) => {
                              event.preventDefault();
                              onSectionChange("recap");
                            }
                          : undefined
                      }
                    >
                      Save your game memories →
                    </ButtonLink>
                  )}
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
                <ParticipantTeams
                  session={session}
                  teams={teams}
                  player={player}
                  busyKey={busyKey}
                  chooseTeam={chooseTeam}
                  createTeam={createTeam}
                  teamName={teamName}
                  setTeamName={setTeamName}
                  teamPhotoUrls={portraits.teams}
                />
              )}

              {session.status === "live" && (
                <>
                  {hostBreakView ? (
                    hostBreakView
                  ) : hostBreakView === undefined &&
                    sharedTimer?.is_on_break ? (
                    <SessionBreak
                      label={sharedTimerLabel}
                      running={sharedTimer.is_running}
                    />
                  ) : challenge ? (
                    <>
                      <SessionMainChallengeCard
                        viewerRole={embedded ? "host" : "player"}
                        title={challenge.title}
                        description={challenge.description}
                        artUrl={mainChallengeArtUrl}
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
                              description: \`Evidence for \${challenge.title}\`,
                            }),
                          )}
                          status={currentSubmission?.status}
                          awardedPoints={currentSubmission?.awarded_points}
                          busy={busyKey !== null}
                          uploading={busyKey === \`upload:\${challenge.id}\`}
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
                      {afterMainChallenge}
                    </>
                  ) : (
                    <SessionState title="Challenge not ready yet">
                      <p>Ask the host to select a round.</p>
                    </SessionState>
                  )}
                  {visibleSecretMissions.length > 0 && (
                    <ContentPanel
                      variant="private-feed"
                      aria-label="Your private secret missions"
                    >
                      <PanelGrid variant="private-feed">
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
                              busyKey === \`upload:\${mission.assignment_id}\`
                            }
                            onUpload={(event) =>
                              void uploadEvidence(event, {
                                type: "secret",
                                mission,
                              })
                            }
                            onSubmit={(answer) =>
                              void submitSecretMission(mission, answer)
                            }
                            onDismiss={() =>
                              dismissCompletedSecretMission(mission)
                            }
                          />
                        ))}
                      </PanelGrid>
                    </ContentPanel>
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
              teamScoresUnavailable={teamScoresUnavailable}
              portraits={portraits}
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
              addChallengeAction={sideChallengeAddAction}
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
              portraits={portraits}
            />
          )}

          {activePage === "recap" && session.status === "completed" && (
            <PlayerMemories
              assets={memoryAssets}
              mediaUrl={mediaUrl}
              sessionName={session.name}
              playerName={player.name}
              joinCode={code}
            />
          )}

          {!embeddedHostMode && !finalRoundTakeover && (
            <SyncStatus>
              Live updates enabled{" "}
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
            </SyncStatus>
          )}

          {activeSecretMission &&
            activePage === "game" &&
            session.status === "live" &&
            !rewardRound &&
            !secretReviewTakeover && (
              <PrivateMissionDialog
                activeSecretMission={activeSecretMission}
                playSecretMission={playSecretMission}
              />
            )}

          {tourOpen && session.status !== "lobby" && (
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
        session.status !== "lobby" && !secretReviewTakeover
          ? {
              name: player.name,
              subtitle:
                player.team_name ||
                (session.teams_enabled ? "Choose your team" : "Solo player"),
              avatarUrl: portraits.players[player.id] ?? player.avatar_url,
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
      afterGame={
        !embeddedHostMode &&
        !finalRoundTakeover &&
        !secretReviewTakeover &&
        !rewardRound &&
        activePage === "game" &&
        session.status === "lobby" ? (
          <JoinProgress step={3} total={3} />
        ) : null
      }
      toolbar={
        session.status !== "lobby" &&
        !tourDismissed &&
        !embeddedHostMode &&
        !finalRoundTakeover &&
        !secretReviewTakeover ? (
          <SessionTourPrompt
            label="✦ How to play / Take a tour"
            dismissLabel="Dismiss player tour button"
            onStart={() => setTourOpen(true)}
            onDismiss={() => {
              setTourDismissed(true);
              restoreFocus();
            }}
          />
        ) : null
      }
      navigation={
        session.status !== "lobby" &&
        !embeddedHostMode &&
        !finalRoundTakeover &&
        !secretReviewTakeover ? (
          <SessionNavigation
            elementRef={navigationRef}
            active={activePage}
            showMemories={
              session.status === "completed" && !session.final_gallery_open
            }
            memoriesActive={activePage === "recap"}
            memoriesHref={\`/play/\${code}/recap\`}
            challengeCount={sideChallenges.length}
            countLabel={\`\${sideChallenges.length} available challenges\`}
            tourTarget="player-navigation"
            hrefFor={(section) => \`/play/\${code}/\${section}\`}
          />
        ) : null
      }
    >
      {sessionContent}
    </SessionPage>
  );
}
`;export{e as default};