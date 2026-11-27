import { expect, test, type Locator } from "@playwright/test";
import { installSessionBackend } from "./support/sessionBackend";
import { seedHostRoundControls } from "./support/hostRoundControls";

async function checkCard(
  summary: Locator,
  titleSelector: string,
  timeline = false,
) {
  const marker = summary.locator(".disclosure-chevron");
  await expect(marker).toBeVisible();
  const geometry = await summary.evaluate((element) => {
    const icon = element.querySelector(".disclosure-chevron");
    if (!icon) throw new Error("Missing disclosure chevron");
    return {
      summary:
        element.getBoundingClientRect().right -
        Number.parseFloat(getComputedStyle(element).paddingRight),
      icon: icon.getBoundingClientRect().right,
    };
  });
  expect(Math.abs(geometry.summary - geometry.icon)).toBeLessThanOrEqual(2);
  const title = summary.locator(titleSelector).first();
  if (!timeline) {
    await expect(title).toHaveCSS("text-transform", "uppercase");
    await expect(title).toHaveCSS("font-size", "20px");
  }
  await summary.focus();
  if (
    await summary
      .locator("..")
      .evaluate((details) => details.hasAttribute("open"))
  ) {
    await summary.press("Enter");
    await expect(summary.locator("..")).not.toHaveAttribute("open", "");
  }
  await summary.press("Enter");
  await expect(summary.locator("..")).toHaveAttribute("open", "");
  await expect
    .poll(() => marker.evaluate((icon) => getComputedStyle(icon).transform))
    .toBe(
      timeline ? "matrix(0, 1, -1, 0, 0, 0)" : "matrix(-1, 0, 0, -1, 0, 0)",
    );
}

async function checkExpandedSurface(summary: Locator) {
  const card = summary.locator("..");
  const body = card.locator(":scope > .control-console__panel-content");
  await expect(body).toBeVisible();
  await expect(body).toHaveCSS("background-color", "rgb(255, 255, 255)");
  const geometry = await card.evaluate((element) => {
    const body = element.querySelector<HTMLElement>(
      ":scope > .control-console__panel-content",
    );
    if (!body) throw new Error("Missing expanded panel content");
    const cardRect = element.getBoundingClientRect();
    const bodyRect = body.getBoundingClientRect();
    const cardStyle = getComputedStyle(element);
    const bodyStyle = getComputedStyle(body);
    return {
      left:
        bodyRect.left - cardRect.left - parseFloat(cardStyle.borderLeftWidth),
      right:
        cardRect.right -
        bodyRect.right -
        parseFloat(cardStyle.borderRightWidth),
      outerPadding: parseFloat(cardStyle.paddingLeft),
      innerPadding: parseFloat(bodyStyle.paddingLeft),
      radius: parseFloat(bodyStyle.borderTopLeftRadius),
    };
  });
  expect(Math.abs(geometry.left)).toBeLessThanOrEqual(1);
  expect(Math.abs(geometry.right)).toBeLessThanOrEqual(1);
  expect(geometry.outerPadding).toBe(0);
  expect(geometry.innerPadding).toBeGreaterThan(0);
  expect(geometry.radius).toBeGreaterThan(0);
}

