import SessionFinalRound from "../../components/session/SessionFinalRound";
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
}: {
  finalGallery: FinalGalleryView | null;
  mediaUrl: (path: string) => string;
  busyKey: string | null;
  voteForFinalMedia: (item: FinalGalleryItem) => Promise<void>;
  leaderboard: LeaderboardEntry[];
  player: SessionPlayerInfo;
  session: SessionInfo;
  teamLeaderboard: {
    score: number;
    id: string;
    name: string;
    member_count: number;
  }[];
}) {
  return (
    <SessionFinalRound
      title={finalGallery?.challenge_title}
      description={finalGallery?.challenge_description}
      points={finalGallery?.challenge_points ?? 0}
      galleryOpen={Boolean(finalGallery?.gallery_open)}
      votingOpen={Boolean(finalGallery?.voting_open)}
      completed={Boolean(finalGallery?.voting_completed)}
      busy={busyKey !== null}
      entries={(finalGallery?.items ?? []).map((item) => ({
        id: item.id,
        participant: {
          name: item.player_name,
          avatarUrl: item.player_avatar_url,
        },
        challengeTitle: item.challenge_title,
        media: {
          id: item.id,
          url: mediaUrl(item.storage_path),
          mediaType: item.media_type,
          description: `${item.player_name}'s entry for ${item.challenge_title}`,
        },
        selected: item.is_my_vote,
        winner: Boolean(finalGallery?.voting_completed && item.is_winner),
        voteCount: finalGallery?.voting_open ? null : item.vote_count,
        voters: finalGallery?.voting_completed
          ? item.voters.map((voter) => ({
              id: voter.id,
              name: voter.name,
              avatarUrl: voter.avatar_url,
            }))
          : undefined,
      }))}
      onVote={(id) => {
        const item = finalGallery?.items.find((entry) => entry.id === id);
        if (item) void voteForFinalMedia(item);
      }}
      leaderboard={leaderboard.map((entry) => ({
        id: entry.player_id,
        name: entry.name,
        score: entry.score,
        avatarUrl: entry.avatar_url,
        teamName: entry.team_name,
      }))}
    />
  );
}
