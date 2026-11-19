import PlayerRecovery from "../features/game/PlayerRecovery";
import BrandArtwork from "../components/ui/BrandArtwork";
import PageFrame from "../components/ui/PageFrame";
import { useEffect } from "react";
import { GameStatus } from "../features/game/GameStatus";

import { useNavigate } from "react-router-dom";

import Button from "../components/ui/Button";

import { useGameState } from "../game/hooks/useGameState";

import { useSideChallenges } from "../game/hooks/useSideChallenges";

import { useChallengeCompletions } from "../game/hooks/useChallengeCompletions";

import { usePlayers } from "../game/hooks/usePlayers";

import { useChallenges } from "../game/hooks/useChallenges";

import { usePlayerSession } from "../game/hooks/usePlayerSession";

import DataError from "../components/ui/DataError";
import LiveTask from "../features/game/LiveTask";
import SideChallenges from "../features/game/SideChallenges";
import { useChallengeParticipation } from "../game/hooks/useChallengeParticipation";
import { useScoreEvents } from "../game/hooks/useScoreEvents";
import { buildLeaderboards } from "../lib/leaderboard";

export default function Game() {
  const gameQuery = useGameState();
  const { data: game } = gameQuery;

  const challengesQuery = useChallenges();
  const { data: challenges } = challengesQuery;

  const sideChallengesQuery = useSideChallenges();
  const { data: sideChallenges } = sideChallengesQuery;

  const completionsQuery = useChallengeCompletions();
  const { data: completions } = completionsQuery;

  const playersQuery = usePlayers();
  const { data: players } = playersQuery;

  const scoresQuery = useScoreEvents();
  const navigate = useNavigate();

  const session = usePlayerSession();
  const playerId = session.playerId;
  const currentPlayer = players.find((player) => player.id === playerId);
  const participation = useChallengeParticipation(
    currentPlayer,
    game?.current_pub ?? "",
    completions,
  );
  const { fileInputRef, handleFileSelected } = participation;
  const screenRoute = game?.voting_open
    ? "/vote"
    : game?.show_vote_results
      ? "/vote-results"
      : game?.slideshow_open
        ? "/slideshow"
        : null;
  useEffect(() => {
    if (screenRoute && !session.error) navigate(screenRoute, { replace: true });
  }, [screenRoute, navigate, session.error]);

  if (session.error)
    return <DataError error={session.error} retry={session.reload} />;

  const queries = [
    gameQuery,
    playersQuery,
    challengesQuery,
    sideChallengesQuery,
    completionsQuery,
    scoresQuery,
  ];
  const failedQuery = queries.find((query) => query.error);
  if (failedQuery?.error)
    return <DataError error={failedQuery.error} retry={failedQuery.reload} />;
  if (!game || queries.some((query) => query.loading)) {
    return (
      <PageFrame variant="loading">
        <p>Loading game...</p>
      </PageFrame>
    );
  }

  if (!currentPlayer)
    return <PlayerRecovery onJoin={() => navigate("/legacy/join")} />;

  const teamScore = currentPlayer?.team
    ? (buildLeaderboards(players, scoresQuery.data).teams.find(
        (team) => team.name === currentPlayer.team,
      )?.score ?? 0)
    : null;

  const currentChallengeObject =
    challenges.find(
      (challenge) => String(challenge.id) === String(game.current_challenge_id),
    ) ??
    challenges.find((challenge) => challenge.title === game.current_challenge);

  return (
    <PageFrame className="game-page">
      <header>
        <BrandArtwork />
      </header>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="game-page__file"
        onChange={handleFileSelected}
      />

      {participation.error && <p role="alert">{participation.error.message}</p>}

      <GameStatus
        game={game}
        currentPlayer={currentPlayer}
        teamScore={teamScore}
      />

      <LiveTask
        challenge={currentChallengeObject}
        game={game}
        participation={participation}
      />
      <SideChallenges
        challenges={sideChallenges}
        participation={participation}
      />

      <div className="game-page__navigation">
        <Button
          type="button"
          onClick={() => {
            navigate("/leaderboard");
          }}
        >
          Leaderboard
        </Button>
      </div>
    </PageFrame>
  );
}
