import { expect, type Page } from "@playwright/test";

export const sessionCode = "123456";
export const sessionId = "test-session";
const hostId = "00000000-0000-4000-8000-000000000001";
const timestamp = "2030-01-01T12:00:00Z";

export function sessionFixture() {
  const session = {
    id: sessionId,
    host_id: hostId,
    host_game_id: "test-plan",
    name: "Regression party",
    venue_name: "The Test Venue",
    join_code: sessionCode,
    status: "live",
    host_participates: false,
    host_player_id: null as string | null,
    current_round_number: 1,
    round_count: 1,
    teams_enabled: false,
    host_chooses_teams: false,
    team_size: 2,
    player_limit: 12,
    reward_methods: ["voting", "host_awards", "audience_cheers"],
    final_gallery_open: false,
    final_voting_open: false,
    final_vote_completed_at: null,
    created_at: timestamp,
  };
  const player = {
    id: "test-player",
    name: "Pat",
    avatar_url: null,
    score: 20,
    team_id: null,
    team_name: null,
    joined_at: timestamp,
    last_seen_at: timestamp,
  };
  const challenge = {
    id: "test-challenge",
    session_id: sessionId,
    kind: "main",
    round_number: 1,
    title: "Make an entrance",
    description: "Show everyone your best entrance.",
    points: 20,
    duration_minutes: 5,
    sort_order: 1,
    allow_photo_upload: false,
    submission_status: null,
    awarded_points: 0,
  };
  const sideChallenge = {
    ...challenge,
    id: "test-side-challenge",
    title: "Find a pineapple",
    kind: "side",
    round_number: null,
    allow_photo_upload: true,
    sort_order: 2,
  };
  return {
    session,
    player,
    challenges: [challenge, sideChallenge],
    view: {
      session,
      player,
      teams: [],
      my_submissions: [],
      challenge,
      side_challenges: [sideChallenge],
    },
    timer: {
      session_id: sessionId,
      round_number: 1,
      remaining_seconds: 300,
      is_running: false,
      is_on_break: false,
      resume_round_number: null,
      break_ends_at: null,
      updated_at: timestamp,
    },
  };
}

type RequestRecord = { name: string; method: string; body: unknown };

