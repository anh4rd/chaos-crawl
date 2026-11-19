import { expect, test } from "@playwright/test";
import { tabTo } from "./support/keyboard";
import { installSessionBackend } from "./support/sessionBackend";
import { seedParticipantTeams } from "./support/participantTeams";

test("pending team creation keeps its action name and busy state while the native field remains editable", async ({
  page,
}) => {
  const backend = await installSessionBackend(page);
  seedParticipantTeams(backend, { selectedTeamId: null });
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let requests = 0;
  await page.route(
    "**/rest/v1/rpc/cc_player_create_session_team",
    async (route) => {
      requests += 1;
      await gate;
      await route.fallback();
    },
  );
  await page.goto("#/play/123456");
  const panel = page
    .getByRole("heading", { name: "Choose your team", exact: true })
    .locator("xpath=ancestor::section[1]");
  const name = panel.getByRole("textbox", {
    name: "New team name",
    exact: true,
  });
  await tabTo(page, name);
  await page.keyboard.type("  Owls  ");
  await page.keyboard.press("Enter");
  await expect.poll(() => requests).toBe(1);
  const action = panel.getByRole("button", {
    name: "Create team",
    exact: true,
  });
  await expect(action).toBeDisabled();
  await expect(action).toHaveAttribute("aria-busy", "true");
  await expect(name).toBeEditable();
  await page.keyboard.type(" later");
  await expect(name).toHaveValue("  Owls   later");
  await page.keyboard.press("Enter");
  expect(requests).toBe(1);
  release();
  await expect(action).toHaveAttribute("aria-busy", "false");
  await expect(name).toHaveValue("");
  expect(
    backend.requests.filter(
      (request) => request.name === "cc_player_create_session_team",
    ),
  ).toEqual([
    {
      name: "cc_player_create_session_team",
      method: "POST",
      body: {
        p_join_code: "123456",
        p_player_token: "test-player-token",
        p_team_name: "Owls",
      },
    },
  ]);
  backend.verify();
});
