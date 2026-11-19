import type { InviteData } from "../../src/features/invitation/types";

export function createInvitationFixture(): InviteData {
  return {
    enabled: true,
    game_name: "Friday Night Chaos",
    event_date: "2030-01-01",
    start_time: "18:30:00",
    venue_name: "The Test Venue",
    venue_address: "12 Test Road",
    game_photo_url: "/chaos-crawl/leopard.jpg",
    player_limit: 12,
    joined_players: 4,
    rules: "Be kind.\nPlay fair.",
    demo_enabled: true,
    pre_game_enabled: true,
    pre_game_task: {
      title: "Bring a bold hat",
      description: "Find the most dramatic hat you own.",
    },
    preparation: [
      { title: "Phone", prep: "Charge it before arriving." },
      { title: "Team spirit", prep: "Bring your sense of adventure." },
    ],
  };
}
