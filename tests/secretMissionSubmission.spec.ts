import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { activateByKeyboard, tabTo } from "./support/keyboard";
import { installSessionBackend } from "./support/sessionBackend";
import {
  privateMissionFixture,
  privateMissionReview,
  seedPrivateMissions,
} from "./support/privateMissions";

async function acceptMission(page: Page, title: string) {
  await activateByKeyboard(
    page,
    page
      .getByRole("dialog", { name: title, exact: true })
      .getByRole("button", { name: "Play", exact: true }),
  );
}
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2030-01-01T12:00:00Z"));
});
test("a player can submit a written secret mission answer", async ({
  page,
}) => {
  const backend = await installSessionBackend(page);
  seedPrivateMissions(backend, [
    privateMissionFixture({ response_mode: "text", allow_photo_upload: false }),
  ]);
  await page.goto("#/play/123456");
  await acceptMission(page, "Lead a conga line");
  const card = page.locator("#cc-side-challenge-private-one");
  const submit = card.getByRole("button", {
    name: "I've completed my mission",
  });
  await expect(submit).toBeDisabled();
  await expect(
    card.getByLabel("Upload evidence for Lead a conga line"),
  ).toHaveCount(0);
  await card.getByLabel("Your answer").fill("My secret answer");
  await activateByKeyboard(page, submit);
  await expect(card.getByRole("status")).toHaveText(
    "Marked complete · waiting for the group review",
  );
  expect(
    backend.requests
      .filter((request) => request.name === "cc_player_submit_secret_text")
      .map((request) => request.body),
  ).toEqual([
    {
      p_join_code: "123456",
      p_player_token: "test-player-token",
      p_assignment_id: "private-one",
      p_answer: "My secret answer",
    },
  ]);
  backend.verify();
});
test("the secret slideshow introduces the player and mission before the answer", async ({
  page,
}) => {
  const backend = await installSessionBackend(page);
  backend.responses.cc_get_session_secret_review_slideshow = {
    open: true,
    assignment_id: "private-one",
    evidence_id: null,
    mission: {
      title: "Secret question",
      description: "What did you find?",
      player_name: "Pat",
    },
    items: [],
    answer: "A secret clue",
  };
  await page.goto("#/secret-slideshow/test-session");
  await expect(
    page.getByRole("heading", { name: "Secret question" }),
  ).toBeVisible();
  await expect(page.getByText("SECRET MISSION · Pat")).toBeVisible();
  await expect(page.getByText("A secret clue")).toHaveCount(0);
  await expect(page.getByText("A secret clue")).toBeVisible({ timeout: 8000 });
  backend.verify();
});
for (const media of ["image", "video"] as const) {
  test(`uploads assignment evidence and submits the secret mission with ${media}`, async ({
    page,
  }) => {
    const backend = await installSessionBackend(page);
    seedPrivateMissions(backend, [
      privateMissionFixture({ allow_photo_upload: true }),
      privateMissionFixture({
        assignment_id: "private-two",
        title: "Other mission",
        challenge_id: "other-challenge",
        allow_photo_upload: true,
      }),
    ]);
    await page.goto("#/play/123456");
    await acceptMission(page, "Lead a conga line");
    await acceptMission(page, "Other mission");
    const card = page.locator("#cc-side-challenge-private-one");
    const other = page.locator("#cc-side-challenge-private-two");
    const submit = card.getByRole("button", {
      name: "I've completed my mission",
      exact: true,
    });
    await expect(submit).toBeDisabled();
    const upload = card.getByLabel("Upload evidence for Lead a conga line", {
      exact: true,
    });
    await tabTo(page, upload);
    const choosing = page.waitForEvent("filechooser");
    await page.keyboard.press("Enter");
    await (
      await choosing
    ).setFiles(
      media === "image"
        ? {
            name: "mission.png",
            mimeType: "image/png",
            buffer: Buffer.from("fixture image"),
          }
        : {
            name: "mission.webm",
            mimeType: "video/webm",
            buffer: readFileSync(resolve("tests/support/fixtures/review.webm")),
          },
    );
    await expect(
      card.locator(
        media === "image" ? ".evidence-gallery img" : ".evidence-gallery video",
      ),
    ).toHaveCount(1);
    await expect(
      other.getByRole("button", {
        name: "I've completed my mission",
        exact: true,
      }),
    ).toBeDisabled();
    const registered = backend.requests.filter(
      (request) => request.name === "cc_player_add_session_evidence",
    );
    expect(registered).toHaveLength(1);
    expect(registered[0]?.body).toEqual({
      p_join_code: "123456",
      p_player_token: "test-player-token",
      p_challenge_id: "private-challenge",
      p_secret_assignment_id: "private-one",
      p_storage_path: expect.stringMatching(
        new RegExp(
          `^test-session/test-player/[^/]+\\.${media === "image" ? "png" : "webm"}$`,
        ),
      ),
      p_media_type: media,
    });
    await activateByKeyboard(page, submit);
    await expect(card.getByRole("status")).toHaveText(
      "Marked complete · waiting for the group review",
    );
    expect(
      backend.requests
        .filter((request) => request.name === "cc_player_submit_secret_mission")
        .map((request) => request.body),
    ).toEqual([
      {
        p_join_code: "123456",
        p_player_token: "test-player-token",
        p_assignment_id: "private-one",
      },
    ]);
    expect(
      backend.requests.filter(
        (request) => request.name === "cc_player_submit_session_challenge",
      ),
    ).toEqual([]);
    backend.verify();
  });
}
test("failed secret submission clears busy and supports a successful native retry", async ({
  page,
}) => {
  const backend = await installSessionBackend(page);
  seedPrivateMissions(backend);
  backend.failures.add("cc_player_submit_secret_mission");
  await page.goto("#/play/123456");
  await acceptMission(page, "Lead a conga line");
  const submit = page.getByRole("button", {
    name: "I've completed my mission",
    exact: true,
  });
  let release: () => void = () => {};
  const waiting = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(
    "**/rpc/cc_player_submit_secret_mission",
    async (route) => {
      await waiting;
      await route.fallback();
    },
    { times: 1 },
  );
  try {
    await activateByKeyboard(page, submit);
    await expect(submit).toBeDisabled();
  } finally {
    release();
  }
  await expect(page.getByRole("alert")).toContainText(
    "Fixture connection failed",
  );
  await expect(submit).toBeEnabled();
  expect(
    backend.requests.filter(
      (request) => request.name === "cc_player_submit_secret_mission",
    ),
  ).toHaveLength(1);
  backend.failures.delete("cc_player_submit_secret_mission");
  await activateByKeyboard(page, submit);
  await expect(
    page.locator("#cc-side-challenge-private-one").getByRole("status"),
  ).toHaveText("Marked complete · waiting for the group review");
  expect(
    backend.requests.filter(
      (request) => request.name === "cc_player_submit_secret_mission",
    ),
  ).toHaveLength(2);
  backend.verify();
});
test("a final-reviewed mission cannot upload or resubmit", async ({ page }) => {
  const backend = await installSessionBackend(page);
  seedPrivateMissions(backend);
  backend.responses.cc_player_get_session_secret_review = {
    ...privateMissionReview(),
    open: false,
    voting_open: false,
    my_final_reviews: [
      { assignment_id: "private-one", outcome: "fail", points_awarded: 0 },
    ],
  };
  await page.goto("#/play/123456");
  await acceptMission(page, "Lead a conga line");
  const card = page.locator("#cc-side-challenge-private-one");
  await expect(
    card.getByLabel("Upload evidence for Lead a conga line", { exact: true }),
  ).toBeDisabled();
  await expect(
    card.getByRole("button", {
      name: "I've completed my mission",
      exact: true,
    }),
  ).toHaveCount(0);
  expect(
    backend.requests.filter((request) =>
      [
        "cc_player_add_session_evidence",
        "cc_player_submit_secret_mission",
      ].includes(request.name),
    ),
  ).toEqual([]);
  backend.verify();
});
