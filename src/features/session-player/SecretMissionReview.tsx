import SessionState from "../../components/session/SessionState";
import { isSecretVotingOpen } from "./votingState";
import SessionReview from "../../components/session/SessionReview";
import type { SessionPortraits } from "../../lib/sessionPortraits";
import type { SecretReviewView, SessionPlayerInfo } from "./types";
export default function SecretMissionReview({
  secretReview,
  mediaUrl,
  busyKey,
  voteOnSecretReview,
  player,
  portraits,
}: {
  secretReview: SecretReviewView;
  mediaUrl: (path: string) => string;
  busyKey: string | null;
  voteOnSecretReview: (vote: "success" | "fail") => Promise<void>;
  player: SessionPlayerInfo;
  portraits: SessionPortraits;
}) {
  const mission = secretReview.mission;
  if (!mission)
    return <SessionState title="Secret mission review is loading…" />;
  const votingOpen = isSecretVotingOpen(secretReview);
  return (
    <SessionReview
      title={mission.title}
      description={mission.description}
      owner={mission.player_name}
      ownerAvatarUrl={
        portraits.players[mission.player_id] ?? mission.player_avatar_url
      }
      points={mission.points}
      answer={secretReview.answer}
      evidence={secretReview.media.map((item) => ({
        id: item.id,
        url: mediaUrl(item.storage_path),
        mediaType: item.media_type,
        description: `Evidence for ${mission.title}`,
      }))}
      open={votingOpen}
      vote={secretReview.my_vote}
      outcome={votingOpen ? null : secretReview.outcome}
      votesCast={secretReview.votes_cast}
      successVotes={votingOpen ? null : secretReview.success_votes}
      failVotes={votingOpen ? null : secretReview.fail_votes}
      busy={busyKey !== null}
      onVote={
        secretReview.voting_open
          ? (vote) => void voteOnSecretReview(vote)
          : undefined
      }
      voters={
        votingOpen
          ? []
          : secretReview.voters.map((voter) => ({
              id: voter.id,
              name: voter.name,
              avatarUrl: portraits.players[voter.id] ?? voter.avatar_url,
              vote: voter.vote,
            }))
      }
      leaderboard={
        votingOpen
          ? []
          : secretReview.leaderboard.map((entry) => ({
              id: entry.player_id,
              name: entry.name,
              score: entry.score,
              avatarUrl: portraits.players[entry.player_id] ?? entry.avatar_url,
              teamId: entry.team_id,
              teamName: entry.team_name,
            }))
      }
      viewerId={player.id}
    />
  );
}
