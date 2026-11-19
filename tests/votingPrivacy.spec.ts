import { expect, test } from "@playwright/test";
import { installSessionBackend } from "./support/sessionBackend";
import { seedReviewControls } from "./support/reviewControls";
import type {
  FinalGalleryView,
  SecretReviewView,
} from "../src/features/session-player/types";

for (const source of ["session", "presentation"] as const) {
  test(`host final ${source} open flag masks stale results until it closes`, async ({
    page,
  }) => {
    const backend = await installSessionBackend(page, { host: true });
    seedReviewControls(backend, "final", "results");
    backend.session.final_voting_open = source === "session";
    const state = {
      session_id: "test-session",
      is_open: true,
      voting_open: source === "presentation",
      slideshow_challenge_id: "test-side-challenge",
      slideshow_evidence_id: "final-photo-1",
    };
    backend.rows.cc_game_session_final_round_state = [state];
    await page.goto("#/host/live/test-session");
    await page.getByRole("button", { name: "Final", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Show Results", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("combobox", {
        name: "Choose side challenge",
        exact: true,
      }),
    ).toBeDisabled();
    await expect(page.getByText("Top submission", { exact: true })).toHaveCount(
      0,
    );
    await expect(page.getByText("1 votes", { exact: true })).toHaveCount(0);
    await expect(page.locator('[aria-label^="Voters for"]')).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Updated leaderboard", exact: true }),
    ).toHaveCount(0);
    backend.session.final_voting_open = false;
    state.voting_open = false;
    await page.reload();
    await page.getByRole("button", { name: "Final", exact: true }).click();
    await expect(
      page.getByText("Top submission", { exact: true }),
    ).toBeVisible();
    await expect(
      page
        .locator('[data-tour="player-final"]')
        .getByText("1 votes", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Updated leaderboard", exact: true }),
    ).toBeVisible();
    backend.verify();
  });
}