/** All backend traffic is intercepted; unexpected operations fail the journey. */
export async function installSessionBackend(
  page: Page,
  options: { host?: boolean; savedPlayer?: boolean; lobby?: boolean } = {},
) {
  const fixture = sessionFixture();
  if (options.lobby) fixture.session.status = "lobby";
  const requests: RequestRecord[] = [];
  const unexpected: string[] = [];
  const failures = new Set<string>();
  const responses: Record<string, unknown> = {};
  const rows: Record<string, unknown[]> = {};
  const hostPlayer = {
    ...fixture.player,
    id: "host-player",
    name: "Test Host",
    score: 0,
  };
  const uploadedEvidence: Array<{
    id: string;
    session_id: string;
    player_id: string;
    challenge_id: string;
    secret_assignment_id: string | null;
    storage_path: string;
    media_type: "image" | "video";
    saved_for_final: boolean;
    created_at: string;
  }> = [];
  const submissions: Array<{
    challenge_id: string;
    player_id: string;
    status: "submitted" | "approved";
    awarded_points: number;
  }> = [];
  const host = {
    id: hostId,
    aud: "authenticated",
    role: "authenticated",
    email: "host@example.test",
    user_metadata: { display_name: "Test Host" },
    app_metadata: { provider: "email" },
    created_at: timestamp,
  };
  await page.addInitScript(
    ({ host, options }) => {
      if (options.savedPlayer !== false)
        localStorage.setItem(
          "chaos-crawl-session-player:123456",
          "test-player-token",
        );
      if (options.host) {
        localStorage.setItem(
          "sb-chaos-crawl-test-auth-token",
          JSON.stringify({
            access_token: "test-host-access-token",
            refresh_token: "test-host-refresh-token",
            token_type: "bearer",
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            user: host,
          }),
        );
      }
    },
    { host, options },
  );
  await page.routeWebSocket("**/realtime/v1/**", (socket) => {
    socket.onMessage((raw) => {
      const message = JSON.parse(String(raw));
      if (Array.isArray(message)) {
        const [join, ref, topic, event] = message;
        if (event === "phx_join" || event === "heartbeat")
          socket.send(
            JSON.stringify([
              join,
              ref,
              topic,
              "phx_reply",
              { status: "ok", response: { postgres_changes: [] } },
            ]),
          );
      } else if (
        message.event === "phx_join" ||
        message.event === "heartbeat"
      ) {
        socket.send(
          JSON.stringify({
            ...message,
            event: "phx_reply",
            payload: { status: "ok", response: { postgres_changes: [] } },
          }),
        );
      }
    });
  });
  await page.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.hostname === "127.0.0.1" || url.hostname === "localhost") {
      await route.continue();
      return;
    }
    if (
      url.hostname === "fonts.googleapis.com" ||
      url.hostname === "fonts.gstatic.com" ||
      url.hostname === "db.onlinewebfonts.com"
    ) {
      await route.fulfill({ body: "", contentType: "text/css" });
      return;
    }
    if (url.hostname !== "chaos-crawl-test.supabase.co") {
      unexpected.push(`${request.method()} ${url.origin}${url.pathname}`);
      await route.abort();
      return;
    }
    const name = url.pathname.split("/").at(-1) ?? "";
    const body =
      request.headers()["content-type"]?.includes("application/json") &&
      request.postData()
        ? request.postDataJSON()
        : null;
    requests.push({ name, method: request.method(), body });
    const respond = async (data: unknown, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(data),
      });
    if (failures.has(name)) {
      await respond(
        { message: "Fixture connection failed", code: "TEST_FAILURE" },
        500,
      );
      return;
    }
    if (url.pathname === "/auth/v1/user") {
      await respond(host);
      return;
    }
    const currentPlayer =
      body?.p_player_token === "host-player-token"
        ? hostPlayer
        : fixture.player;
    if (
      url.pathname.startsWith("/storage/v1/object/session-evidence/") &&
      request.method() === "POST"
    ) {
      requests.push({
        name: "storage:session-evidence",
        method: "POST",
        body: { path: url.pathname },
      });
      await respond({ Key: url.pathname });
      return;
    }
    if (
      url.pathname.startsWith("/storage/v1/object/public/session-evidence/") &&
      request.method() === "GET"
    ) {
      await route.fulfill({
        contentType: "image/svg+xml",
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="purple"/></svg>',
      });
      return;
    }
    if (name === "cc_host_join_as_player") {
      fixture.session.host_participates = true;
      fixture.session.host_player_id = hostPlayer.id;
      await respond({
        join_code: sessionCode,
        player_token: "host-player-token",
        name: hostPlayer.name,
      });
      return;
    }
    if (name === "cc_player_add_session_evidence") {
      uploadedEvidence.push({
        id: `evidence-${uploadedEvidence.length}`,
        session_id: sessionId,
        player_id: currentPlayer.id,
        challenge_id: body.p_challenge_id,
        secret_assignment_id: body.p_secret_assignment_id,
        storage_path: body.p_storage_path,
        media_type: body.p_media_type,
        saved_for_final: false,
        created_at: timestamp,
      });
      await respond({ id: uploadedEvidence.at(-1)?.id });
      return;
    }
    if (name === "cc_player_submit_session_challenge") {
      const side = body.p_challenge_id === "test-side-challenge";
      submissions.push({
        challenge_id: body.p_challenge_id,
        player_id: currentPlayer.id,
        status: side ? "approved" : "submitted",
        awarded_points: side ? 5 : 0,
      });
      await respond(null);
      return;
    }
    if (
      [
        "cc_player_cast_session_reward_vote",
        "cc_player_cast_session_final_round_vote",
        "cc_player_cast_secret_review_vote",
      ].includes(name)
    ) {
      await respond(null);
      return;
    }
    if (Object.hasOwn(responses, name)) {
      await respond(responses[name]);
      return;
    }
    const rpcData: Record<string, unknown> = {
      cc_is_platform_admin: false,
      cc_super_admin_list_games: [
        {
          game_id: "test-plan",
          name: "Regression party",
          host_email: "host@example.test",
          status: "planned",
          player_count: 12,
          session_count: 0,
          event_date: "2030-01-01",
        },
      ],
      cc_super_admin_game_detail: {
        game: { name: "Regression party", host_email: "host@example.test" },
        sessions: [],
      },
      cc_get_public_game_invite: { game_photo_url: null },
      cc_get_game_session_view: {
        ...fixture.view,
        player: currentPlayer,
        my_submissions: submissions.filter(
          (item) => item.player_id === currentPlayer.id,
        ),
      },
      cc_player_get_session_reward_round: null,
      cc_get_player_secret_missions: [],
      cc_player_get_session_secret_review: null,
      cc_get_player_session_evidence: uploadedEvidence.filter(
        (item) => item.player_id === currentPlayer.id,
      ),
      cc_get_player_session_leaderboard: [
        { ...fixture.player, player_id: fixture.player.id },
        ...(fixture.session.host_player_id
          ? [{ ...hostPlayer, player_id: hostPlayer.id }]
          : []),
      ],
      cc_host_dispatch_due_secret_missions: null,
      cc_host_create_game_session: {
        id: sessionId,
        join_code: sessionCode,
        status: "lobby",
      },
      cc_join_game_session: {
        player_token: "test-player-token",
        join_code: sessionCode,
        player_name: "Pat",
        resumed: false,
      },
    };
    if (
      url.pathname.startsWith("/rest/v1/rpc/") &&
      Object.hasOwn(rpcData, name)
    ) {
      await respond(rpcData[name]);
      return;
    }
    const tables: Record<string, unknown[]> = {
      host_favourites: [],
      host_games: [
        {
          id: "test-plan",
          host_id: hostId,
          name: fixture.session.name,
          event_date: "2030-01-01",
          start_time: "18:00",
          end_time: "22:00",
          player_count: 12,
          venue_name: fixture.session.venue_name,
          status: "planned",
          plan_data: {},
        },
      ],
      cc_game_sessions: [fixture.session],
      cc_game_session_challenges: fixture.challenges,
      cc_game_session_players: [
        fixture.player,
        ...(fixture.session.host_player_id ? [hostPlayer] : []),
      ],
      cc_game_session_teams: [],
      cc_game_session_submissions: submissions,
      cc_game_session_secret_assignments: [],
      cc_game_session_secret_review_state: [],
      cc_game_session_secret_review_assignments: [],
      cc_game_session_secret_review_votes: [],
      cc_game_session_evidence: uploadedEvidence,
      cc_game_session_final_round_votes: [],
      cc_game_session_final_round_state: [],
      cc_game_session_final_round_challenges: [],
      cc_game_session_reward_rounds: [],
      cc_game_session_reward_votes: [],
      cc_game_session_reward_awards: [],
      cc_game_session_timers: [fixture.timer],
      ...rows,
    };
    if (url.pathname.startsWith("/rest/v1/") && Object.hasOwn(tables, name)) {
      if (request.method() === "GET") {
        const rows = tables[name];
        await respond(
          request.headers().accept?.includes("vnd.pgrst.object")
            ? (rows[0] ?? null)
            : rows,
        );
        return;
      }
      if (
        name === "cc_game_sessions" &&
        request.method() === "PATCH" &&
        typeof body?.host_participates === "boolean"
      ) {
        fixture.session.host_participates = body.host_participates;
        await respond(null);
        return;
      }
      if (name === "cc_game_session_timers" && request.method() === "POST") {
        await respond(null, 201);
        return;
      }
      if (
        name === "host_games" &&
        ["POST", "PATCH"].includes(request.method())
      ) {
        await respond({ id: "test-plan" }, 201);
        return;
      }
    }
    unexpected.push(`${request.method()} ${url.pathname}`);
    await respond({ message: "Unexpected fixture request" }, 400);
  });
  return {
    ...fixture,
    requests,
    failures,
    responses,
    rows,
    hostPlayer,
    uploadedEvidence,
    submissions,
    verify: () => expect(unexpected, "Unexpected backend requests").toEqual([]),
  };
}
