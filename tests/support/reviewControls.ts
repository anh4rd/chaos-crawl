import type { installSessionBackend } from "./sessionBackend";
import type { SessionEvidence } from "../../src/features/host-live/types";

type Backend = Awaited<ReturnType<typeof installSessionBackend>>;
export function seedReviewControls(
  backend: Backend,
  kind: "final" | "secret",
  state: "pending" | "voting" | "results",
) {
  const timestamp = "2030-01-01T12:00:00Z";
  const challengeId =
    kind === "final" ? "test-side-challenge" : "review-secret";
  const evidence: SessionEvidence[] = [1, 2].map((index) => ({
    id: `${kind}-photo-${index}`,
    session_id: "test-session",
    player_id: "test-player",
    challenge_id: challengeId,
    secret_assignment_id: kind === "secret" ? "secret-assignment" : null,
    storage_path: `test-session/test-player/${kind}-${index}.png`,
    media_type: "image",
    saved_for_final: kind === "final",
    created_at: timestamp,
  }));
  backend.rows.cc_game_session_evidence = evidence;
  if (kind === "final") {
    backend.rows.cc_game_session_submissions = [
      {
        id: "final-submission",
        player_id: "test-player",
        challenge_id: challengeId,
        status: "approved",
        awarded_points: 5,
        submitted_at: timestamp,
      },
    ];
    backend.session.final_gallery_open = state !== "pending";
    backend.session.final_voting_open = state === "voting";
    backend.rows.cc_game_session_final_round_state = [
      {
        session_id: "test-session",
        is_open: state !== "pending",
        voting_open: state === "voting",
        slideshow_challenge_id: challengeId,
        slideshow_evidence_id: evidence[0].id,
      },
    ];
    backend.rows.cc_game_session_final_round_challenges = [
      {
        session_id: "test-session",
        challenge_id: challengeId,
        status: state,
        votes_cast: 1,
        opened_at: timestamp,
        closed_at: state === "results" ? timestamp : null,
      },
    ];
    backend.rows.cc_game_session_final_round_votes = [
      {
        session_id: "test-session",
        challenge_id: challengeId,
        player_id: "test-player",
        evidence_id: evidence[0].id,
        voted_at: timestamp,
      },
    ];
    return;
  }
  backend.challenges.push({
    ...backend.challenges[0],
    id: challengeId,
    kind: "secret",
    title: "Secret toast",
    description: "Toast quietly.",
    round_number: null,
    points: 25,
  });
  backend.rows.cc_game_session_secret_assignments = [
    {
      id: "secret-assignment",
      session_id: "test-session",
      player_id: "test-player",
      challenge_id: challengeId,
      status: "submitted",
      scheduled_at: timestamp,
      sent_at: timestamp,
      submitted_at: timestamp,
      reviewed_at: null,
      awarded_points: 0,
      final_review_outcome: null,
      created_at: timestamp,
    },
  ];
  backend.rows.cc_game_session_secret_review_state = [
    {
      session_id: "test-session",
      is_open: state !== "pending",
      voting_open: state === "voting",
      current_assignment_id: "secret-assignment",
      current_evidence_id: evidence[0].id,
    },
  ];
  backend.rows.cc_game_session_secret_review_assignments = [
    {
      session_id: "test-session",
      assignment_id: "secret-assignment",
      status: state,
      success_votes: 1,
      fail_votes: 0,
      votes_cast: 1,
      outcome: state === "results" ? "success" : null,
      points_awarded: state === "results" ? 25 : 0,
      opened_at: timestamp,
      closed_at: state === "results" ? timestamp : null,
    },
  ];
  backend.rows.cc_game_session_secret_review_votes = [
    {
      session_id: "test-session",
      assignment_id: "secret-assignment",
      player_id: "test-player",
      vote: "success",
      voted_at: timestamp,
    },
  ];
}
