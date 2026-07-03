import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

import { useGameState } from "../hooks/useGameState";
import { usePlayers } from "../game/hooks/usePlayers";

import { getPlayerId } from "../lib/playerSession";

import {
  getMyVote,
  submitVote,
} from "../lib/voteApi";

export default function Vote() {
  const game = useGameState();
  const players = usePlayers();
  const navigate = useNavigate();

  const [selectedPlayerId, setSelectedPlayerId] =
    useState<string | null>(null);

  const [selectedTeamId, setSelectedTeamId] =
    useState<string | null>(null);

  const [hasVoted, setHasVoted] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const playerId = getPlayerId();

  // Derive unique teams from joined players
  const teams = Array.from(
    new Set(
      players
        .map((player) => player.team)
        .filter(
          (team): team is string =>
            typeof team === "string" &&
            team.trim() !== ""
        )
    )
  );

  useEffect(() => {
    if (game?.voting_open === false) {
      navigate("/game");
    }
  }, [game?.voting_open, navigate]);

  useEffect(() => {
    async function checkExistingVote() {
      if (!game?.current_challenge || !playerId) {
        return;
      }

      const { data, error } = await getMyVote(
        playerId,
        game.current_challenge
      );

      if (error) {
        console.error("CHECK VOTE ERROR", error);
        return;
      }

      if (data) {
        setHasVoted(true);
      }
    }

    checkExistingVote();
  }, [game?.current_challenge, playerId]);

  async function handleVote() {
    if (!game) {
      return;
    }

    if (!playerId) {
      alert("Player session not found.");
      return;
    }

    const votingForTeams =
      game.voting_target === "team";

    if (votingForTeams && !selectedTeamId) {
      alert("Choose a team first.");
      return;
    }

    if (!votingForTeams && !selectedPlayerId) {
      alert("Choose someone first.");
      return;
    }

    setSubmitting(true);

    const { error } = await submitVote(
      playerId,
      game.current_challenge,
      votingForTeams
        ? {
            teamId: selectedTeamId!,
          }
        : {
            playerId: selectedPlayerId!,
          }
    );

    setSubmitting(false);

    if (error) {
      console.error("VOTE ERROR", error);

      if (error.code === "23505") {
        setHasVoted(true);
        alert(
          "You already voted for this challenge."
        );
        return;
      }

      alert(
        `Vote failed: ${error.message}`
      );
      return;
    }

    setHasVoted(true);
  }

  if (!game) {
    return (
      <main className="mx-auto min-h-screen max-w-md p-6">
        <p>Loading voting...</p>
      </main>
    );
  }

  if (hasVoted) {
    return (
      <main className="mx-auto min-h-screen max-w-md space-y-6 p-6">
        <Card>
          <div className="text-center">
            <h1 className="text-4xl font-bold">
              Vote Cast!
            </h1>

            <p className="mt-4">
              Your vote for{" "}
              {game.current_challenge}{" "}
              is locked in.
            </p>

            <p className="mt-4 text-sm text-zinc-400">
              Waiting for the host to close voting...
            </p>
          </div>
        </Card>
      </main>
    );
  }

  const votingForTeams =
    game.voting_target === "team";

  return (
    <main className="mx-auto min-h-screen max-w-md space-y-6 p-6">
      <header className="text-center">
        <h1 className="text-4xl font-bold">
          Vote!
        </h1>

        <p className="mt-2">
          {game.current_challenge}
        </p>

        <p className="mt-2 text-sm">
          {votingForTeams
            ? "Choose the winning team."
            : "Choose the winning player."}
        </p>
      </header>

      <div className="space-y-3">
        {votingForTeams
          ? teams.map((team) => {
              const selected =
                selectedTeamId === team;

              return (
                <button
                  key={team}
                  type="button"
                  onClick={() =>
                    setSelectedTeamId(team)
                  }
                  className={`
                    w-full rounded-2xl border-4 p-4 text-left
                    ${
                      selected
                        ? "border-yellow-400 bg-pink-500"
                        : "border-pink-500 bg-black/80"
                    }
                  `}
                >
                  <div className="text-xl font-bold">
                    {team}
                  </div>
                </button>
              );
            })
          : players.map((player) => {
              const selected =
                selectedPlayerId === player.id;

              return (
                <button
                  key={player.id}
                  type="button"
                  onClick={() =>
                    setSelectedPlayerId(player.id)
                  }
                  className={`
                    w-full rounded-2xl border-4 p-4 text-left
                    ${
                      selected
                        ? "border-yellow-400 bg-pink-500"
                        : "border-pink-500 bg-black/80"
                    }
                  `}
                >
                  <div className="text-xl font-bold">
                    {player.name}
                  </div>

                  <div className="text-sm">
                    {player.team}
                  </div>
                </button>
              );
            })}
      </div>

      <Button
        type="button"
        onClick={handleVote}
        disabled={submitting}
      >
        {submitting
          ? "Submitting..."
          : "Cast Vote"}
      </Button>
    </main>
  );
}