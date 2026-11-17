import SessionReview from "../../components/session/SessionReview";
import type { SecretReviewView, SessionPlayerInfo } from "./types";
export default function SecretMissionReview({
  secretReview,
  mediaUrl,
  busyKey,
  voteOnSecretReview,
  player,
}: {
  secretReview: SecretReviewView;
  mediaUrl: (path: string) => string;
  busyKey: string | null;
  voteOnSecretReview: (vote: "success" | "fail") => Promise<void>;
  player: SessionPlayerInfo;
}) {
  const mission = secretReview.mission;
  if (!mission) return null;
  return (
    <SessionReview
      title={mission.title}
      description={mission.description}
      owner={mission.player_name}
      points={mission.points}
      evidence={secretReview.media.map((item) => ({
        id: item.id,
        url: mediaUrl(item.storage_path),
        mediaType: item.media_type,
        description: `Evidence for ${mission.title}`,
      }))}
      open={secretReview.voting_open}
      vote={secretReview.my_vote}
      outcome={secretReview.outcome}
      votesCast={secretReview.votes_cast}
      successVotes={secretReview.success_votes}
      failVotes={secretReview.fail_votes}
      busy={busyKey !== null}
      onVote={(vote) => void voteOnSecretReview(vote)}
      voters={secretReview.voters.map((voter) => ({
        id: voter.id,
        name: voter.name,
        vote: voter.vote,
      }))}
      leaderboard={secretReview.leaderboard.map((entry) => ({
        id: entry.player_id,
        name: entry.name,
        score: entry.score,
        avatarUrl: entry.avatar_url,
        teamId: entry.team_id,
        teamName: entry.team_name,
      }))}
      viewerId={player.id}
    />
  );
}
