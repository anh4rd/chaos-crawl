import { updateGameState } from "../../../lib/gameApi";
export async function openVoting(current: () => boolean = () => true) {
  if (!current()) return;
  const confirmed = window.confirm("Open voting for the current challenge?");

  if (!confirmed) {
    return;
  }

  const { error } = await updateGameState({
    voting_open: true,

    show_vote_results: false,

    slideshow_open: false,
  });

  if (!current()) return;
  if (error) {
    alert(`Could not open voting: ${error.message}`);
  }
}
export async function closeVoting(current: () => boolean = () => true) {
  if (!current()) return;
  const confirmed = window.confirm("Close voting and show results?");

  if (!confirmed) {
    return;
  }

  const { error } = await updateGameState({
    voting_open: false,

    show_vote_results: true,

    slideshow_open: false,
  });

  if (!current()) return;
  if (error) {
    alert(`Could not show results: ${error.message}`);
  }
}
export async function closeResults(current: () => boolean = () => true) {
  if (!current()) return;
  const confirmed = window.confirm(
    "Close results and return everyone to the game?",
  );

  if (!confirmed) {
    return;
  }

  const { error } = await updateGameState({
    show_vote_results: false,

    voting_open: false,

    slideshow_open: false,
  });

  if (!current()) return;
  if (error) {
    alert(`Could not close results: ${error.message}`);
  }
}
