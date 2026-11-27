import { expect, test } from "@playwright/test";
import { activateByKeyboard } from "./support/keyboard";
import { installLegacyWorkspace } from "./support/legacyWorkspace";

const reviewPath = "#/challenge-review?type=side&id=11&title=Side%20task";

test("legacy join trims the name and stores the created legacy identity", async ({
  page,
}) => {
  const { backend, commands } = await installLegacyWorkspace(page);
  await page.addInitScript(() =>
    localStorage.removeItem("chaos-crawl-player-id"),
  );
  await page.goto("#/legacy/join");
  await page
    .getByRole("textbox", { name: "Your name", exact: true })
    .fill("  Nora  ");
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Join Game", exact: true }),
  );
  await expect(page).toHaveURL(/#\/game$/);
  expect(commands.filter((command) => command.table === "players")).toEqual([
    { table: "players", body: { name: "Nora", team: null, score: 0 } },
  ]);
  expect(
    await page.evaluate(() => localStorage.getItem("chaos-crawl-player-id")),
  ).toBe("new-player");
  backend.verify();
});

test("a failed main completion rolls back and retries without writing a score", async ({
  page,
}) => {
  const { backend, commands, failNext } = await installLegacyWorkspace(page);
  failNext.add("challenge_completions");
  await page.goto("#/game");
  const done = page
    .getByRole("button", { name: "✓ Mark Done", exact: true })
    .first();
  await activateByKeyboard(page, done);
  await expect(page.getByRole("alert")).toContainText(
    "Fixture challenge_completions write failed",
  );
  await expect(done).toBeEnabled();
  await activateByKeyboard(page, done);
  await expect(
    page.getByText("✓ Challenge completed", { exact: true }),
  ).toBeVisible();
  await expect
    .poll(() => commands)
    .toEqual(
      [0, 1].map(() => ({
        table: "challenge_completions",
        body: {
          player_id: "p1",
          challenge_type: "main",
          challenge_id: "2",
          points: 10,
          photo_id: null,
        },
      })),
    );
  backend.verify();
});

for (const target of ["player", "team"] as const) {
  test(`legacy ${target} voting preserves selection and exact vote payload`, async ({
    page,
  }) => {
    const { backend, commands, setGame } = await installLegacyWorkspace(page);
    setGame({
      voting_open: true,
      show_vote_results: false,
      voting_target: target,
    });
    await page.goto("#/vote");
    const cast = page.getByRole("button", { name: "Cast Vote", exact: true });
    await activateByKeyboard(page, cast);
    await expect(page.getByRole("alert")).toHaveText(
      target === "team" ? "Choose a team first." : "Choose someone first.",
    );
    const option = page.getByRole("button", {
      name: target === "team" ? "Ducks" : "Pat Ducks",
      exact: true,
    });
    await activateByKeyboard(page, option);
    await expect(option).toHaveAttribute("aria-pressed", "true");
    await activateByKeyboard(page, cast);
    await expect(
      page.getByRole("heading", { name: "Vote Cast!", exact: true }),
    ).toBeVisible();
    expect(commands).toEqual([
      {
        table: "votes",
        body: {
          voter_id: "p1",
          challenge_name: "Current challenge",
          voted_for_player_id: target === "player" ? "p1" : null,
          voted_for_team_id: target === "team" ? "t1" : null,
        },
      },
    ]);
    backend.verify();
  });
}

test("challenge review retains award drafts through validation and a failed team award", async ({
  page,
}) => {
  const { backend, commands, failNext, review } =
    await installLegacyWorkspace(page);
  review(false);
  await page.goto(reviewPath);
  await expect(
    page.getByText("Completed without media.", { exact: true }),
  ).toBeVisible();
  const award = page.getByRole("button", { name: "Award Points", exact: true });
  const points = page.getByRole("spinbutton", {
    name: "Points to award to Pat",
    exact: true,
  });
  await points.fill("0");
  await activateByKeyboard(page, award);
  await expect(page.getByRole("alert")).toHaveText(
    "Enter a finite, nonzero points amount.",
  );
  expect(commands).toHaveLength(0);
  await points.fill("7");
  await page
    .getByRole("combobox", { name: "Award to", exact: true })
    .selectOption("team");
  failNext.add("score_events");
  await activateByKeyboard(page, award);
  await expect(page.getByRole("alert")).toContainText(
    "Fixture score_events write failed",
  );
  await expect(points).toHaveValue("7");
  await expect(
    page.getByRole("combobox", { name: "Award to", exact: true }),
  ).toHaveValue("team");
  await activateByKeyboard(page, award);
  await expect(page.getByRole("status")).toHaveText("Awarded 7 points!");
  await expect(points).toHaveValue("");
  expect(commands).toEqual(
    [0, 1].map(() => ({
      table: "score_events",
      body: {
        player_id: null,
        team_name: "Ducks",
        challenge_type: "side",
        challenge_id: "11",
        challenge_title: "Side task",
        points: 7,
        reason: "Awarded from Side task",
      },
    })),
  );
  backend.verify();
});

