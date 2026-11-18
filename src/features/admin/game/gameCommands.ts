import { updateGameState } from "../../../lib/gameApi";
import type { Challenge, Pub } from "../../../types/database";

type RevealChallenge = Pick<
  Challenge,
  "id" | "title" | "description" | "reveal_order"
>;

export async function revealRoundChallenge(
  challenge: RevealChallenge,
  current: () => boolean = () => true,
) {
  if (!current()) return;
  if (!window.confirm(`Reveal "${challenge.title}" to everyone?`)) return;
  const { error } = await updateGameState({
    current_challenge_id: challenge.id,
    current_challenge: challenge.title,
    challenge_description: challenge.description ?? "",
    current_challenge_order: challenge.reveal_order,
    voting_open: false,
    show_vote_results: false,
    slideshow_open: false,
  });
  if (!current()) return;
  if (error) alert(`Could not reveal challenge: ${error.message}`);
}

export async function scheduleChallenge(
  challenge: Pick<Challenge, "id" | "title">,
  minutesText: string,
  current: () => boolean = () => true,
) {
  if (!current()) return;
  const minutes = Number(minutesText);
  if (!Number.isFinite(minutes) || minutes <= 0) {
    alert("Enter a valid number of minutes.");
    return;
  }
  const revealDate = new Date(Date.now() + minutes * 60_000);
  if (!Number.isFinite(revealDate.getTime())) {
    alert("Enter a reveal time within the supported date range.");
    return;
  }
  const revealAt = revealDate.toISOString();
  const { error } = await updateGameState({
    scheduled_challenge_id: challenge.id,
    scheduled_reveal_at: revealAt,
  });
  if (!current()) return;
  if (error) {
    alert(`Could not schedule challenge: ${error.message}`);
    return;
  }
  alert(
    `"${challenge.title}" scheduled for ${revealDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`,
  );
}

export async function cancelScheduledReveal(
  current: () => boolean = () => true,
) {
  if (!current()) return;
  const { error } = await updateGameState({
    scheduled_challenge_id: null,
    scheduled_reveal_at: null,
  });
  if (!current()) return;
  if (error) alert(`Could not cancel schedule: ${error.message}`);
}

export async function returnEveryoneToGame(
  current: () => boolean = () => true,
) {
  if (!current()) return;
  const { error } = await updateGameState({
    voting_open: false,
    show_vote_results: false,
    slideshow_open: false,
  });
  if (!current()) return;
  if (error) alert(`Could not return everyone: ${error.message}`);
}

export async function publishLiveGame(
  pubName: string,
  challengeTitle: string,
  challenge: Challenge | undefined,
  current: () => boolean = () => true,
) {
  if (!current()) return;
  if (!pubName) {
    alert("Select a pub first.");
    return;
  }
  if (!challengeTitle) {
    alert("Select a challenge first.");
    return;
  }
  const { error } = await updateGameState({
    current_pub: pubName,
    current_challenge_id: challenge?.id ?? null,
    current_challenge: challengeTitle,
    challenge_description: challenge?.description ?? "",
    current_challenge_order: challenge?.reveal_order ?? 0,
    voting_open: false,
    show_vote_results: false,
    slideshow_open: false,
  });
  if (!current()) return;
  if (error) {
    alert(`Could not update game: ${error.message}`);
    return;
  }
  alert("Live game updated!");
}

export async function moveRound(
  pub: Pub | undefined,
  challenge: Challenge | undefined,
  current: () => boolean = () => true,
) {
  if (!current()) return false;
  if (!pub) {
    alert("There is no next pub.");
    return false;
  }
  const { error } = await updateGameState({
    current_pub: pub.name,
    current_challenge_id: challenge?.id ?? null,
    current_challenge: challenge?.title ?? "",
    challenge_description: challenge?.description ?? "",
    current_challenge_order: challenge?.reveal_order ?? 0,
    voting_open: false,
    show_vote_results: false,
    slideshow_open: false,
  });
  if (!current()) return false;
  if (error) {
    alert(`Could not change pub: ${error.message}`);
    return false;
  }
  return true;
}

export async function startSlideshow(current: () => boolean = () => true) {
  if (!current()) return false;
  if (!window.confirm("Start the slideshow for everyone?")) return false;
  const { error } = await updateGameState({
    slideshow_open: true,
    voting_open: false,
    show_vote_results: false,
  });
  if (!current()) return false;
  if (error) {
    alert(`Could not start slideshow: ${error.message}`);
    return false;
  }
  return true;
}

export async function stopSlideshow(current: () => boolean = () => true) {
  if (!current()) return;
  if (!window.confirm("End slideshow for everyone?")) return;
  const { error } = await updateGameState({ slideshow_open: false });
  if (!current()) return;
  if (error) alert(`Could not end slideshow: ${error.message}`);
}
