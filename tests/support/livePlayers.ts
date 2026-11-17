import {
  expect,
  type BrowserContext,
  type Page,
  type Response,
} from "@playwright/test";
const JOIN_URL = "./#/legacy/join";
export type TestPlayer = {
  id: string;
  name: string;
};

type PlayerWrite = {
  method: string;
  status: number;
  body: string;
  url: string;
};

function isPlayersRequest(url: string) {
  return url.includes("/rest/v1/players");
}

async function openJoin(page: Page) {
  await page.goto(JOIN_URL, {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
  });

  const joinButton = page.getByRole("button", {
    name: /join game/i,
  });

  await expect(joinButton).toBeVisible({
    timeout: 15_000,
  });
}

async function findNameInput(page: Page) {
  const byRole = page
    .getByRole("textbox", {
      name: /name/i,
    })
    .first();

  if (await byRole.isVisible().catch(() => false)) {
    return byRole;
  }

  const byPlaceholder = page
    .locator(
      ['input[placeholder*="name" i]', 'input[name*="name" i]'].join(", "),
    )
    .first();

  if (await byPlaceholder.isVisible().catch(() => false)) {
    return byPlaceholder;
  }

  return page.locator("input").first();
}

export function uniqueName(label: string) {
  return [
    "PW-TEST",
    process.env.PLAYWRIGHT_LIVE_RUN_ID ?? "local",
    label,
    Date.now(),
    Math.random().toString(36).slice(2, 7),
  ].join("-");
}

export async function safeCloseContext(context: BrowserContext) {
  try {
    await context.close();
  } catch {
    // Context may already be closed
    // after a timeout or browser shutdown.
  }
}

export async function joinPlayer(
  page: Page,
  name: string,
): Promise<TestPlayer> {
  const writes: PlayerWrite[] = [];

  const onResponse = async (response: Response) => {
    if (!isPlayersRequest(response.url())) {
      return;
    }

    const method = response.request().method();

    if (!["POST", "PUT", "PATCH"].includes(method)) {
      return;
    }

    let responseBody = "";

    try {
      responseBody = await response.text();
    } catch {
      responseBody = "";
    }

    writes.push({
      method,
      status: response.status(),
      body: responseBody,
      url: response.url(),
    });
  };

  page.on("response", onResponse);

  try {
    await openJoin(page);

    const input = await findNameInput(page);

    await expect(input, "Could not find player name input").toBeVisible({
      timeout: 10_000,
    });

    await input.fill(name);

    await expect(input).toHaveValue(name);

    const joinButton = page.getByRole("button", {
      name: /join game/i,
    });

    await joinButton.click();

    await expect
      .poll(() => writes.length, {
        timeout: 15_000,
        intervals: [100, 250, 500],
        message: "No player write request was observed",
      })
      .toBeGreaterThan(0);

    const successfulWrite = writes.find(
      (write) => write.status >= 200 && write.status < 300,
    );

    expect(
      successfulWrite,
      [
        `Player "${name}" was not persisted.`,
        "Observed writes:",
        JSON.stringify(writes, null, 2),
      ].join("\n"),
    ).toBeTruthy();

    let parsed: unknown = null;

    try {
      parsed = JSON.parse(successfulWrite?.body ?? "");
    } catch {
      parsed = null;
    }

    const row = Array.isArray(parsed) ? parsed[0] : parsed;

    expect(
      row && typeof row === "object",
      [
        `Player "${name}" write succeeded`,
        "but response did not contain a player row.",
        successfulWrite?.body ?? "",
      ].join("\n"),
    ).toBeTruthy();

    const playerRow = row as {
      id?: string | number;
      name?: string;
    };

    expect(
      playerRow.id,
      [
        `Player "${name}" was created`,
        "but response had no id.",
        successfulWrite?.body ?? "",
      ].join("\n"),
    ).toBeTruthy();

    expect(playerRow.name).toBe(name);

    await expect
      .poll(() => page.url(), {
        timeout: 15_000,
        intervals: [100, 250, 500],
      })
      .toMatch(/game/i);

    return {
      id: String(playerRow.id),
      name,
    };
  } finally {
    page.off("response", onResponse);
  }
}