test("host card chevrons and headings are consistent across tabs on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const backend = await installSessionBackend(page, { host: true });
  seedHostRoundControls(backend, { currentRound: 2, breakMinutes: 5 });
  backend.session.teams_enabled = true;
  backend.rows.cc_game_session_teams = [
    { id: "team-1", name: "Very long team name", manual_score_adjustment: 0 },
  ];
  await page.goto("#/host/live/test-session");
  await page.getByRole("button", { name: "Host", exact: true }).click();

  await checkCard(
    page.locator(".control-console__more > summary"),
    ".control-console__more-summary",
  );
  await checkExpandedSurface(page.locator(".control-console__more > summary"));
  await checkCard(
    page.locator(".control-console__panel > summary").first(),
    ".control-console__summary-title",
  );
  const controlPanels = page.locator(".control-console__panel > summary");
  await checkExpandedSurface(controlPanels.first());
  for (const summary of await controlPanels.all()) {
    if (
      !(await summary
        .locator("..")
        .evaluate((card) => card.hasAttribute("open")))
    ) {
      await summary.click();
    }
    await checkExpandedSurface(summary);
  }
  await page.getByRole("tab", { name: "Review" }).click();
  await checkCard(
    page.locator(".control-console__panel > summary").first(),
    ".control-console__summary-title",
  );
  await checkExpandedSurface(
    page.locator(".control-console__panel > summary").first(),
  );
  await page.getByRole("tab", { name: "Teams" }).click();
  await checkCard(
    page.locator(".control-console__panel > summary").first(),
    ".control-console__summary-title",
  );
  await checkExpandedSurface(
    page.locator(".control-console__panel > summary").first(),
  );
  await checkCard(
    page.locator(".roster-team > summary").first(),
    ".roster-team__name",
  );
  await page.getByRole("tab", { name: "Schedule" }).click();
  await checkCard(
    page.locator(".host-game-schedule__card--collapsed > summary"),
    ".host-game-schedule__title",
    true,
  );
  await checkCard(
    page.locator(".host-game-schedule__row-summary").last(),
    ".host-game-schedule__title",
    true,
  );
  await page.getByRole("tab", { name: "Settings" }).click();
  await checkCard(
    page.locator(".host-settings__category > summary").first(),
    ".host-settings__heading strong",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 1280, height: 900 });
  for (const tab of ["Controls", "Review", "Teams"]) {
    await page.getByRole("tab", { name: tab, exact: true }).click();
    const summary = page.locator(".control-console__panel > summary").first();
    if (
      !(await summary
        .locator("..")
        .evaluate((card) => card.hasAttribute("open")))
    ) {
      await summary.click();
    }
    await checkExpandedSurface(summary);
  }
  backend.verify();
});

test("the shared submission card uses the same mobile disclosure marker", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("#/styleguide");
  await checkCard(
    page.locator(".submission-row > summary").first(),
    ".submission-row__challenge",
  );
});

test("schedule statistics match the roster summary without changing their values", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { host: true });
  Object.assign(backend.session, { start_time: "18:00" });
  await page.goto("#/host/live/test-session");
  await page.getByRole("button", { name: "Host", exact: true }).click();
  await page.getByRole("tab", { name: "Teams", exact: true }).click();
  const stats = page.locator(".stat-summary");
  await expect(stats.locator("dt")).toHaveText([
    "Players",
    "Teams",
    "Unassigned",
  ]);
  await expect(stats.locator("dd")).toHaveText(["1", "0", "0"]);
  expect(
    await stats
      .locator(".stat-summary__item")
      .first()
      .evaluate((item) => Array.from(item.children, (child) => child.tagName)),
  ).toEqual(["DD", "DT"]);
  const rosterStyle = await stats.evaluate((element) => {
    const style = getComputedStyle(element);
    return [style.backgroundColor, style.borderRadius, style.boxShadow];
  });
  await page.getByRole("tab", { name: "Schedule", exact: true }).click();
  await expect(stats.locator("dt")).toHaveText(["Starts", "Ends", "Length"]);
  expect(
    await stats
      .locator(".stat-summary__item")
      .first()
      .evaluate((item) => Array.from(item.children, (child) => child.tagName)),
  ).toEqual(["DT", "DD"]);
  await expect(stats.locator("dd")).toHaveText([
    "18:00",
    "18:10",
    "2 items · 10 min",
  ]);
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await stats.evaluate((element) => {
        const style = getComputedStyle(element);
        return [style.backgroundColor, style.borderRadius, style.boxShadow];
      }),
    ).toEqual(rosterStyle);
    const dimensions = await stats.evaluate((element) =>
      Array.from(element.children, (item) => ({
        width: item.getBoundingClientRect().width,
        fits: item.scrollWidth <= item.clientWidth,
      })),
    );
    expect(dimensions.every((item) => item.fits)).toBe(true);
    expect(
      Math.max(...dimensions.map((item) => item.width)) -
        Math.min(...dimensions.map((item) => item.width)),
    ).toBeLessThan(1);
    const labelBottoms = await stats
      .locator("dt")
      .evaluateAll((labels) =>
        labels.map((label) => label.getBoundingClientRect().bottom),
      );
    expect(Math.max(...labelBottoms) - Math.min(...labelBottoms)).toBeLessThan(
      1,
    );
  }
  await page.getByRole("button", { name: "Secret missions (0)" }).click();
  await expect(stats.locator("dd")).toHaveText([
    "18:00",
    "18:10",
    "2 items · 10 min",
  ]);
  backend.verify();
});

