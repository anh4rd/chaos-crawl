var e=`import PageFrame from "../../components/ui/PageFrame";
import { useLegacyTeams } from "./useLegacyTeams";
import { useLegacyRoster } from "./useLegacyRoster";
import { useLegacyGameControls } from "./useLegacyGameControls";
import { useLegacyScoreAdjustment } from "./useLegacyScoreAdjustment";
import {
  buildHostRounds,
  hostRoundState,
  hostTeamNames,
  hostTeamLeaderboard,
} from "./models";
import LiveOverview from "./LiveOverview";
import PlayersOverview from "./PlayersOverview";
import HostGameFrame from "./HostGameFrame";
import ChallengeCatalogue from "./ChallengeCatalogue";
import ScoreOverview from "./ScoreOverview";
import type {
  ChallengeRoundModel,
  SideChallengeItemModel,
  HostTab,
  PlayerRowModel,
} from "./types";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import DataError from "../../components/ui/DataError";
import { useChallengeCompletions } from "../../game/hooks/useChallengeCompletions";
import { useChallenges, type Challenge } from "../../game/hooks/useChallenges";
import { useGameState } from "../../game/hooks/useGameState";
import { usePlayers } from "../../game/hooks/usePlayers";
import { usePubs } from "../../game/hooks/usePubs";
import { useScoreEvents } from "../../game/hooks/useScoreEvents";
import { useSideChallenges } from "../../game/hooks/useSideChallenges";
import { buildLeaderboards } from "../../lib/leaderboard";

export default function LegacyHostWorkspace() {
  const navigate = useNavigate();
  const gameQuery = useGameState();
  const { data: game } = gameQuery;
  const playersQuery = usePlayers();
  const { data: players } = playersQuery;
  const pubsQuery = usePubs();
  const { data: pubs } = pubsQuery;
  const challengesQuery = useChallenges();
  const { data: challenges } = challengesQuery;
  const sideChallengesQuery = useSideChallenges();
  const { data: sideChallenges } = sideChallengesQuery;
  const completionsQuery = useChallengeCompletions();
  const { data: completions } = completionsQuery;
  const scoresQuery = useScoreEvents();
  const { data: scoreEvents, loading: scoresLoading } = scoresQuery;

  const [activeTab, setActiveTab] = useState<HostTab>("live");
  const {
    data: teams,
    loading: teamsLoading,
    reload: loadTeams,
  } = useLegacyTeams();
  const rounds = useMemo(
    () => buildHostRounds(pubs, challenges, game?.current_pub),
    [pubs, challenges, game?.current_pub],
  );
  const {
    orderedChallenges,
    currentChallenge,
    currentChallengeIndex,
    nextChallenge,
    scheduledChallenge,
    currentRound,
    challengeProgress,
    scheduledTime,
  } = useMemo(() => hostRoundState(rounds, game), [rounds, game]);
  const leaderboards = useMemo(
    () => buildLeaderboards(players, scoreEvents),
    [players, scoreEvents],
  );
  const playerLeaderboard = leaderboards.players;
  const teamNames = useMemo(
    () => hostTeamNames(teams, players, scoreEvents),
    [teams, players, scoreEvents],
  );
  const teamLeaderboard = useMemo(
    () => hostTeamLeaderboard(teamNames, leaderboards.teams),
    [teamNames, leaderboards],
  );
  const {
    busyAction,
    scheduleMinutes,
    setScheduleMinutes,
    voteTarget,
    setVoteTarget,
    revealChallenge,
    scheduleChallenge,
    cancelScheduledReveal,
    setVoting,
    returnEveryoneToGame,
    setSlideshow,
  } = useLegacyGameControls({
    game,
    rounds,
    onShowLive: () => setActiveTab("live"),
  });
  const {
    teamNameDraft,
    setTeamNameDraft,
    newPlayerName,
    setNewPlayerName,
    creatingTeam,
    creatingPlayer,
    addTeam,
    addPlayer,
    assignTeam,
    savePlayerName,
    removePlayer,
  } = useLegacyRoster(loadTeams);
  const {
    scoreTarget,
    setScoreTarget,
    scoreLeaderboardTarget,
    setScoreLeaderboardTarget,
    scoreAction,
    setScoreAction,
    selectedPlayerId,
    setSelectedPlayerId,
    selectedTeamName,
    setSelectedTeamName,
    pointsDraft,
    setPointsDraft,
    scoreReason,
    setScoreReason,
    handleAwardOrDock,
  } = useLegacyScoreAdjustment();

  function openReview(challenge: Challenge | null) {
    if (!challenge) {
      window.alert("Reveal a challenge before reviewing submissions.");
      return;
    }
    navigate(
      \`/challenge-review?type=main&id=\${encodeURIComponent(String(challenge.id))}&title=\${encodeURIComponent(challenge.title)}&from=admin-v2\`,
    );
  }

  const failedQuery = [
    gameQuery,
    playersQuery,
    pubsQuery,
    challengesQuery,
    sideChallengesQuery,
    completionsQuery,
    scoresQuery,
  ].find((query) => query.error);
  if (failedQuery?.error) {
    return <DataError error={failedQuery.error} retry={failedQuery.reload} />;
  }

  if (!game) {
    return (
      <PageFrame variant="bare" className="legacy-host">
        <div className="legacy-host__loading">Loading host controls…</div>
      </PageFrame>
    );
  }

  const challengeRounds: ChallengeRoundModel[] =
    activeTab === "challenges"
      ? rounds.map((round) => ({
          id: round.id,
          label: round.label,
          challenges: round.challenges.map((challenge) => ({
            id: challenge.id,
            title: challenge.title,
            description: challenge.description,
            points: challenge.points,
            current: String(challenge.id) === String(game.current_challenge_id),
            scheduled:
              String(challenge.id) === String(game.scheduled_challenge_id),
            past:
              currentChallengeIndex >= 0 &&
              orderedChallenges.findIndex(
                (item) => String(item.id) === String(challenge.id),
              ) < currentChallengeIndex,
            onReveal: () => {
              void revealChallenge(challenge);
            },
            onSchedule: () => {
              void scheduleChallenge(challenge);
            },
          })),
        }))
      : [];
  const optionalChallenges: SideChallengeItemModel[] =
    activeTab === "challenges"
      ? sideChallenges.map((challenge) => ({
          id: challenge.id,
          title: challenge.title,
          description: challenge.description,
          points: challenge.points,
          completionCount: completions.filter(
            (item) =>
              item.challenge_type === "side" &&
              String(item.challenge_id) === String(challenge.id),
          ).length,
          onReview: () =>
            navigate(
              \`/challenge-review?type=side&id=\${encodeURIComponent(String(challenge.id))}&title=\${encodeURIComponent(challenge.title)}&from=admin-v2\`,
            ),
        }))
      : [];

  const scoreEntries =
    scoreLeaderboardTarget === "player" ? playerLeaderboard : teamLeaderboard;

  const rosterPlayers: PlayerRowModel[] =
    activeTab === "players"
      ? players.map((player) => ({
          id: player.id,
          name: player.name,
          initial: player.name.trim().slice(0, 1).toUpperCase() || "?",
          team: player.team ?? "",
          onRename: (value) => {
            void savePlayerName(player, value);
          },
          onAssignTeam: (value) => {
            void assignTeam(player, value);
          },
          onRemove: () => {
            void removePlayer(player);
          },
        }))
      : [];

  return (
    <HostGameFrame
      currentAvailable={Boolean(currentChallenge)}
      playerCount={players.length}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === "live" && (
        <LiveOverview
          progress={{
            roundLabel: currentRound?.label ?? "Ready to start",
            revealedCount: Math.max(currentChallengeIndex + 1, 0),
            totalCount: orderedChallenges.length,
            progressPercent: challengeProgress,
          }}
          current={{
            currentChallenge,
            submissionCount: currentChallenge
              ? completions.filter(
                  (item) =>
                    item.challenge_type === "main" &&
                    String(item.challenge_id) === String(currentChallenge.id),
                ).length
              : 0,
            onReview: () => openReview(currentChallenge),
          }}
          upcoming={{
            scheduledChallenge,
            nextChallenge,
            scheduledTime,
            busy: Boolean(busyAction),
            revealingNext: Boolean(
              nextChallenge && busyAction === \`reveal-\${nextChallenge.id}\`,
            ),
            scheduleMinutes,
            onRevealNext: () => {
              if (nextChallenge) void revealChallenge(nextChallenge);
            },
            onCancelSchedule: () => {
              void cancelScheduledReveal();
            },
            onScheduleMinutesChange: setScheduleMinutes,
            onScheduleNext: () => {
              if (nextChallenge) void scheduleChallenge(nextChallenge);
            },
          }}
          controls={{
            votingOpen: game.voting_open,
            showResults: game.show_vote_results,
            slideshowOpen: game.slideshow_open,
            voteTarget,
            canOpenVoting: Boolean(currentChallenge),
            onCloseVoting: () => {
              void setVoting(false);
            },
            onViewResults: () => navigate("/vote-results"),
            onReturnToGame: () => {
              void returnEveryoneToGame();
            },
            onVoteTargetChange: setVoteTarget,
            onOpenVoting: () => {
              void setVoting(true, voteTarget);
            },
            onToggleSlideshow: () => {
              void setSlideshow(!game.slideshow_open);
            },
          }}
        />
      )}

      {activeTab === "challenges" && (
        <ChallengeCatalogue
          rounds={challengeRounds}
          sideChallenges={optionalChallenges}
          busy={Boolean(busyAction)}
        />
      )}

      {activeTab === "scores" && (
        <ScoreOverview
          adjustment={{
            target: scoreTarget,
            action: scoreAction,
            players: players.map(({ id, name }) => ({ id, name })),
            teams: teamNames,
            selectedPlayerId,
            selectedTeamName,
            points: pointsDraft,
            reason: scoreReason,
            onTargetChange: setScoreTarget,
            onActionChange: setScoreAction,
            onPlayerChange: setSelectedPlayerId,
            onTeamChange: setSelectedTeamName,
            onPointsChange: setPointsDraft,
            onReasonChange: setScoreReason,
            onSubmit: () => {
              void handleAwardOrDock();
            },
          }}
          leaderboard={{
            target: scoreLeaderboardTarget,
            loading: scoresLoading,
            entries: scoreEntries,
            onTargetChange: setScoreLeaderboardTarget,
          }}
          display={{
            showVoteResults: game.show_vote_results,
            onOpenSlideshow: () => {
              void setSlideshow(true);
            },
            onReturnToGame: () => {
              void returnEveryoneToGame();
            },
          }}
        />
      )}

      {activeTab === "players" && (
        <PlayersOverview
          teams={{
            teamCount: teams.length,
            names: teamNames,
            loading: teamsLoading,
            draft: teamNameDraft,
            creating: creatingTeam,
            canCreate: !creatingTeam && Boolean(teamNameDraft.trim()),
            onDraftChange: setTeamNameDraft,
            onCreate: () => {
              void addTeam();
            },
          }}
          roster={{
            players: rosterPlayers,
            teams: teamNames,
            draft: newPlayerName,
            creating: creatingPlayer,
            canCreate: !creatingPlayer && Boolean(newPlayerName.trim()),
            onDraftChange: setNewPlayerName,
            onCreate: () => {
              void addPlayer();
            },
          }}
        />
      )}
    </HostGameFrame>
  );
}
`;export{e as default};