import PageFrame from "../components/ui/PageFrame";
import { useMemo, useState } from "react";
import { LeaderboardCard } from "../features/leaderboard/LeaderboardCard";

import { useNavigate } from "react-router-dom";

import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import DataError from "../components/ui/DataError";

import { usePlayers } from "../game/hooks/usePlayers";

import { useScoreEvents } from "../game/hooks/useScoreEvents";

import { buildLeaderboards } from "../lib/leaderboard";

type LeaderboardMode = "teams" | "players";

export default function Leaderboard() {
  const navigate = useNavigate();

  const playersQuery = usePlayers();
  const { data: players } = playersQuery;

  const scoreQuery = useScoreEvents();
  const { data: scoreEvents, loading } = scoreQuery;

  const [mode, setMode] = useState<LeaderboardMode>("teams");

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const boards = useMemo(
    () => buildLeaderboards(players, scoreEvents),
    [players, scoreEvents],
  );
  const leaderboard = boards[mode];

  const failed = playersQuery.error
    ? playersQuery
    : scoreQuery.error
      ? scoreQuery
      : null;
  if (failed?.error)
    return <DataError error={failed.error} retry={failed.reload} />;

  return (
    <PageFrame className="mx-auto min-h-screen max-w-md space-y-6 p-6">
      <Card>
        <h1 className="text-4xl font-bold">Leaderboard</h1>

        <p className="mt-3">
          Tap a player or team to see where their points came from.
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          onClick={() => {
            setMode("teams");
            setExpandedId(null);
          }}
        >
          {mode === "teams" ? "✓ Teams" : "Teams"}
        </Button>

        <Button
          type="button"
          onClick={() => {
            setMode("players");
            setExpandedId(null);
          }}
        >
          {mode === "players" ? "✓ Players" : "Players"}
        </Button>
      </div>

      {loading || playersQuery.loading ? (
        <Card>
          <p>Loading scores...</p>
        </Card>
      ) : leaderboard.length === 0 ? (
        <Card>
          <p>No players or teams yet.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((entry, index) => (
            <LeaderboardCard
              key={entry.id}
              entry={entry}
              index={index}
              expanded={expandedId === entry.id}
              onToggle={() =>
                setExpandedId(expandedId === entry.id ? null : entry.id)
              }
            />
          ))}
        </div>
      )}

      <Button type="button" onClick={() => navigate("/game")}>
        Back to Game
      </Button>
    </PageFrame>
  );
}
