import type { Page } from "@playwright/test";
export async function holdLegacyAdminWrite(
  page: Page,
  table: "game_state" | "players" | "teams" | "score_events",
  method: "PATCH" | "POST" | "DELETE",
  failures = 0,
) {
  const requests: { query: Record<string, string>; body: unknown }[] = [];
  const pending = new Map<number, () => void>();
  const completed = new Map<number, Promise<void>>();
  const released = new Set<number>();
  let releaseAll = false;
  await page.route(
    (url) => url.pathname === `/rest/v1/${table}`,
    async (route) => {
      const request = route.request();
      if (request.method() !== method) {
        await route.fallback();
        return;
      }
      const index = requests.length;
      const response = page
        .waitForResponse((candidate) => candidate.request() === request)
        .then(async (result) => {
          const error = await result.finished();
          if (error) throw error;
        });
      void response.catch(() => {});
      completed.set(index, response);
      requests.push({
        query: Object.fromEntries(new URL(request.url()).searchParams),
        body: request.postData() ? request.postDataJSON() : null,
      });
      if (!releaseAll && !released.has(index))
        await new Promise<void>((resolve) => pending.set(index, resolve));
      if (index < failures)
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({
            message: "Delayed operation denied",
            code: "TEST_DENIED",
          }),
        });
      else await route.fallback();
    },
  );
  function release(index?: number) {
    if (index === undefined) {
      releaseAll = true;
      for (const resolve of pending.values()) resolve();
      pending.clear();
    } else {
      released.add(index);
      pending.get(index)?.();
      pending.delete(index);
    }
  }
  return {
    requests,
    release,
    async settle(index?: number) {
      const responses =
        index === undefined ? [...completed.values()] : [completed.get(index)];
      if (!responses.length || responses.some((response) => !response))
        throw new Error("Cannot settle an unissued fixture write");
      release(index);
      await Promise.all(responses);
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
      );
    },
  };
}
