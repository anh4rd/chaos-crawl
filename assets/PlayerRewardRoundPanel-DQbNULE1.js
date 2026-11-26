var e=`import SessionRewardRound from "../../components/session/SessionRewardRound";
import type { PlayerRewardRound, SessionPlayerInfo } from "./types";

export default function PlayerRewardRoundPanel({
  rewardRound,
  busyKey,
  voteInRewardRound,
  player,
}: {
  rewardRound: PlayerRewardRound;
  busyKey: string | null;
  voteInRewardRound: (id: string) => Promise<void>;
  player: SessionPlayerInfo;
}) {
  return (
    <SessionRewardRound
      viewerId={player.id}
      busy={busyKey !== null}
      onVote={(id) => void voteInRewardRound(id)}
      round={{
        title: rewardRound.challenge_title,
        method: rewardRound.method,
        target: rewardRound.target_kind,
        points: rewardRound.points,
        completed: rewardRound.status === "completed",
        votesCast: rewardRound.votes_cast,
        selectedId:
          rewardRound.target_kind === "team"
            ? rewardRound.my_vote_team_id
            : rewardRound.my_vote_player_id,
        candidates: rewardRound.candidates.map((candidate) => ({
          id: candidate.id,
          name: candidate.name,
          detail:
            rewardRound.target_kind === "team"
              ? \`\${candidate.member_count ?? 0} players\`
              : (candidate.team_name ?? "Individual player"),
        })),
        winners: rewardRound.winners.map((winner) => ({
          id: winner.id,
          name: winner.name,
          points: winner.points,
          votes: winner.votes,
        })),
        leaderboard: rewardRound.leaderboard.map((entry) => ({
          id: entry.id,
          name: entry.name,
          score: entry.score,
          teamName: entry.team_name,
        })),
      }}
    />
  );
}
`;export{e as default};