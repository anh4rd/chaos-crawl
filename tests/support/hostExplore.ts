import { type Page } from "@playwright/test";
import { hostId, installSessionBackend } from "./sessionBackend";

export function exploreSubmissions() {
  return [
    {
      id: "approved-challenge",
      item_type: "challenge",
      title: "Community paper tower",
      description: "Build a paper tower together.",
      payload: {
        kind: "side",
        points: 12,
        minutes: 6,
        tags: ["team"],
        setup: "basic",
      },
      status: "approved",
      submitted_by: "another-host",
      review_note: null,
      created_at: "2030-01-02T12:00:00Z",
    },
    {
      id: "pending-challenge",
      item_type: "challenge",
      title: "Pending contribution",
      description: "This idea is awaiting review.",
      payload: { kind: "main", points: 20, minutes: 10 },
      status: "pending",
      submitted_by: hostId,
      review_note: null,
      created_at: "2030-01-01T12:00:00Z",
    },
    {
      id: "rejected-challenge",
      item_type: "challenge",
      title: "Rejected contribution",
      description: "This idea needs revision.",
      payload: {},
      status: "rejected",
      submitted_by: hostId,
      review_note: "Please clarify the rules.",
      created_at: "2029-12-31T12:00:00Z",
    },
  ];
}

export async function installExploreBackend(page: Page, admin = false) {
  const backend = await installSessionBackend(page, {
    host: true,
    savedPlayer: false,
  });
  backend.rows.cc_catalog_submissions = exploreSubmissions();
  backend.responses.cc_is_platform_admin = admin;
  const requests: Array<{ method: string; url: URL; body: unknown }> = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (
      ["/rest/v1/host_favourites", "/rest/v1/cc_catalog_submissions"].includes(
        url.pathname,
      )
    ) {
      requests.push({
        method: request.method(),
        url,
        body: request.postData() ? request.postDataJSON() : null,
      });
    }
  });
  return { backend, requests };
}
