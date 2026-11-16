import { useState } from "react";
import { usePlayers } from "../../../game/hooks/usePlayers";
import { useGameState } from "../../../game/hooks/useGameState";
import { useSideChallenges } from "../../../game/hooks/useSideChallenges";
import { useChallengeCompletions } from "../../../game/hooks/useChallengeCompletions";
import { useChallengeParticipation } from "../../../game/hooks/useChallengeParticipation";
import Card from "../../../components/ui/Card";
import QueryPanel from "../QueryPanel";
import HostChallengeCard from "./HostChallengeCard";
import { sideChallengePlayers } from "./completionPlayers";

export default function ParticipationTab() {
  const playersQuery = usePlayers();
  const gameQuery = useGameState();
  const challengesQuery = useSideChallenges();
  const completionsQuery = useChallengeCompletions();
  const [playerId, setPlayerId] = useState("");
  const player = playersQuery.data.find(
    (candidate) => candidate.id === playerId,
  );
  const participation = useChallengeParticipation(
    player,
    gameQuery.data?.current_pub ?? "",
    completionsQuery.data,
  );
  const completedBy = sideChallengePlayers(
    completionsQuery.data,
    playersQuery.data,
  );
  return (
    <QueryPanel
      queries={[playersQuery, gameQuery, challengesQuery, completionsQuery]}
      loadingText="Loading challenges..."
    >
      {gameQuery.data ? (
        <>
          {participation.error && (
            <p role="alert">{participation.error.message}</p>
          )}
          <input
            ref={participation.fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={participation.handleFileSelected}
          />
          <Card>
            <h2 className="text-xl font-bold">Play as a Player</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Choose your joined player account to take part as host.
            </p>
            <select
              aria-label="Play as player"
              value={playerId}
              onChange={(event) => setPlayerId(event.target.value)}
              className="mt-4 w-full rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-white"
            >
              <option value="">Select player</option>
              {playersQuery.data.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name}
                  {candidate.team ? ` • ${candidate.team}` : ""}
                </option>
              ))}
            </select>
          </Card>
          <Card>
            <h2 className="text-2xl font-bold">Chaos Bingo</h2>
            {!playerId ? (
              <p className="mt-4 text-yellow-400">
                Select a player above to take part.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                {challengesQuery.data.map((challenge) => (
                  <HostChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    completedBy={completedBy.get(String(challenge.id)) ?? []}
                    participation={participation}
                  />
                ))}
              </div>
            )}
          </Card>
        </>
      ) : (
        <p>Waiting for an active game...</p>
      )}
    </QueryPanel>
  );
}
