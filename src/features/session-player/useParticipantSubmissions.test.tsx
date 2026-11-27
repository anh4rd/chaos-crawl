import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useParticipantSubmissions } from "./useParticipantSubmissions";
import { hostSessionFixture } from "../host-live/testFixtures";
import type {
  SecretMission,
  SecretReviewView,
  SessionEvidence,
  SessionView,
} from "./types";
const mocks = vi.hoisted(() => ({
  prepare: vi.fn(),
  upload: vi.fn(),
  submit: vi.fn(),
  submitText: vi.fn(),
}));
vi.mock("../../lib/sessionEvidence", () => ({
  prepareSessionEvidence: mocks.prepare,
  uploadSessionEvidence: mocks.upload,
}));
vi.mock("../../lib/sessionParticipantCommands", () => ({
  playerSubmitSecretMission: mocks.submit,
  playerSubmitSecretText: mocks.submitText,
}));
afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  mocks.prepare.mockReturnValue({
    data: { mediaType: "image", extension: "png", contentType: "image/png" },
    error: null,
  });
  mocks.upload.mockResolvedValue({ data: "path", error: null });
  mocks.submit.mockResolvedValue({ data: null, error: null });
  mocks.submitText.mockResolvedValue({ data: null, error: null });
});
function mission(overrides: Partial<SecretMission> = {}): SecretMission {
  return {
    assignment_id: "assignment",
    challenge_id: "secret-challenge",
    title: "Secret",
    description: "Perform quietly",
    points: 20,
    duration_minutes: 5,
    status: "sent",
    scheduled_at: "now",
    sent_at: "now",
    submitted_at: null,
    reviewed_at: null,
    awarded_points: 0,
    allow_photo_upload: true,
    ...overrides,
  };
}
it("submits a written answer through the text command and rejects blank text", async () => {
  const props = options();
  const { result } = renderHook(() => useParticipantSubmissions(props));
  const question = mission({
    response_mode: "text",
    allow_photo_upload: false,
  });
  await act(async () => result.current.submitSecretMission(question, "  "));
  expect(mocks.submitText).not.toHaveBeenCalled();
  expect(props.setError).toHaveBeenLastCalledWith(
    "Enter an answer before submitting this secret mission.",
  );
  await act(async () => result.current.submitSecretMission(question, "A clue"));
  expect(mocks.submitText).toHaveBeenCalledWith({
    p_join_code: "123456",
    p_player_token: "participant-token",
    p_assignment_id: "assignment",
    p_answer: "A clue",
  });
  expect(mocks.submit).not.toHaveBeenCalled();
  expect(props.loadView).toHaveBeenCalledOnce();
});
function review(): SecretReviewView {
  return {
    open: false,
    voting_open: false,
    assignment_id: null,
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
    my_final_reviews: [
      { assignment_id: "assignment", outcome: "fail", points_awarded: 0 },
    ],
  };
}
function options(): Parameters<typeof useParticipantSubmissions>[0] {
  const view: SessionView = {
    session: { ...hostSessionFixture(), round_count: 1 },
    player: {
      id: "player",
      name: "Player",
      avatar_url: null,
      score: 0,
      team_id: null,
      team_name: null,
    },
    teams: [],
    challenge: null,
    side_challenges: [],
    my_submissions: [],
  };
  return {
    view,
    token: "participant-token",
    code: "123456",
    setError: vi.fn(),
    secretReview: null,
    setBusyKey: vi.fn(),
    loadView: vi.fn(async () => {}),
    evidenceForChallenge: vi.fn(() => []),
    evidenceForSecret: vi.fn(() => []),
  };
}
it("refuses evidence-required submission without evidence for this assignment", async () => {
  const props = options();
  const { result } = renderHook(() => useParticipantSubmissions(props));
  await act(async () => {
    await result.current.submitSecretMission(mission());
  });
  expect(props.evidenceForSecret).toHaveBeenCalledWith("assignment");
  expect(mocks.submit).not.toHaveBeenCalled();
  expect(props.loadView).not.toHaveBeenCalled();
  expect(props.setError).toHaveBeenLastCalledWith(
    "Upload at least one photo or video before submitting this secret mission.",
  );
});
it.each([true, false])(
  "submits exact participant credentials and assignment, evidence required=%s",
  async (required) => {
    const props = options();
    const evidence: SessionEvidence = {
      id: "evidence",
      session_id: "session",
      player_id: "player",
      challenge_id: "secret-challenge",
      secret_assignment_id: "assignment",
      storage_path: "path",
      media_type: "image",
      saved_for_final: false,
      created_at: "now",
    };
    props.evidenceForSecret = vi.fn(() => (required ? [evidence] : []));
    const { result } = renderHook(() => useParticipantSubmissions(props));
    await act(async () => {
      await result.current.submitSecretMission(
        mission({ allow_photo_upload: required }),
      );
    });
    expect(mocks.submit).toHaveBeenCalledWith({
      p_join_code: "123456",
      p_player_token: "participant-token",
      p_assignment_id: "assignment",
    });
    expect(props.setBusyKey).toHaveBeenNthCalledWith(1, "assignment");
    expect(props.setBusyKey).toHaveBeenLastCalledWith(null);
    expect(props.loadView).toHaveBeenCalledOnce();
  },
);
it("clears busy on rejected submission, retains feedback and permits retry without success reload", async () => {
  const props = options();
  mocks.submit.mockResolvedValueOnce({
    data: null,
    error: { message: "Try later" },
  });
  const { result } = renderHook(() => useParticipantSubmissions(props));
  await act(async () => {
    await result.current.submitSecretMission(
      mission({ allow_photo_upload: false }),
    );
  });
  expect(props.setError).toHaveBeenLastCalledWith("Try later");
  expect(props.setBusyKey).toHaveBeenLastCalledWith(null);
  expect(props.loadView).not.toHaveBeenCalled();
  await act(async () => {
    await result.current.submitSecretMission(
      mission({ allow_photo_upload: false }),
    );
  });
  expect(mocks.submit).toHaveBeenCalledTimes(2);
  expect(props.loadView).toHaveBeenCalledOnce();
});
it("refuses final-reviewed assignments and leaves unrelated assignments usable", async () => {
  const props = options();
  props.secretReview = review();
  const { result } = renderHook(() => useParticipantSubmissions(props));
  await act(async () => {
    await result.current.submitSecretMission(
      mission({ allow_photo_upload: false }),
    );
  });
  expect(mocks.submit).not.toHaveBeenCalled();
  expect(props.setError).toHaveBeenLastCalledWith(
    "This secret mission has already received a final review result.",
  );
  await act(async () => {
    await result.current.submitSecretMission(
      mission({ assignment_id: "other", allow_photo_upload: false }),
    );
  });
  expect(mocks.submit).toHaveBeenCalledWith({
    p_join_code: "123456",
    p_player_token: "participant-token",
    p_assignment_id: "other",
  });
});
it.each(["image", "video"] as const)(
  "links %s upload to the mission challenge and assignment",
  async (mediaType) => {
    const props = options();
    const metadata = {
      mediaType,
      extension: mediaType === "image" ? "png" : "mp4",
      contentType: `${mediaType}/${mediaType === "image" ? "png" : "mp4"}`,
    };
    mocks.prepare.mockReturnValue({ data: metadata, error: null });
    const { result } = renderHook(() => useParticipantSubmissions(props));
    let pending: Promise<void> | undefined;
    const input = render(
      <input
        aria-label="Evidence"
        type="file"
        onChange={(event) => {
          pending = result.current.uploadEvidence(event, {
            type: "secret",
            mission: mission(),
          });
        }}
      />,
    ).getByLabelText("Evidence");
    const file = new File(["bytes"], `proof.${metadata.extension}`, {
      type: metadata.contentType,
    });
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
      await pending;
    });
    expect(mocks.upload).toHaveBeenCalledWith({
      file,
      sessionId: "session",
      playerId: "player",
      code: "123456",
      token: "participant-token",
      challengeId: "secret-challenge",
      assignmentId: "assignment",
      metadata,
    });
    expect(props.setBusyKey).toHaveBeenNthCalledWith(1, "upload:assignment");
    expect(props.setBusyKey).toHaveBeenLastCalledWith(null);
    expect(props.loadView).toHaveBeenCalledOnce();
  },
);
it.each(["approved", "reviewed"])(
  "refuses upload for %s mission without a persistence call",
  async (locked) => {
    const props = options();
    if (locked === "reviewed") props.secretReview = review();
    const { result } = renderHook(() => useParticipantSubmissions(props));
    let pending: Promise<void> | undefined;
    const input = render(
      <input
        aria-label="Evidence"
        type="file"
        onChange={(event) => {
          pending = result.current.uploadEvidence(event, {
            type: "secret",
            mission: mission({
              status: locked === "approved" ? "approved" : "sent",
            }),
          });
        }}
      />,
    ).getByLabelText("Evidence");
    await act(async () => {
      fireEvent.change(input, {
        target: {
          files: [new File(["image"], "proof.png", { type: "image/png" })],
        },
      });
      await pending;
    });
    expect(mocks.upload).not.toHaveBeenCalled();
    expect(props.setError).toHaveBeenLastCalledWith(
      "This secret mission has a final result, so no more evidence can be added.",
    );
    expect(props.loadView).not.toHaveBeenCalled();
  },
);
