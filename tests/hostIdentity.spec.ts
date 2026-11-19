import { expect, test } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/database";
import { installExploreBackend } from "./support/hostExplore";
import { hostId } from "./support/sessionBackend";

const nextHostId = "00000000-0000-4000-8000-000000000002";
function accessToken(id: string, sequence: number) {
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" }),
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      sub: id,
      aud: "authenticated",
      exp: Math.floor(Date.now() / 1000) + 3600 + sequence,
      role: "authenticated",
    }),
  ).toString("base64url");
  const signature = Buffer.from("fixture-signature").toString("base64url");
  return `${header}.${payload}.${signature}`;
}

test("host identity changes reset private workspace state while same-host token changes preserve it", async ({
  page,
}) => {
  const { backend, requests } = await installExploreBackend(page);
  let currentId = hostId;
  await page.route("**/auth/v1/user", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: currentId,
        aud: "authenticated",
        role: "authenticated",
        email: `${currentId}@example.test`,
        app_metadata: { provider: "email" },
        user_metadata: { display_name: "Fixture host" },
        created_at: "2030-01-01T12:00:00Z",
      }),
    }),
  );
  await page.route("**/auth/v1/logout?*", (route) =>
    route.fulfill({ status: 204 }),
  );
  await page.goto("#/host/explore");
  await expect(
    page.getByRole("heading", { name: "Community paper tower", exact: true }),
  ).toBeVisible();
  const search = page.getByRole("textbox", {
    name: "Search tasks",
    exact: true,
  });
  await search.fill("Host A draft");
  currentId = nextHostId;
  const moduleUrl = new URL("src/lib/supabase.ts", page.url().split("#")[0])
    .href;
  async function replaceCredentials(sequence: number) {
    await page.evaluate(
      async ({ moduleUrl, token }) => {
        const sdk: { supabase: SupabaseClient<Database> } = await import(
          moduleUrl
        );
        const { error } = await sdk.supabase.auth.setSession({
          access_token: token,
          refresh_token: "fixture-refresh-token",
        });
        if (error) throw new Error(error.message);
      },
      { moduleUrl, token: accessToken(nextHostId, sequence) },
    );
  }
  await replaceCredentials(1);
  await expect(search).toHaveValue("");
  await expect
    .poll(
      () =>
        requests.filter(
          (request) =>
            request.method === "GET" &&
            request.url.pathname.endsWith("host_favourites") &&
            request.url.searchParams.get("host_id") === `eq.${nextHostId}`,
        ).length,
    )
    .toBeGreaterThan(0);
  await expect(
    page.getByText("Checking your saved items…", { exact: true }),
  ).toHaveCount(0);
  await search.fill("Host B draft");
  const favouriteReads = requests.filter(
    (request) =>
      request.method === "GET" &&
      request.url.pathname.endsWith("host_favourites"),
  ).length;
  await replaceCredentials(2);
  await expect(search).toHaveValue("Host B draft");
  expect(
    requests.filter(
      (request) =>
        request.method === "GET" &&
        request.url.pathname.endsWith("host_favourites"),
    ),
  ).toHaveLength(favouriteReads);
  await page.evaluate(async (url) => {
    const sdk: { supabase: SupabaseClient<Database> } = await import(url);
    const { error } = await sdk.supabase.auth.signOut({ scope: "local" });
    if (error) throw new Error(error.message);
  }, moduleUrl);
  await expect(page).toHaveURL(/#\/host\/login$/);
  await expect(
    page.getByRole("textbox", { name: "Search tasks", exact: true }),
  ).toHaveCount(0);
  expect(requests.filter((request) => request.method !== "GET")).toHaveLength(
    0,
  );
  backend.verify();
});
