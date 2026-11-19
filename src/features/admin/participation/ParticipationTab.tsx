import UploadInput from "../../../components/ui/UploadInput";
import { useState } from "react";
import { usePlayers } from "../../../game/hooks/usePlayers";
import { useGameState } from "../../../game/hooks/useGameState";
import { useSideChallenges } from "../../../game/hooks/useSideChallenges";
import { useChallengeCompletions } from "../../../game/hooks/useChallengeCompletions";
import { useChallengeParticipation } from "../../../game/hooks/useChallengeParticipation";
import QueryPanel from "../QueryPanel";
import HostChallengeCard from "./HostChallengeCard";
import { sideChallengePlayers } from "./completionPlayers";
import { useNavigate } from "react-router-dom";
import ParticipationView from "./ParticipationView";
export default function ParticipationTab() {
  const navigate = useNavigate();
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
      <ParticipationView
        gameAvailable={Boolean(gameQuery.data)}
        players={playersQuery.data}
        playerId={playerId}
        onPlayer={setPlayerId}
        feedback={
          participation.error && (
            <p role="alert">{participation.error.message}</p>
          )
        }
        upload={
          <UploadInput
            ref={participation.fileInputRef}
            accept="image/*,video/*"
            onChange={participation.handleFileSelected}
          />
        }
      >
        {challengesQuery.data.map((challenge) => (
          <HostChallengeCard
            key={challenge.id}
            challenge={challenge}
            completedBy={completedBy.get(String(challenge.id)) ?? []}
            participation={participation}
            onReview={() =>
              navigate(
                `/challenge-review?type=side&id=${encodeURIComponent(String(challenge.id))}&title=${encodeURIComponent(challenge.title)}`,
              )
            }
          />
        ))}
      </ParticipationView>
    </QueryPanel>
  );
}
