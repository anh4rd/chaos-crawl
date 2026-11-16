import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGameState } from "../../../game/hooks/useGameState";
import { usePubs } from "../../../game/hooks/usePubs";
import { useChallenges } from "../../../game/hooks/useChallenges";
import type { Challenge } from "../../../types/database";
import { deriveRoundControls } from "./roundControls";
import * as commands from "./gameCommands";

export function useGameControls() {
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
    await commands.publishLiveGame(selectedPub, selectedChallenge, challenge);
  }
  async function moveToNextPub() {
    const { nextPub, nextPubChallenge } = round;
    if ((await commands.moveRound(nextPub, nextPubChallenge)) && nextPub) {
      setSelectedPub(nextPub.name);
      setSelectedChallenge(nextPubChallenge?.title ?? "");
    }
  }
  async function startSlideshow() {
    if (await commands.startSlideshow()) navigate("/slideshow?host=true");
  }
  function scheduleChallenge(challenge: Pick<Challenge, "id" | "title">) {
    return commands.scheduleChallenge(challenge, scheduleMinutes);
  }
  return {
    game,
    pubs,
    challenges,
    selectedPub,
    setSelectedPub,
    selectedChallenge,
    setSelectedChallenge,
    scheduleMinutes,
    setScheduleMinutes,
    ...round,
    revealRoundChallenge: commands.revealRoundChallenge,
    scheduleChallenge,
    cancelScheduledReveal: commands.cancelScheduledReveal,
    returnEveryoneToGame: commands.returnEveryoneToGame,
    goLive,
    moveToNextPub,
    startSlideshow,
    stopSlideshow: commands.stopSlideshow,
    navigate,
    queries: [gameQuery, pubsQuery, challengesQuery],
  };
}