test("schedule statistics retain unset times", async ({ page }) => {
  const backend = await installSessionBackend(page, { host: true });
  await page.goto("#/host/live/test-session");
  await page.getByRole("button", { name: "Host", exact: true }).click();
  await page.getByRole("tab", { name: "Schedule", exact: true }).click();
  await expect(page.locator(".stat-summary dd")).toHaveText([
    "Not set",
    "Not set",
    "2 items · 10 min",
  ]);
  const firstTime = page.locator(".host-game-schedule__time").first();
  await expect(firstTime).toContainText("--:--");
  await expect(firstTime).toContainText("Start time not set");
  backend.verify();
});

test("round pills and long titles fit the compact timeline on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 844 });
  const backend = await installSessionBackend(page, { host: true });
  backend.challenges[0].title =
    "An exceptionally long challenge title with Supercalifragilisticexpialidocious";
  await page.goto("#/host/live/test-session");
  await page.getByRole("button", { name: "Host", exact: true }).click();
  await page.getByRole("tab", { name: "Schedule", exact: true }).click();
  await page.setViewportSize({ width: 320, height: 844 });
  const summary = page.locator(
    ".host-game-schedule__item--current > details > summary",
  );
  await expect(summary.locator(".host-game-schedule__round")).toHaveText(
    "Round 1",
  );
  const geometry = await summary.evaluate((element) => {
    const title = element.querySelector(".host-game-schedule__title");
    const marker = element.querySelector(".disclosure-chevron");
    if (!title || !marker) throw new Error("Missing timeline content");
    return {
      titleRight: title.getBoundingClientRect().right,
      markerLeft: marker.getBoundingClientRect().left,
      markerRight: marker.getBoundingClientRect().right,
      contentRight:
        element.getBoundingClientRect().right -
        parseFloat(getComputedStyle(element).paddingRight),
      overflow: element.scrollWidth > element.clientWidth,
    };
  });
  expect(geometry.overflow).toBe(false);
  expect(geometry.titleRight).toBeLessThanOrEqual(geometry.markerLeft);
  expect(Math.abs(geometry.markerRight - geometry.contentRight)).toBeLessThan(
    2,
  );
  backend.verify();
});

