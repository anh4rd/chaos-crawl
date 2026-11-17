import type { RewardPresentation } from "../../components/session/types";
import type {
  SessionPlayer,
  SessionRewardAward,
  SessionRewardRound,
  SessionRewardVote,
  SessionTeam,
} from "./types";
export function rewardPresentation(
  round: SessionRewardRound,
  title: string,
  votes: SessionRewardVote[],
  awards: SessionRewardAward[],
  candidates: { id: string; name: string; detail: string }[],
  players: SessionPlayer[],
  teams: SessionTeam[],
  selectedId?: string | null,
): RewardPresentation {
  return {
    title,
    method: round.reward_method,
    target: round.target_kind,
    points: round.points,
    completed: round.status === "completed",
    votesCast: votes.length,
    selectedId,
    candidates,
    winners: awards.map((award) => ({
      id: award.id,
      name: award.winner_player_id
        ? (players.find((player) => player.id === award.winner_player_id)
            ?.name ?? "Winner")
        : (teams.find((team) => team.id === award.winner_team_id)?.name ??
          "Winner"),
      points: award.points_awarded,
      votes: award.votes_received,
    })),
    leaderboard: [...players]
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
      .map((player) => ({
        id: player.id,
        name: player.name,
        score: player.score,
        avatarUrl: player.avatar_url,
        teamName: teams.find((team) => team.id === player.team_id)?.name,
      })),
  };
}
