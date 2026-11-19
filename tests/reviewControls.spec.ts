import { expect, test } from "@playwright/test";
import { activateByKeyboard, tabTo } from "./support/keyboard";
import { installSessionBackend } from "./support/sessionBackend";
import { seedReviewControls } from "./support/reviewControls";

for (const kind of ["final", "secret"] as const) {
  for (const state of ["pending", "voting", "results"] as const) {
    test(`${kind} ${state} host controls preserve their command and picker state`, async ({
      page,
    }) => {
      const backend = await installSessionBackend(page, { host: true });
      seedReviewControls(backend, kind, state);
      const rpc =
        kind === "final"
          ? state === "results"
            ? "cc_host_reopen_session_final_round_challenge"
            : "cc_host_manage_session_final_round"
          : state === "pending"
            ? "cc_host_open_secret_review"
            : state === "voting"
              ? "cc_host_close_secret_review_vote"
              : "cc_host_reopen_secret_review";
      backend.responses[rpc] = {
        votes_cast: 1,
        outcome: "success",
        points_awarded: 25,
      };
      await page.goto("#/host/live/test-session");
      await page
        .getByRole("button", {
          name: kind === "final" ? "Final" : "Host",
          exact: true,
        })
        .click();
      if (kind === "secret")
        await page.getByRole("tab", { name: "Review", exact: true }).click();
      const picker = page.getByRole("combobox", {
        name:
          kind === "final"
            ? "Choose side challenge"
            : "Choose a secret mission",
        exact: true,
      });
      if (state === "voting") await expect(picker).toBeDisabled();
      else await expect(picker).toBeEnabled();
      const label =
        kind === "final"
          ? state === "pending"
            ? "Open Voting"
            : state === "voting"
              ? "Show Results"
              : "Reopen Voting"
          : state === "pending"
            ? "Open voting for this mission"
            : state === "voting"
              ? "Close voting and show results"
              : "Reopen voting";
      if (state === "results")
        page.once("dialog", (dialog) => void dialog.accept());
      await activateByKeyboard(
        page,
        page.getByRole("button", { name: label, exact: true }),
      );
      await expect
        .poll(() => backend.requests.filter((r) => r.name === rpc).length)
        .toBe(1);
      const parameters =
        kind === "final"
          ? state === "results"
            ? {
                p_session_id: "test-session",
                p_challenge_id: "test-side-challenge",
              }
            : {
                p_session_id: "test-session",
                p_gallery_open: true,
                p_voting_open: state === "pending",
              }
          : state === "voting"
            ? { p_session_id: "test-session" }
            : {
                p_session_id: "test-session",
                p_assignment_id: "secret-assignment",
              };
      expect(backend.requests.find((r) => r.name === rpc)?.body).toEqual(
        parameters,
      );
      backend.verify();
    });
  }
}

test("shared review controls keep local voting, picker, busy and presentation actions keyboard-operable", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { savedPlayer: false });
  await page.goto("#/styleguide");
  const final = page.getByLabel("Local final review controls", { exact: true });
  const secret = page.getByLabel("Local secret review controls", {
    exact: true,
  });
  const picker = final.getByRole("combobox", {
    name: "Choose sample challenge",
    exact: true,
  });
  await expect(picker).toBeEnabled();
  await activateByKeyboard(
    page,
    secret.getByRole("button", { name: "Open sample voting", exact: true }),
  );
  await expect(picker).toBeDisabled();
  await activateByKeyboard(
    page,
    secret.getByRole("button", { name: "Close sample voting", exact: true }),
  );
  await expect(picker).toBeEnabled();
  const display = page.getByRole("region", {
    name: "Local presentation controls",
    exact: true,
  });
  await activateByKeyboard(
    page,
    display.getByRole("button", {
      name: "Connect sample display",
      exact: true,
    }),
  );
  await expect(
    display.getByRole("button", { name: "Previous sample slide", exact: true }),
  ).toBeDisabled();
  await expect(
    display.getByRole("button", {
      name: "Disconnect sample display",
      exact: true,
    }),
  ).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(
    display.getByRole("button", { name: "Next sample slide", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Next sample slide selected locally." }),
  ).toBeVisible();
  await tabTo(
    page,
    page.getByRole("checkbox", {
      name: "Sample review controls busy",
      exact: true,
    }),
  );
  await page.keyboard.press("Space");
  await expect(
    final.getByRole("button", { name: "Show sample results", exact: true }),
  ).toBeDisabled();
  await expect(picker).toBeDisabled();
  await expect(
    display.getByRole("button", { name: "Next sample slide", exact: true }),
  ).toBeDisabled();
  await page.keyboard.press("Shift+Tab");
  await expect(
    display.getByRole("button", {
      name: "Disconnect sample display",
      exact: true,
    }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  expect(backend.requests).toEqual([]);
  backend.verify();
});

for (const kind of ["final", "secret"] as const) {
  test(`${kind} presentation controls preserve navigation boundaries and disconnect`, async ({
    page,
  }) => {
    const backend = await installSessionBackend(page, { host: true });
    seedReviewControls(backend, kind, "voting");
    await page.addInitScript(() => {
      class Connection extends EventTarget {
        state = "connected";
        close() {
          this.state = "closed";
          localStorage.setItem("test-review-display-closed", "yes");
          this.dispatchEvent(new Event("statechange"));
        }
      }
      Object.defineProperty(window, "PresentationRequest", {
        configurable: true,
        value: class {
          start() {
            return Promise.resolve(new Connection());
          }
        },
      });
    });
    const rpc =
      kind === "final"
        ? "cc_host_set_session_final_slideshow"
        : "cc_host_set_secret_review_evidence";
    backend.responses[rpc] = null;
    await page.goto("#/host/live/test-session");
    await page
      .getByRole("button", {
        name: kind === "final" ? "Final" : "Host",
        exact: true,
      })
      .click();
    const controls =
      kind === "final"
        ? page.locator('[data-tour="host-final-round"]')
        : page.getByRole("region", {
            name: "Secret mission TV slideshow controls",
            exact: true,
          });
    await activateByKeyboard(
      page,
      controls.getByRole("button", { name: "Cast", exact: true }),
    );
    await expect(
      controls.getByRole("button", { name: "Disconnect", exact: true }),
    ).toBeVisible();
    const previous = controls.getByRole("button", {
      name: "Previous",
      exact: true,
    });
    if (kind === "secret") await expect(previous).toBeDisabled();
    else await expect(previous).toBeEnabled();
    await activateByKeyboard(
      page,
      kind === "final"
        ? previous
        : controls.getByRole("button", { name: "Next", exact: true }),
    );
    await expect
      .poll(() => backend.requests.filter((r) => r.name === rpc).length)
      .toBe(1);
    expect(backend.requests.find((r) => r.name === rpc)?.body).toEqual(
      kind === "final"
        ? {
            p_session_id: "test-session",
            p_challenge_id: "test-side-challenge",
            p_evidence_id: "final-photo-2",
          }
        : { p_session_id: "test-session", p_evidence_id: "secret-photo-2" },
    );
    await activateByKeyboard(
      page,
      controls.getByRole("button", { name: "Disconnect", exact: true }),
    );
    await expect(
      controls.getByRole("button", { name: "Cast", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(() =>
        localStorage.getItem("test-review-display-closed"),
      ),
    ).toBe("yes");
    backend.verify();
  });
}