for (const source of ["state", "row"] as const) {
  test(`host secret ${source} voting signal masks stale result and assignment labels`, async ({
    page,
  }) => {
    const backend = await installSessionBackend(page, { host: true });
    seedReviewControls(backend, "secret", "results");
    const state = {
      session_id: "test-session",
      is_open: true,
      voting_open: source === "state",
      current_assignment_id: "secret-assignment",
      current_evidence_id: "secret-photo-1",
    };
    backend.rows.cc_game_session_secret_review_state = [state];
    const review = {
      session_id: "test-session",
      assignment_id: "secret-assignment",
      status: source === "row" ? "voting" : "results",
      success_votes: 1,
      fail_votes: 0,
      votes_cast: 1,
      outcome: "success",
      points_awarded: 25,
      opened_at: "2030-01-01",
      closed_at: "2030-01-01",
    };
    backend.rows.cc_game_session_secret_review_assignments = [review];
    const assignment = backend.rows.cc_game_session_secret_assignments?.[0];
    if (!assignment || typeof assignment !== "object")
      throw new Error("Missing secret assignment fixture");
    Object.assign(assignment, {
      status: "approved",
      awarded_points: 25,
      final_review_outcome: "success",
    });
    await page.goto("#/host/live/test-session");
    await page.getByRole("button", { name: "Host", exact: true }).click();
    await expect(page.getByText("SUCCESS", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Pat · success", { exact: true })).toHaveCount(
      0,
    );
    await expect(
      page.getByText("Success · +25 pts", { exact: true }),
    ).toHaveCount(0);
    await expect(page.getByText(/1 Success.*0 Fail.*1 votes/)).toHaveCount(0);
    await expect(
      page.getByRole("combobox", {
        name: "Choose a secret mission",
        exact: true,
      }),
    ).toBeDisabled();
    await expect(
      page.getByRole("button", {
        name: "Close voting and show results",
        exact: true,
      }),
    ).toBeVisible();
    state.voting_open = false;
    review.status = "results";
    await page.reload();
    await page.getByRole("button", { name: "Host", exact: true }).click();
    await expect(
      page.getByText("Success · +25 pts", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Pat · success", { exact: true }),
    ).toBeVisible();
    backend.verify();
  });
}

for (const source of ["gallery", "status", "session"] as const) {
  test(`player final ${source} voting signal masks contradictory completion data`, async ({
    page,
  }) => {
    const backend = await installSessionBackend(page);
    backend.session.final_gallery_open = true;
    backend.session.final_voting_open = source === "session";
    const gallery: FinalGalleryView = {
      gallery_open: true,
      voting_open: source === "gallery",
      voting_completed: true,
      sequence_completed: true,
      challenge_id: "test-side-challenge",
      challenge_title: "Find a pineapple",
      challenge_description: "Capture it.",
      challenge_points: 20,
      challenge_status: source === "status" ? "voting" : "results",
      votes_cast: 91,
      my_vote_id: null,
      items: [
        {
          id: "private-entry",
          player_id: "test-player",
          player_name: "Pat",
          player_avatar_url: null,
          challenge_title: "Find a pineapple",
          challenge_kind: "side",
          media_type: "image",
          storage_path: "test-session/test-player/private.png",
          vote_count: 91,
          is_my_vote: false,
          is_winner: true,
          voters: [
            { id: "private-voter", name: "Private voter", avatar_url: null },
          ],
        },
      ],
      leaderboard: [
        {
          player_id: "private-leader",
          name: "Unpublished leader",
          avatar_url: null,
          score: 777,
          team_id: null,
          team_name: null,
        },
      ],
    };
    backend.responses.cc_player_get_session_final_round_gallery = gallery;
    await page.goto("#/play/123456/final");
    await expect(
      page.getByRole("heading", { name: "Find a pineapple", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Updated leaderboard", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByText("Unpublished leader", { exact: true }),
    ).toHaveCount(0);
    await expect(page.getByText("91 votes", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Top submission", { exact: true })).toHaveCount(
      0,
    );
    await expect(page.getByText("Private voter", { exact: true })).toHaveCount(
      0,
    );
    if (source !== "gallery")
      await expect(
        page.getByRole("button", { name: "Vote for this", exact: true }),
      ).toHaveCount(0);
    gallery.voting_open = false;
    gallery.challenge_status = "results";
    backend.session.final_voting_open = false;
    await page.reload();
    await expect(
      page.getByText("Top submission", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("91 votes", { exact: true })).toBeVisible();
    await expect(
      page.getByText("Private voter", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Unpublished leader", { exact: true }),
    ).toBeVisible();
    backend.verify();
  });
}

for (const source of ["status", "takeover", "missing"] as const) {
  test(`player secret ${source} contradiction retains privacy and review precedence`, async ({
    page,
  }) => {
    const backend = await installSessionBackend(page);
    const review: SecretReviewView = {
      open: source !== "takeover",
      voting_open: source !== "status",
      assignment_id: "private-assignment",
      current_evidence_id: null,
      mission:
        source === "missing"
          ? null
          : {
              assignment_id: "private-assignment",
              player_id: "test-player",
              player_name: "Pat",
              player_avatar_url: null,
              title: "Secret toast",
              description: "Toast quietly.",
              points: 25,
              status: source === "status" ? "voting" : "results",
            },
      media: [],
      votes_cast: 2,
      success_votes: 91,
      fail_votes: 42,
      my_vote: null,
      outcome: "success",
      voters: [
        {
          id: "private-voter",
          name: "Private voter",
          avatar_url: null,
          vote: "success",
        },
      ],
      leaderboard: [
        {
          player_id: "private-leader",
          name: "Unpublished leader",
          avatar_url: null,
          team_id: null,
          team_name: null,
          score: 777,
        },
      ],
      my_final_reviews: [],
    };
    backend.responses.cc_player_get_session_secret_review = review;
    backend.responses.cc_player_get_session_reward_round = {
      id: "old-reward",
      challenge_id: "test-challenge",
      challenge_title: "Old reward",
      method: "voting",
      target_kind: "player",
      points: 20,
      status: "completed",
      votes_cast: 1,
      my_vote_player_id: null,
      my_vote_team_id: null,
      candidates: [],
      winners: [
        {
          id: "old-winner",
          kind: "player",
          name: "Hidden reward winner",
          points: 20,
          votes: 1,
        },
      ],
      leaderboard: [],
    };
    await page.goto("#/play/123456");
    await expect(
      page.getByRole("heading", {
        name:
          source === "missing"
            ? "Secret mission review is loading…"
            : "Secret toast",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByText("Hidden reward winner", { exact: true }),
    ).toHaveCount(0);
    await expect(page.getByText("Private voter", { exact: false })).toHaveCount(
      0,
    );
    await expect(
      page.getByText("Unpublished leader", { exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByText("91 Success · 42 Fail", { exact: true }),
    ).toHaveCount(0);
    if (source === "status")
      await expect(
        page.getByRole("button", { name: "SUCCESS", exact: true }),
      ).toHaveCount(0);
    if (review.mission) {
      review.open = true;
      review.voting_open = false;
      review.mission.status = "results";
      await page.reload();
      await expect(
        page.getByRole("heading", { name: "SUCCESS", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByText("91 Success · 42 Fail", { exact: true }),
      ).toBeVisible();
    }
    backend.verify();
  });
}
