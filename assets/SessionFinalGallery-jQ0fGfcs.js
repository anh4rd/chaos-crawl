var e=`import { isFinalVotingOpen } from "./votingState";
import SessionFinalRound from "../../components/session/SessionFinalRound";
import type { SessionPortraits } from "../../lib/sessionPortraits";
import type {
  FinalGalleryItem,
  FinalGalleryView,
  LeaderboardEntry,
  SessionInfo,
  SessionPlayerInfo,
} from "./types";

export default function SessionFinalGallery({
  finalGallery,
  mediaUrl,
  busyKey,
  voteForFinalMedia,
  leaderboard,
  session,
  portraits,
}: {
  finalGallery: FinalGalleryView | null;
  mediaUrl: (path: string) => string;
  busyKey: string | null;
  voteForFinalMedia: (item: FinalGalleryItem) => Promise<void>;
  leaderboard: LeaderboardEntry[];
  player: SessionPlayerInfo;
  session: SessionInfo;
  portraits: SessionPortraits;
  teamLeaderboard: {
    score: number;
    id: string;
    name: string;
    member_count: number;
  }[];
}) {
  const votingOpen = isFinalVotingOpen(finalGallery, session);
  const completed = Boolean(finalGallery?.voting_completed && !votingOpen);
  return (
    <SessionFinalRound
      title={finalGallery?.challenge_title}
      description={finalGallery?.challenge_description}
      points={finalGallery?.challenge_points ?? 0}
      galleryOpen={Boolean(finalGallery?.gallery_open)}
      votingOpen={votingOpen}
      completed={completed}
      busy={busyKey !== null}
      entries={(finalGallery?.items ?? []).map((item) => ({
        id: item.id,
        participant: {
          name: item.player_name,
          avatarUrl:
            portraits.players[item.player_id] ?? item.player_avatar_url,
        },
        challengeTitle: item.challenge_title,
        media: {
          id: item.id,
          url: mediaUrl(item.storage_path),
          mediaType: item.media_type,
          description: \`\${item.player_name}'s entry for \${item.challenge_title}\`,
        },
        selected: item.is_my_vote,
        winner: Boolean(completed && item.is_winner),
        voteCount: votingOpen ? null : item.vote_count,
        voters: completed
          ? item.voters.map((voter) => ({
              id: voter.id,
              name: voter.name,
              avatarUrl: portraits.players[voter.id] ?? voter.avatar_url,
            }))
          : undefined,
      }))}
      onVote={
        finalGallery?.voting_open
          ? (id) => {
              const item = finalGallery.items.find((entry) => entry.id === id);
              if (item) void voteForFinalMedia(item);
            }
          : undefined
      }
      leaderboard={leaderboard.map((entry) => ({
        id: entry.player_id,
        name: entry.name,
        score: entry.score,
        avatarUrl: portraits.players[entry.player_id] ?? entry.avatar_url,
        teamName: entry.team_name,
      }))}
    />
  );
}
`;export{e as default};