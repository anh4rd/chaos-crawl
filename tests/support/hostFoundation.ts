import type { Page } from "@playwright/test";
import { hostId, installSessionBackend } from "./sessionBackend";

export async function installHostFoundation(page: Page) {
  const backend = await installSessionBackend(page, {
    host: true,
    savedPlayer: false,
  });
  backend.rows.host_games = [
    {
      id: "future-plan",
      host_id: hostId,
      name: "Future plan",
      event_date: "2030-01-01",
      start_time: "18:00",
      end_time: "22:00",
      player_count: 12,
      venue_name: "The Test Venue",
      plan_data: {},
      status: "planned",
    },
    {
      id: "draft-plan",
      host_id: hostId,
      name: "Draft plan",
      event_date: null,
      start_time: "18:00",
      end_time: "22:00",
      player_count: 0,
      venue_name: "",
      plan_data: {},
      status: "draft",
    },
    {
      id: "past-plan",
      host_id: hostId,
      name: "Past plan",
      event_date: "2020-01-01",
      start_time: "18:00",
      end_time: "22:00",
      player_count: 8,
      venue_name: "The Past Venue",
      plan_data: {},
      status: "completed",
    },
  ];
  backend.responses.cc_is_platform_admin = true;
  backend.responses.cc_super_admin_list_hosts = [
    {
      host_id: "named-host",
      display_name: "Named Host",
      email: "named@example.test",
      created_at: "2020-01-01T12:00:00Z",
      game_count: 1,
    },
    {
      host_id: "email-host",
      display_name: null,
      email: "email@example.test",
      created_at: "2020-02-01T12:00:00Z",
      game_count: 2,
    },
    {
      host_id: "empty-host",
      display_name: null,
      email: null,
      created_at: "2020-03-01T12:00:00Z",
      game_count: 0,
    },
  ];
  backend.responses.cc_super_admin_host_hub = {
    host: { id: "empty-host", display_name: null, email: null },
    games: backend.rows.host_games,
  };
  return backend;
}
