import { useState } from "react";
import PlatformGamesView from "../super-admin/PlatformGamesView";
import SessionFeedback from "../../components/session/SessionFeedback";
import type {
  PlatformGame,
  PlatformGameDetail,
  PlatformSessionPlayers,
} from "../../types/superAdmin";
import { Example } from "./Example";
import HostPatternPreview from "./HostPatternPreview";
import SessionPreview from "../../components/session/SessionPreview";
import Button from "../../components/ui/Button";
import SessionPlayers from "../super-admin/SessionPlayers";

const games: PlatformGame[] = [
  {
    game_id: "garden",
    name: "Garden chaos",
    host_email: "anna@example.test",
    status: "planned",
    event_date: "2030-01-01",
    created_at: "2029-12-01",
    player_count: 7,
    session_count: 1,
    live_sessions: 0,
  },
  {
    game_id: "night",
    name: "Night crawl",
    host_email: "pat@example.test",
    status: "live",
    event_date: null,
    created_at: "2029-12-01",
    player_count: 5,
    session_count: 1,
    live_sessions: 1,
  },
  {
    game_id: "finished",
    name: "Finished party",
    host_email: null,
    status: "completed",
    event_date: null,
    created_at: "2029-12-01",
    player_count: 0,
    session_count: 0,
    live_sessions: 0,
  },
];
function previewDetail(id: string): PlatformGameDetail {
  const game = games.find((item) => item.game_id === id) ?? games[0];
  return {
    game: { name: game.name, host_email: game.host_email },
    sessions: [
      {
        id: "local-session",
        name: "Friday session",
        join_code: "123456",
        status: "live",
        created_at: "2030-01-01",
        players: [
          { name: "Alex", score: 0, team_name: "Lime" },
          { name: "Sam", score: -2, team_name: null },
        ],
      },
    ],
  };
}

export default function PlatformGamesExample() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(false);
  const [denied, setDenied] = useState(false);
  const [pageError, setPageError] = useState(false);
  const [pending, setPending] = useState(false);
  const [fail, setFail] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [inspectorError, setInspectorError] = useState(false);
  const [activeId, setActiveId] = useState("garden");
  const [selected, setSelected] = useState<PlatformGameDetail | null>(null);
  const [notice, setNotice] = useState("");
  const [playerView, setPlayerView] = useState(false);
  const [players, setPlayers] = useState<PlatformSessionPlayers>({
    session_id: "local-session",
    session_name: "Friday session",
    teams: [{ id: "lime", name: "Lime" }],
    players: [
      {
        id: "alex",
        name: "Alex",
        score: 0,
        avatar_url: null,
        team_id: "lime",
        phone: "07123456789",
        joined_at: "2030-01-01",
        last_seen_at: "2030-01-01",
      },
    ],
  });
  const filtered = games.filter(
    (game) =>
      (status === "all" || game.status === status) &&
      `${game.name} ${game.host_email ?? ""}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <Example
      title="Local platform admin"
      source="features/super-admin/PlatformGamesView.tsx"
      code={
        "<PlatformGamesView games={localGames} filtered={localFilteredGames} onInspect={openLocalInspector} />"
      }
    >
      <label>
        <input
          type="checkbox"
          checked={loading}
          onChange={(event) => setLoading(event.target.checked)}
        />{" "}
        Show list loading
      </label>
      <label>
        <input
          type="checkbox"
          checked={denied}
          onChange={(event) => setDenied(event.target.checked)}
        />{" "}
        Show access denial
      </label>
      <label>
        <input
          type="checkbox"
          checked={pageError}
          onChange={(event) => setPageError(event.target.checked)}
        />{" "}
        Show page error
      </label>
      <label>
        <input
          type="checkbox"
          checked={pending}
          onChange={(event) => setPending(event.target.checked)}
        />{" "}
        Keep inspection pending
      </label>
      <label>
        <input
          type="checkbox"
          checked={fail}
          onChange={(event) => setFail(event.target.checked)}
        />{" "}
        Fail inspection
      </label>
      <SessionPreview>
        <HostPatternPreview>
          <PlatformGamesView
            games={games}
            filtered={filtered}
            loading={loading}
            error={
              pageError && !inspectorOpen ? "Local platform list error" : ""
            }
            denied={denied}
            query={query}
            status={status}
            selected={selected}
            detailLoading={pending && inspectorOpen}
            inspectorOpen={inspectorOpen}
            inspectorFeedback={
              inspectorError ? (
                <SessionFeedback
                  message="Local inspector failure"
                  onDismiss={() => setInspectorError(false)}
                />
              ) : undefined
            }
            onRefresh={() => {
              setLoading(false);
              setPageError(false);
              setNotice("Local list refreshed.");
            }}
            onQueryChange={setQuery}
            onStatusChange={setStatus}
            onInspect={(id) => {
              setPlayerView(false);
              setActiveId(id);
              setPageError(false);
              setInspectorError(fail && !pending);
              setSelected(fail || pending ? null : previewDetail(id));
              setInspectorOpen(true);
            }}
            onCloseInspector={() => {
              setPlayerView(false);
              setInspectorOpen(false);
              setSelected(null);
              setInspectorError(false);
            }}
            onRetryInspection={() => {
              setPending(false);
              setFail(false);
              setInspectorError(false);
              setSelected(previewDetail(activeId));
            }}
            onManagePlayers={() => setPlayerView(true)}
            playerContent={
              playerView ? (
                <>
                  <Button
                    type="button"
                    variant="comic-secondary"
                    fullWidth={false}
                    onClick={() => setPlayerView(false)}
                  >
                    Back to game
                  </Button>
                  <SessionPlayers
                    data={players}
                    busy={false}
                    onSave={async (id, values) => {
                      setPlayers((current) => ({
                        ...current,
                        players: current.players.map((player) =>
                          player.id === id ? { ...player, ...values } : player,
                        ),
                      }));
                      return true;
                    }}
                  />
                </>
              ) : undefined
            }
            onBack={(event) => {
              event.preventDefault();
              setNotice("Back selected locally.");
            }}
          />
        </HostPatternPreview>
      </SessionPreview>
      <output>{notice}</output>
    </Example>
  );
}
