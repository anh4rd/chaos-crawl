import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

import { useGameState } from "../hooks/useGameState";
import { usePlayers } from "../game/hooks/usePlayers";

import {
  getVotesForChallenge,
} from "../lib/voteApi";

interface VoteRow {
  id: string | number;
  voted_for_player_id:
    | string
    | null;
  voted_for_team_id:
    | string
    | null;
}

export default function VoteResults() {
  const game = useGameState();
  const players = usePlayers();
  const navigate = useNavigate();

  const [votes, setVotes] =
    useState<VoteRow[]>([]);

  useEffect(() => {
    async function loadVotes() {
      if (!game?.current_challenge) {
        return;
      }

      const { data, error } =
        await getVotesForChallenge(
          game.current_challenge
        );

      if (error) {
        console.error(
          "RESULTS ERROR",
          error
        );
        return;
      }

      setVotes(data ?? []);
    }

    loadVotes();
  }, [game?.current_challenge]);

  useEffect(() => {
    if (
      game?.show_vote_results === false
    ) {
      navigate("/game");
    }
  }, [
    game?.show_vote_results,
    navigate,
  ]);

  if (!game) {
    return <p>Loading results...</p>;
  }

  const playerResults = players
    .map((player) => ({
      id: player.id,
      name: player.name,
      votes: votes.filter(
        (vote) =>
          vote.voted_for_player_id ===
          player.id
      ).length,
    }))
    .sort(
      (a, b) => b.votes - a.votes
    );

  const teamNames = Array.from(
    new Set(
      players
        .map((player) => player.team)
        .filter(
          (team): team is string =>
            Boolean(team)
        )
    )
  );

  const teamResults = teamNames
    .map((team) => ({
      id: team,
      name: team,
      votes: votes.filter(
        (vote) =>
          vote.voted_for_team_id ===
          team
      ).length,
    }))
    .sort(
      (a, b) => b.votes - a.votes
    );

  const results =
    game.voting_target === "team"
      ? teamResults
      : playerResults;

  return (
    <main className="mx-auto min-h-screen max-w-md space-y-6 p-6">
      <Card>
        <h1 className="text-4xl font-bold">
          Voting Results
        </h1>

        <p className="mt-3">
          {game.current_challenge}
        </p>
      </Card>

      <div className="space-y-3">
        {results.map(
          (result, index) => (
            <Card key={result.id}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="mr-3">
                    {index === 0
                      ? "👑"
                      : ""}
                  </span>

                  <strong>
                    {result.name}
                  </strong>
                </div>

                <div className="text-2xl font-bold">
                  {result.votes}
                </div>
              </div>
            </Card>
          )
        )}
      </div>

      <Button
        type="button"
        onClick={() =>
          navigate("/game")
        }
      >
        Back to Game
      </Button>
    </main>
  );
}