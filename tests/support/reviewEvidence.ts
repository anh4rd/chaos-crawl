import type { SessionEvidence } from "../../src/features/host-live/types";
import type { installSessionBackend } from "./sessionBackend";

type Backend = Awaited<ReturnType<typeof installSessionBackend>>;

export function seedReviewEvidence(backend: Backend) {
  const timestamp = "2030-01-01T12:00:00Z";
  backend.challenges.push({
    ...backend.challenges[0],
    id: "secret-review-task",
    kind: "secret",
    title: "Secret portrait",
    round_number: null,
  });
  backend.rows.cc_game_session_submissions = [
    ...(["submitted", "approved", "rejected"] as const).map((status) => ({
      id: `main-${status}`,
      player_id: "test-player",
      challenge_id: "test-challenge",
      status,
      awarded_points: status === "approved" ? 20 : 0,
      submitted_at: timestamp,
    })),
    {
      id: "side-approved",
      player_id: "test-player",
      challenge_id: "test-side-challenge",
      status: "approved",
      awarded_points: 5,
      submitted_at: timestamp,
    },
  ];
  backend.rows.cc_game_session_secret_assignments = [
    {
      id: "secret-assignment",
      session_id: "test-session",
      player_id: "test-player",
      challenge_id: "secret-review-task",
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
  const evidence: SessionEvidence[] = [
    ...(
      ["test-challenge", "test-side-challenge", "secret-review-task"] as const
    ).flatMap((challengeId) =>
      (["image", "video"] as const).map((mediaType) => ({
        id: `${challengeId}-${mediaType}`,
        session_id: "test-session",
        player_id: "test-player",
        challenge_id: challengeId,
        secret_assignment_id:
          challengeId === "secret-review-task" ? "secret-assignment" : null,
        media_type: mediaType,
        storage_path: `test-session/test-player/${challengeId}.${mediaType === "video" ? "webm" : "png"}`,
        caption: null,
        saved_for_final: false,
        created_at: timestamp,
      })),
    ),
  ];
  backend.rows.cc_game_session_evidence = evidence;
}
