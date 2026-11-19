import type { Page } from "@playwright/test";
import type { HostSavedItem } from "../../src/types/hostSaved";
import { installSessionBackend } from "./sessionBackend";

export function savedFixtures(): HostSavedItem[] {
  return [
    {
      id: "saved-task",
      item_type: "task",
      item_id: "task-1",
      item_data: {
        title: "Conga challenge",
        description: "Get the group dancing.",
        points: 15,
      },
    },
    {
      id: "saved-venue",
      item_type: "venue",
      item_id: "venue-1",
      item_data: { name: "The Corner", description: "A local stop." },
    },
    {
      id: "saved-route",
      item_type: "route",
      item_id: "route-1",
      item_data: {
        title: "Two stops",
        stops: ["First pub", "Last pub"],
        points: 0,
      },
    },
    {
      id: "saved-empty",
      item_type: "venue",
      item_id: "venue-2",
      item_data: {},
    },
  ];
}

export async function installSavedBackend(page: Page) {
  const backend = await installSessionBackend(page, {
    host: true,
    savedPlayer: false,
  });
  backend.rows.host_favourites = savedFixtures();
  const requests: Array<{ method: string; url: URL }> = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname === "/rest/v1/host_favourites")
      requests.push({ method: request.method(), url });
  });
  return { backend, requests };
}
