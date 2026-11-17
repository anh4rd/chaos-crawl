import { useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";

import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import DataError from "../components/ui/DataError";

import { usePlayers } from "../game/hooks/usePlayers";

import { useScoreEvents } from "../game/hooks/useScoreEvents";

import { buildLeaderboards, type LeaderboardEntry } from "../lib/leaderboard";
import type { ScoreEvent } from "../types/database";
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
  if (failed) return <DataError error={failed.error!} retry={failed.reload} />;

  return (
    <main className="mx-auto min-h-screen max-w-md space-y-6 p-6">
      <Card>
        <h1 className="text-4xl font-bold">Leaderboard</h1>

        <p className="mt-3">
          Tap a player or team to see where their points came from.
        </p>
      </Card>

      {/* MODE TABS */}

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

      {/* LOADING */}

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
    </main>
  );
}

function ScoreHistoryRow({ event }: { event: ScoreEvent }) {
  const awardedDate = event.awarded_at ? new Date(event.awarded_at) : null;

  return (
    <div className="rounded-xl border border-pink-500/50 bg-black/40 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold">{event.challenge_title}</h3>

          <p className="mt-1 text-xs uppercase opacity-70">
            {event.challenge_type}
          </p>

          {event.reason && <p className="mt-2 text-sm">{event.reason}</p>}

          {awardedDate && (
            <p className="mt-2 text-xs opacity-50">
              {awardedDate.toLocaleString()}
            </p>
          )}
        </div>

        <strong className="text-xl">
          {event.points > 0 ? "+" : ""}

          {event.points}
        </strong>
      </div>
    </div>
  );
}

function LeaderboardCard({
  entry,
  index,
  expanded,
  onToggle,
}: {
  entry: LeaderboardEntry;
  index: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <Card>
      <button type="button" onClick={onToggle} className="w-full text-left">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              {index === 0
                ? "👑"
                : index === 1
                  ? "🥈"
                  : index === 2
                    ? "🥉"
                    : `${index + 1}.`}
            </span>

            <div>
              <h2 className="text-xl font-bold">{entry.name}</h2>

              <p className="text-sm opacity-70">
                {entry.events.length} award
                {entry.events.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-3xl font-bold">{entry.score}</div>

            <div className="text-xs opacity-70">points</div>
          </div>
        </div>
      </button>

      {/* SCORE HISTORY */}

      {expanded && (
        <div className="mt-4 space-y-3 border-t border-white/20 pt-4">
          {entry.events.length === 0 ? (
            <p className="text-sm opacity-70">No points awarded yet.</p>
          ) : (
            entry.events.map((event) => (
              <ScoreHistoryRow key={event.id} event={event} />
            ))
          )}
        </div>
      )}
    </Card>
  );
}
