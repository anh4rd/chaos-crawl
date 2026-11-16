import { useEffect } from "react";
import type { GameState, Player } from "../types/database";

import { useNavigate } from "react-router-dom";

import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

import { useGameState } from "../game/hooks/useGameState";

import useSideChallenges from "../game/hooks/useSideChallenges";

import useChallengeCompletions from "../game/hooks/useChallengeCompletions";

import { usePlayers } from "../game/hooks/usePlayers";

import { useChallenges } from "../game/hooks/useChallenges";

import { usePlayerSession } from "../game/hooks/usePlayerSession";

import { useChallengeParticipation } from "../game/hooks/useChallengeParticipation";
import ScheduledCountdown from "../features/ScheduledCountdown";
import DataError from "../components/ui/DataError";
import { useScoreEvents } from "../game/hooks/useScoreEvents";
import { buildLeaderboards } from "../lib/leaderboard";
import LiveTask from "../features/game/LiveTask";
import SideChallenges from "../features/game/SideChallenges";

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
  const screenRoute = game?.show_vote_results
    ? "/vote-results"
    : game?.voting_open
      ? "/vote"
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
  if (failedQuery)
    return <DataError error={failedQuery.error!} retry={failedQuery.reload} />;
  if (!game || queries.some((query) => query.loading)) {
    return (
      <main className="p-6">
        <p>Loading game...</p>
      </main>
    );
  }

  if (!currentPlayer)
    return (
      <main className="mx-auto min-h-screen max-w-md space-y-4 p-6">
        <h1 className="text-2xl font-bold">Join the game to take part</h1>
        <p>
          Your player session was not found. Join again to save challenge
          completions and uploads.
        </p>
        <Button type="button" onClick={() => navigate("/join")}>
          Join Game
        </Button>
      </main>
    );

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
    <main className="mx-auto min-h-screen max-w-md space-y-6 p-6">
      {/* TITLE */}

      <header>
        <img
          src={`${import.meta.env.BASE_URL}Title.png`}
          alt="Anna's Chaos Crawl"
          className="mx-auto mb-4 w-full"
        />
      </header>

      {/* HIDDEN FILE INPUT */}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
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

      {/* NAVIGATION */}

      <div className="space-y-3">
        <Button
          type="button"
          onClick={() => {
            navigate("/leaderboard");
          }}
        >
          Leaderboard
        </Button>
      </div>
    </main>
  );
}

function GameStatus({
  game,
  currentPlayer,
  teamScore,
}: {
  game: GameState;
  currentPlayer: Player;
  teamScore: number | null;
}) {
  return (
    <Card>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-pink-400">
        Now
      </p>

      <h2 className="mt-2 text-4xl font-black leading-none">
        {game.current_pub}
      </h2>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-zinc-900 p-3">
          <p className="text-xs uppercase text-zinc-400">Your team</p>

          <p className="mt-1 font-bold">
            {currentPlayer?.team ?? "Waiting..."}
          </p>
        </div>

        <div className="rounded-2xl bg-zinc-900 p-3">
          <p className="text-xs uppercase text-zinc-400">Team score</p>

          <p className="mt-1 text-2xl font-black text-yellow-400">
            {teamScore ?? "—"}
          </p>
        </div>
      </div>

      {game.scheduled_reveal_at && (
        <div className="mt-3 rounded-2xl border border-pink-500/60 bg-pink-950/30 p-3">
          <p className="text-xs font-bold uppercase text-pink-300">
            Next challenge in{" "}
            <ScheduledCountdown targetTime={game.scheduled_reveal_at} />
          </p>
        </div>
      )}
    </Card>
  );
}