for (const teamsEnabled of [false, true]) {
  test(`schedule cards show artwork and challenge metadata for ${teamsEnabled ? "teams" : "individuals"}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const backend = await installSessionBackend(page, { host: true });
    seedHostRoundControls(backend, { breakMinutes: 5 });
    backend.session.teams_enabled = teamsEnabled;
    Object.assign(backend.session, { start_time: "18:00" });
    backend.challenges[1].points = 0;
    backend.rows.host_games = [
      {
        id: "test-plan",
        plan_data: {
          breakMinutes: 5,
          selectedTasks: [
            {
              id: "test-challenge",
              title: "Make an entrance",
              prep: "Prepare the room",
              setup: "Arrange the chairs",
              equipment: ["Camera"],
            },
          ],
          challengeArtUrls: { "test-challenge": "openmoji:1F4F7" },
          schedule: [
            {
              type: "challenge",
              taskId: "test-challenge",
              title: "Make an entrance",
              duration: 5,
            },
            {
              type: "challenge",
              taskId: "test-side-challenge",
              title: "Find a pineapple",
              duration: 5,
            },
            { type: "voting", title: "Vote", duration: 5 },
            { type: "final", title: "Final", duration: 5 },
          ],
        },
      },
    ];
    backend.challenges.push({
      ...backend.challenges[0],
      id: "secret-challenge",
      kind: "secret",
      round_number: null,
      title: "Find a pineapple",
    });
    backend.rows.cc_game_session_secret_assignments = [
      {
        id: "secret-assignment",
        session_id: "test-session",
        player_id: "test-player",
        challenge_id: "secret-challenge",
        status: "scheduled",
        scheduled_at: "2030-01-01T18:00:00Z",
        sent_at: null,
        submitted_at: null,
        reviewed_at: null,
        awarded_points: 0,
        final_review_outcome: null,
        created_at: "2030-01-01T12:00:00Z",
      },
    ];
    await page.goto("#/host/live/test-session");
    const mainAward = page.locator(".main-challenge__award");
    await expect(mainAward).toBeVisible({ timeout: 15_000 });
    const awardStyle = await mainAward.evaluate((element) => {
      const style = getComputedStyle(element);
      return [
        style.backgroundColor,
        style.color,
        style.borderRadius,
        style.padding,
        style.fontSize,
        style.fontWeight,
      ];
    });
    await page.getByRole("button", { name: "Host", exact: true }).click();
    await page.getByRole("tab", { name: "Schedule", exact: true }).click();

    const current = page.locator(".host-game-schedule__item--current");
    const upcoming = page
      .locator(".host-game-schedule__item--main")
      .filter({ hasText: "Second entrance" });
    await expect(current.locator(".host-game-schedule__time")).toHaveText(
      "18:00",
    );
    await expect(current.locator(".host-game-schedule__title")).toHaveText(
      "Round 1 Make an entrance",
    );
    await expect(current.locator(".host-game-schedule__round")).toHaveText(
      "Round 1",
    );
    await expect(current.locator(".host-game-schedule__details")).toBeHidden();
    await expect(upcoming.locator(".host-game-schedule__title")).toHaveText(
      "Round 2 Second entrance",
    );
    await expect(upcoming.locator(".host-game-schedule__round")).toHaveText(
      "Round 2",
    );
    await expect(upcoming.locator(".host-game-schedule__details")).toBeHidden();
    for (const width of [390, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      for (const row of [
        current,
        page.locator(".host-game-schedule__item--side"),
      ]) {
        const layout = await row.locator("summary").evaluate((summary) => {
          const time = summary.querySelector(".host-game-schedule__time");
          const title = summary.querySelector(".host-game-schedule__title");
          const chevron = summary.querySelector(".disclosure-chevron");
          if (!time || !title || !chevron)
            throw new Error("Missing schedule card content");
          return {
            timeRight: time.getBoundingClientRect().right,
            titleLeft: title.getBoundingClientRect().left,
            chevronRight: chevron.getBoundingClientRect().right,
            summaryRight:
              summary.getBoundingClientRect().right -
              parseFloat(getComputedStyle(summary).paddingRight),
          };
        });
        expect(layout.titleLeft).toBeGreaterThanOrEqual(layout.timeRight);
        expect(
          Math.abs(layout.chevronRight - layout.summaryRight),
        ).toBeLessThan(2);
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await current.locator("summary").focus();
    await current.locator("summary").press("Enter");
    await expect(current.getByText("NOW", { exact: true })).toBeVisible();
    await expect(current.locator(".host-game-schedule__tags")).toBeVisible();
    await expect(current.locator(".host-game-schedule__award")).toHaveText(
      "+20 POINTS",
    );
    await expect(current.locator(".host-game-schedule__mode")).toHaveText(
      teamsEnabled ? "Compete in teams" : "Compete individually",
    );
    await expect(current.getByText("5 min", { exact: true })).toBeVisible();
    await expect(
      current.getByText("Show everyone your best entrance."),
    ).toBeVisible();
    await expect(current.getByText("Prepare the room")).toBeVisible();
    await expect(current.getByText("Arrange the chairs")).toBeVisible();
    await expect(current.getByText("Camera")).toBeVisible();
    await expect(
      current.getByRole("button", { name: "Edit Make an entrance" }),
    ).toBeVisible();
    await current
      .getByRole("button", { name: "Edit Make an entrance" })
      .click();
    const challengeEditor = page.getByRole("dialog", {
      name: "Update challenge",
    });
    await expect(challengeEditor.getByLabel("Instructions")).toHaveValue(
      "Show everyone your best entrance.",
    );
    await expect(challengeEditor.getByLabel("Points")).toHaveValue("20");
    await expect(
      challengeEditor.getByRole("textbox", { name: "Setup", exact: true }),
    ).toHaveValue("Arrange the chairs");
    await expect(
      challengeEditor.getByRole("textbox", {
        name: "Preparation",
        exact: true,
      }),
    ).toHaveValue("Prepare the room");
    await expect(challengeEditor).toContainText(
      `Participation: ${teamsEnabled ? "teams" : "individual players"}`,
    );
    await challengeEditor.getByRole("button", { name: "Cancel" }).click();
    expect(
      await current
        .locator(".host-game-schedule__award")
        .evaluate((element) => {
          const style = getComputedStyle(element);
          return [
            style.backgroundColor,
            style.color,
            style.borderRadius,
            style.padding,
            style.fontSize,
            style.fontWeight,
          ];
        }),
    ).toEqual(awardStyle);
    await expect(
      current.locator(".host-game-schedule__art img"),
    ).toHaveAttribute("src", /\/openmoji\/1F4F7\.svg$/);
    const selectedView = page.getByRole("button", { name: /Main schedule/ });
    await expect(current).toHaveCSS(
      "background-color",
      await selectedView.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      ),
    );
    await expect(upcoming).not.toHaveCSS(
      "background-color",
      await selectedView.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      ),
    );

    const breakCard = page.locator(".host-game-schedule__item--break").first();
    await expect(
      breakCard.locator(".host-game-schedule__break-label"),
    ).toHaveText("Break");
    await expect(
      breakCard.locator(".host-game-schedule__break-label .icon"),
    ).toBeVisible();
    await expect(breakCard.locator(".host-game-schedule__round")).toHaveCount(
      0,
    );
    await expect(
      breakCard.locator(".host-game-schedule__details"),
    ).toBeHidden();
    await expect(breakCard.locator(".host-game-schedule__kind")).toHaveCount(0);
    await expect(breakCard.locator(".host-game-schedule__tags")).toHaveCount(0);
    await expect(
      breakCard.locator(".host-game-schedule__art img"),
    ).toHaveAttribute("src", /\/openmoji\/2615\.svg$/);
    await breakCard.locator("summary").click();
    await expect(
      breakCard.getByRole("button", { name: "Edit break timer" }),
    ).toBeDisabled();
    const side = page.locator(".host-game-schedule__item--side");
    await side.locator("summary").click();
    await expect(side.locator(".host-game-schedule__award")).toHaveText(
      "+0 POINTS",
    );
    await expect(side.locator(".host-game-schedule__art img")).toHaveAttribute(
      "src",
      /\/openmoji\/1F34D\.svg$/,
    );
    for (const [kind, art] of [
      ["voting", /\/openmoji\/1F5F3\.svg$/],
      ["final", /\/openmoji\/1F3C6\.svg$/],
    ] as const) {
      const row = page.locator(`.host-game-schedule__item--${kind}`);
      await expect(row.locator(".host-game-schedule__details")).toBeHidden();
      await row.locator("summary").click();
      await expect(row.locator(".host-game-schedule__art img")).toBeVisible();
      await expect(row.locator(".host-game-schedule__art img")).toHaveAttribute(
        "src",
        art,
      );
    }
    for (const image of await page
      .locator(".host-game-schedule__art img")
      .all()) {
      await expect
        .poll(() =>
          image.evaluate(
            (img) =>
              img instanceof HTMLImageElement &&
              img.complete &&
              img.naturalWidth > 0,
          ),
        )
        .toBe(true);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);

    await page.getByRole("button", { name: "Secret missions (1)" }).click();
    await expect(
      page.locator(
        ".host-game-schedule__item--secret .host-game-schedule__art img",
      ),
    ).toHaveAttribute("src", /\/openmoji\/1F34D\.svg$/);
    backend.verify();
  });
}

test("completed items remain a timeline row and running breaks can be edited", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { host: true });
  seedHostRoundControls(backend, { breakMinutes: 5, onBreak: true });
  await page.addInitScript(() => {
    localStorage.setItem(
      "chaos-crawl-host-round-clock:test-session:1",
      JSON.stringify({
        seconds: 600,
        running: true,
        onBreak: true,
        resumeRound: 2,
        updatedAt: Date.now(),
      }),
    );
  });
  await page.goto("#/host/live/test-session");
  await page.getByRole("button", { name: "Host", exact: true }).click();
  await page.getByRole("tab", { name: "Schedule", exact: true }).click();
  await expect(
    page.locator(".host-game-schedule__item--group > details > summary"),
  ).toContainText("Completed");
  await page.locator(".host-game-schedule__card--collapsed > summary").click();
  await expect(
    page
      .locator(
        ".host-game-schedule__item--completed .host-game-schedule__round",
      )
      .first(),
  ).toHaveText("Round 1");
  await page
    .locator(".host-game-schedule__item--completed summary")
    .first()
    .click();
  await expect(
    page
      .locator(
        ".host-game-schedule__item--completed .host-game-schedule__art img",
      )
      .first(),
  ).toBeVisible();
  const current = page.locator(
    ".host-game-schedule__item--break.host-game-schedule__item--current",
  );
  await expect(current.locator(".host-game-schedule__break-label")).toHaveText(
    "Break",
  );
  await expect(
    current.locator(".host-game-schedule__break-label .icon"),
  ).toBeVisible();
  await expect(current.getByText("NOW", { exact: true })).toBeHidden();
  await expect(current.locator(".host-game-schedule__kind")).toHaveCount(0);
  await current.locator("summary").click();
  await expect(current.getByText("NOW", { exact: true })).toBeVisible();
  await current.getByRole("button", { name: "Edit break timer" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  backend.verify();
});
