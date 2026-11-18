import { expect, type Locator, type Page } from "@playwright/test";
import type {
  PlayerRewardRound,
  SecretMission,
  SecretReviewView,
} from "../../src/features/session-player/types";
import type { installSessionBackend } from "./sessionBackend";

type Backend = Awaited<ReturnType<typeof installSessionBackend>>;

export async function selectMissionDescription(page: Page, paragraph: Locator) {
  const point = await paragraph.evaluate((element) => {
    const text = element.firstChild;
    if (!text?.textContent)
      throw new Error("Mission description must contain text.");
    const range = document.createRange();
    range.setStart(text, 0);
    range.setEnd(text, Math.min(4, text.textContent.length));
    const word = range.getBoundingClientRect();
    const box = element.getBoundingClientRect();
    return {
      x: word.x - box.x + word.width / 2,
      y: word.y - box.y + word.height / 2,
    };
  });
  await paragraph.dblclick({ position: point });
  await expect
    .poll(() =>
      page.evaluate(() => window.getSelection()?.toString().trim() ?? ""),
    )
    .not.toBe("");
}
export const seenMissionKey =
  "chaos-crawl-seen-secret-missions:123456:test-player";
export const dismissedMissionKey =
  "chaos-crawl-dismissed-secret-missions:123456:test-player";

export function privateMissionFixture(
  overrides: Partial<SecretMission> = {},
): SecretMission {
  return {
    assignment_id: "private-one",
    challenge_id: "private-challenge",
    title: "Lead a conga line",
    description: "Start a conga line without revealing your secret mission.",
    points: 30,
    duration_minutes: 5,
    status: "sent",
    scheduled_at: "2030-01-01T12:00:00Z",
    sent_at: "2030-01-01T12:00:00Z",
    submitted_at: null,
    reviewed_at: null,
    awarded_points: 0,
    allow_photo_upload: false,
    ...overrides,
  };
}

export function seedPrivateMissions(
  backend: Backend,
  missions = [privateMissionFixture()],
) {
  backend.responses.cc_get_player_secret_missions = missions;
  return missions;
}

export function privateMissionReward(): PlayerRewardRound {
  return {
    id: "private-reward",
    challenge_id: "test-challenge",
    challenge_title: "Mission pause reward",
    method: "host_awards",
    target_kind: "player",
    points: 20,
    status: "open",
    votes_cast: 0,
    my_vote_player_id: null,
    my_vote_team_id: null,
    candidates: [],
    winners: [],
    leaderboard: [],
  };
}

export function privateMissionReview(): SecretReviewView {
  return {
    open: true,
    voting_open: true,
    assignment_id: "review-one",
    current_evidence_id: null,
    mission: null,
    media: [],
    votes_cast: 0,
    success_votes: null,
    fail_votes: null,
    my_vote: null,
    outcome: null,
    voters: [],
    leaderboard: [],
    my_final_reviews: [],
  };
}

export function expectPrivateMissionReadsOnly(backend: Backend) {
  const reads = new Set([
    "cc_get_public_game_invite",
    "cc_get_game_session_view",
    "cc_player_get_session_reward_round",
    "cc_get_player_secret_missions",
    "cc_player_get_session_secret_review",
    "cc_get_player_session_evidence",
    "cc_get_player_session_leaderboard",
    "cc_player_get_session_final_gallery",
  ]);
  expect(
    backend.requests.filter(
      (request) => request.method !== "GET" && !reads.has(request.name),
    ),
  ).toEqual([]);
  backend.verify();
}
