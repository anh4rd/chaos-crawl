import type { Challenge, GameState, Pub } from "../../../types/database";

export function challengesForPub(
  challenges: readonly Challenge[],
  pub: Pub | undefined,
) {
  return challenges
    .filter((challenge) => String(challenge.pub_id) === String(pub?.id))
    .sort((a, b) => a.reveal_order - b.reveal_order);
}

export function deriveRoundControls(
  game: GameState | null,
  pubs: readonly Pub[],
  challenges: readonly Challenge[],
  selectedPub: string,
) {
  const sortedPubs = [...pubs].sort(
    (a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0),
  );
  const currentPubIndex = sortedPubs.findIndex(
    (pub) => pub.name === game?.current_pub,
  );
  const nextPub =
    currentPubIndex >= 0 ? sortedPubs[currentPubIndex + 1] : undefined;
  const selectedPubObject = pubs.find((pub) => pub.name === selectedPub);
  const livePub = pubs.find((pub) => pub.name === game?.current_pub);
  const availableChallenges = challenges.filter(
    (challenge) => String(challenge.pub_id) === String(selectedPubObject?.id),
  );
  const currentRoundChallenges = challengesForPub(challenges, livePub);
  const currentChallengeIndex = currentRoundChallenges.findIndex(
    (challenge) => String(challenge.id) === String(game?.current_challenge_id),
  );
  const nextRoundChallenge =
    currentChallengeIndex >= 0
      ? currentRoundChallenges[currentChallengeIndex + 1]
      : currentRoundChallenges[0];
  return {
    sortedPubs,
    nextPub,
    availableChallenges,
    currentRoundChallenges,
    currentChallengeIndex,
    nextRoundChallenge,
    nextPubChallenge: challengesForPub(challenges, nextPub)[0],
  };
}