test("challenge review resolves image evidence without changing its native controls", async ({
  page,
}) => {
  const { backend, review } = await installLegacyWorkspace(page);
  review(true);
  await page.goto(reviewPath);
  await expect(
    page.getByRole("img", { name: "Challenge submission", exact: true }),
  ).toHaveAttribute("src", "/chaos-crawl/chaos-logo.png");
  await expect(
    page.getByRole("spinbutton", {
      name: "Points to award to Pat",
      exact: true,
    }),
  ).toBeEnabled();
  backend.verify();
});

test("local legacy player views join and vote without connected controllers", async ({
  page,
}) => {
  let backendRequests = 0;
  await page.route("**/rest/v1/**", async (route) => {
    backendRequests += 1;
    await route.abort();
  });
  await page.route("**/auth/v1/**", async (route) => {
    backendRequests += 1;
    await route.abort();
  });
  await page.goto("#/styleguide");
  const example = page.locator(".component-example").filter({
    has: page.getByRole("heading", {
      name: "Local legacy player screens",
      exact: true,
    }),
  });
  await expect(example).toBeVisible();
  const ballotPhoto = example
    .getByRole("button", { name: "Pat Ducks", exact: true })
    .locator("img");
  await expect(ballotPhoto).toBeVisible();
  await expect(ballotPhoto).toHaveCSS("object-fit", "cover");
  await example
    .getByRole("textbox", { name: "Your name", exact: true })
    .fill("Nora");
  await example.getByRole("button", { name: "Join Game", exact: true }).click();
  await expect(
    example.getByRole("status").filter({ hasText: "Nora joined" }),
  ).toHaveText("Nora joined this local preview.");
  await example.getByRole("button", { name: "Pat Ducks", exact: true }).click();
  await example.getByRole("button", { name: "Cast Vote", exact: true }).click();
  await expect(
    example.getByRole("heading", { name: "Vote Cast!", exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(/#\/styleguide$/);
  expect(backendRequests).toBe(0);
});

test("leaving a pending legacy join ignores its later identity and navigation", async ({
  page,
}) => {
  const { backend } = await installLegacyWorkspace(page);
  await page.addInitScript(() =>
    localStorage.removeItem("chaos-crawl-player-id"),
  );
  let release: () => void = () => {
    throw new Error("Join gate not initialized");
  };
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let responseSent: () => void = () => {
    throw new Error("Response gate not initialized");
  };
  const sent = new Promise<void>((resolve) => {
    responseSent = resolve;
  });
  await page.route(
    (url) => url.pathname === "/rest/v1/players",
    async (route) => {
      if (route.request().method() !== "POST") {
        await route.fallback();
        return;
      }
      await gate;
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          id: "abandoned-player",
          name: "Nora",
          team: null,
          score: 0,
        }),
      });
      responseSent();
    },
  );
  await page.goto("#/legacy/join");
  await page
    .getByRole("textbox", { name: "Your name", exact: true })
    .fill("Nora");
  const pendingRequest = page.waitForRequest(
    (request) =>
      request.method() === "POST" &&
      new URL(request.url()).pathname === "/rest/v1/players",
  );
  await page.getByRole("button", { name: "Join Game", exact: true }).click();
  await pendingRequest;
  await expect(
    page.getByRole("button", { name: "Joining...", exact: true }),
  ).toBeDisabled();
  await page.goto("#/leaderboard");
  await expect(
    page.getByRole("heading", { name: "Leaderboard", exact: true }),
  ).toBeVisible();
  release();
  await sent;
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveURL(/#\/leaderboard$/);
  expect(
    await page.evaluate(() => localStorage.getItem("chaos-crawl-player-id")),
  ).toBeNull();
  backend.verify();
});
