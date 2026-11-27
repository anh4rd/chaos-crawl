import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import SecretMissionCard from "./SecretMissionCard";
import type { SecretMission } from "./types";

afterEach(cleanup);
it("requires a written answer without offering an upload", () => {
  const mission: SecretMission = {
    assignment_id: "answer",
    challenge_id: "question",
    title: "Secret question",
    description: "What did you find?",
    points: 10,
    duration_minutes: 5,
    status: "sent",
    scheduled_at: "2030-01-01",
    sent_at: null,
    submitted_at: null,
    reviewed_at: null,
    awarded_points: 0,
    allow_photo_upload: false,
    response_mode: "text",
  };
  const onSubmit = vi.fn();
  render(
    <SecretMissionCard
      mission={mission}
      evidence={[]}
      busy={false}
      uploading={false}
      onUpload={vi.fn()}
      onSubmit={onSubmit}
      onDismiss={vi.fn()}
    />,
  );
  const submit = screen.getByRole("button", {
    name: "I've completed my mission",
  });
  expect(submit.hasAttribute("disabled")).toBe(true);
  expect(
    screen.queryByLabelText("Upload evidence for Secret question"),
  ).toBeNull();
  fireEvent.change(screen.getByLabelText("Your answer"), {
    target: { value: "A clue" },
  });
  fireEvent.click(submit);
  expect(onSubmit).toHaveBeenCalledWith("A clue");
});
it("locks a final failed mission against resubmission while retaining dismissal", () => {
  const mission: SecretMission = {
    assignment_id: "assignment",
    challenge_id: "challenge",
    title: "Secret entrance",
    description: "Enter dramatically.",
    points: 20,
    duration_minutes: 5,
    status: "rejected",
    scheduled_at: "2030-01-01",
    sent_at: null,
    submitted_at: null,
    reviewed_at: null,
    awarded_points: 0,
    allow_photo_upload: true,
  };
  const onSubmit = vi.fn();
  const onDismiss = vi.fn();
  render(
    <SecretMissionCard
      mission={mission}
      finalOutcome="fail"
      evidence={[]}
      busy={false}
      uploading={false}
      onUpload={vi.fn()}
      onSubmit={onSubmit}
      onDismiss={onDismiss}
    />,
  );
  expect(
    screen.queryByRole("button", { name: "Try again — I've done it" }),
  ).toBeNull();
  expect(
    screen
      .getByLabelText("Upload evidence for Secret entrance")
      .hasAttribute("disabled"),
  ).toBe(true);
  fireEvent.click(
    screen.getByRole("button", { name: "Dismiss completed mission" }),
  );
  expect(onDismiss).toHaveBeenCalledOnce();
  expect(onSubmit).not.toHaveBeenCalled();
});
