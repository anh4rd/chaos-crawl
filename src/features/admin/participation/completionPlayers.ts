import type { ChallengeCompletion, Player } from "../../../types/database";

type CompletionParticipant = Pick<
  ChallengeCompletion,
  "player_id" | "challenge_type"
> & { challenge_id: string | number };

export function sideChallengePlayers(
  completions: readonly CompletionParticipant[],
  players: readonly Player[],
) {
  const playersById = new Map(players.map((player) => [player.id, player]));
  const completedBy = new Map<string, Map<string, Player>>();
  for (const completion of completions) {
    if (completion.challenge_type !== "side") continue;
    const player = playersById.get(completion.player_id);
    if (!player) continue;
    const id = String(completion.challenge_id);
    const participants = completedBy.get(id) ?? new Map<string, Player>();
    participants.set(player.id, player);
    completedBy.set(id, participants);
  }
  return new Map(
    [...completedBy].map(([id, participants]) => [
      id,
      [...participants.values()],
    ]),
  );
}
