import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGameState } from "../../../game/hooks/useGameState";
import { usePubs } from "../../../game/hooks/usePubs";
import { useChallenges } from "../../../game/hooks/useChallenges";
import type { Challenge } from "../../../types/database";
import { deriveRoundControls } from "./roundControls";
import * as commands from "./gameCommands";
import * as voting from "../voting/votingControls";
import { useAdminOperation } from "../useAdminOperation";

export function useGameControls(
  scope: "live" | "tonight" | "screens" = "live",
) {
  const run = useAdminOperation(scope);
  const onFailure = (cause: unknown) =>
    alert(
      `Could not update game: ${cause instanceof Error ? cause.message : "Unexpected error"}`,
    );
  const gameQuery = useGameState();
  const pubsQuery = usePubs();
  const challengesQuery = useChallenges();
  const game = gameQuery.data;
  const pubs = pubsQuery.data;
  const challenges = challengesQuery.data;
  const navigate = useNavigate();
  const [selectedPub, setSelectedPub] = useState("");
  const [selectedChallenge, setSelectedChallenge] = useState("");
  const [scheduleMinutes, setScheduleMinutes] = useState("10");
  const livePub = game?.current_pub ?? "";
  const liveChallenge = game?.current_challenge ?? "";
  useEffect(() => {
    setSelectedPub(livePub);
    setSelectedChallenge(liveChallenge);
  }, [livePub, liveChallenge]);
  const round = deriveRoundControls(game, pubs, challenges, selectedPub);

  async function goLive() {
    const pub = pubs.find((item) => item.name === selectedPub);
    const challenge = challenges.find(
      (item) =>
        item.title === selectedChallenge &&
        String(item.pub_id) === String(pub?.id),
    );
    await run(async (current) => {
      await commands.publishLiveGame(
        selectedPub,
        selectedChallenge,
        challenge,
        current,
      );
    }, onFailure);
  }
  async function moveToNextPub() {
    const { nextPub, nextPubChallenge } = round;
    await run(async (current) => {
      if (
        (await commands.moveRound(nextPub, nextPubChallenge, current)) &&
        nextPub &&
        current()
      ) {
        setSelectedPub(nextPub.name);
        setSelectedChallenge(nextPubChallenge?.title ?? "");
      }
    }, onFailure);
  }
  async function startSlideshow() {
    await run(async (current) => {
      if ((await commands.startSlideshow(current)) && current())
        navigate("/slideshow?host=true");
    }, onFailure);
  }
  function scheduleChallenge(challenge: Pick<Challenge, "id" | "title">) {
    return run(async (current) => {
      await commands.scheduleChallenge(challenge, scheduleMinutes, current);
    }, onFailure);
  }
  return {
    game,
    openVoting: () => run(voting.openVoting, onFailure),
    closeVoting: () => run(voting.closeVoting, onFailure),
    pubs,
    challenges,
    selectedPub,
    setSelectedPub,
    selectedChallenge,
    setSelectedChallenge,
    scheduleMinutes,
    setScheduleMinutes,
    ...round,
    revealRoundChallenge: (challenge: Challenge) =>
      run(
        (current) => commands.revealRoundChallenge(challenge, current),
        onFailure,
      ),
    scheduleChallenge,
    cancelScheduledReveal: () => run(commands.cancelScheduledReveal, onFailure),
    returnEveryoneToGame: () => run(commands.returnEveryoneToGame, onFailure),
    goLive,
    moveToNextPub,
    startSlideshow,
    stopSlideshow: () => run(commands.stopSlideshow, onFailure),
    navigate,
    queries: [gameQuery, pubsQuery, challengesQuery],
  };
}
