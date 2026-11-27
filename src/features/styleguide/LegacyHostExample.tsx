import { useState } from "react";
import Button from "../../components/ui/Button";
import HostGameFrame from "../legacy-host/HostGameFrame";
import LiveOverview from "../legacy-host/LiveOverview";
import ChallengeCatalogue from "../legacy-host/ChallengeCatalogue";
import ScoreOverview from "../legacy-host/ScoreOverview";
import PlayersOverview from "../legacy-host/PlayersOverview";
import type { HostTab, ScoreAction, ScoreTarget } from "../legacy-host/types";

export default function LegacyHostExample() {
  const [tab, setTab] = useState<HostTab>("live");
  const [busy, setBusy] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [notice, setNotice] = useState(
    "Preview actions update local state only.",
  );
  const [scheduled, setScheduled] = useState(true);
  const [current, setCurrent] = useState(true);
  const [minutes, setMinutes] = useState("15");
  const [voting, setVoting] = useState(false);
  const [results, setResults] = useState(false);
  const [slideshow, setSlideshow] = useState(false);
  const [voteTarget, setVoteTarget] = useState<ScoreTarget>("player");
  const [teams, setTeams] = useState(["Owls", "Foxes"]);
  const [players, setPlayers] = useState([
    { id: "pat", name: "Pat", team: "Owls", score: 12 },
  ]);
  const [teamDraft, setTeamDraft] = useState("");
  const [playerDraft, setPlayerDraft] = useState("");
  const [target, setTarget] = useState<ScoreTarget>("player");
  const [action, setAction] = useState<ScoreAction>("award");
  const [playerId, setPlayerId] = useState("pat");
  const [teamName, setTeamName] = useState("Owls");
  const [points, setPoints] = useState("5");
  const [reason, setReason] = useState("");
  const [leaderboardTarget, setLeaderboardTarget] =
    useState<ScoreTarget>("player");
  const challenge = {
    title: "Photo finish",
    description: "Create a team celebration photo.",
    points: 10,
  };
  const review = () => setNotice("Review opened locally.");
  const reveal = () => {
    setCurrent(true);
    setScheduled(false);
    setNotice("Challenge revealed locally.");
  };
  const returnToGame = () => {
    setVoting(false);
    setResults(false);
    setSlideshow(false);
  };
  const shownPlayers = empty ? [] : players;
  const shownTeams = empty ? [] : teams;
  const teamScores = shownTeams.map((name) => ({
    id: name,
    name,
    avatarUrl:
      name === "Owls"
        ? `${import.meta.env.BASE_URL}chaos-monster-peek.png`
        : undefined,
    score: shownPlayers
      .filter((p) => p.team === name)
      .reduce((total, p) => total + p.score, 0),
  }));
  return (
    <section id="legacy-host" aria-labelledby="legacy-host-title">
      <h3 id="legacy-host-title">Local legacy host console</h3>
      <div>
        <label>
          <input
            type="checkbox"
            checked={busy}
            onChange={(event) => setBusy(event.target.checked)}
          />{" "}
          Pending controls
        </label>
        <label>
          <input
            type="checkbox"
            checked={empty}
            onChange={(event) => setEmpty(event.target.checked)}
          />{" "}
          Empty content
        </label>
        <Button
          type="button"
          variant="comic-secondary"
          fullWidth={false}
          onClick={() => setNotice("Preview error: retry this local action.")}
        >
          Show feedback
        </Button>
      </div>
      <output>{notice}</output>
      <HostGameFrame
        contained
        currentAvailable={current && !empty}
        playerCount={shownPlayers.length}
        activeTab={tab}
        onTabChange={setTab}
      >
        {tab === "live" && (
          <LiveOverview
            progress={{
              roundLabel: "Round 1",
              revealedCount: current ? 1 : 0,
              totalCount: 3,
              progressPercent: current ? 100 / 3 : 0,
            }}
            current={{
              currentChallenge: current && !empty ? challenge : null,
              submissionCount: 2,
              onReview: review,
            }}
            upcoming={{
              scheduledChallenge: scheduled && !empty ? challenge : null,
              nextChallenge: empty ? null : challenge,
              scheduledTime: scheduled && !empty ? "09:00 PM" : null,
              busy,
              revealingNext: busy,
              scheduleMinutes: minutes,
              onRevealNext: reveal,
              onCancelSchedule: () => setScheduled(false),
              onScheduleMinutesChange: setMinutes,
              onScheduleNext: () => setScheduled(true),
            }}
            controls={{
              votingOpen: voting,
              showResults: results,
              slideshowOpen: slideshow,
              voteTarget,
              canOpenVoting: current && !empty,
              onCloseVoting: () => {
                setVoting(false);
                setResults(true);
              },
              onViewResults: () => setNotice("Vote results opened locally."),
              onReturnToGame: returnToGame,
              onVoteTargetChange: setVoteTarget,
              onOpenVoting: () => {
                setVoting(true);
                setResults(false);
              },
              onToggleSlideshow: () => setSlideshow((value) => !value),
            }}
          />
        )}
        {tab === "challenges" && (
          <ChallengeCatalogue
            busy={busy}
            rounds={
              empty
                ? []
                : [
                    {
                      id: "round-1",
                      label: "Round 1",
                      challenges: [
                        {
                          ...challenge,
                          id: 1,
                          current,
                          scheduled: false,
                          past: false,
                          onReveal: reveal,
                          onSchedule: () => setScheduled(true),
                        },
                        {
                          id: 2,
                          title: "Victory lap",
                          description: null,
                          points: 5,
                          current: false,
                          scheduled,
                          past: false,
                          onReveal: reveal,
                          onSchedule: () => setScheduled(true),
                        },
                      ],
                    },
                  ]
            }
            sideChallenges={
              empty
                ? []
                : [
                    {
                      id: 3,
                      title: "Team chant",
                      description: "Invent your team's chant.",
                      points: 3,
                      completionCount: 1,
                      onReview: review,
                    },
                  ]
            }
          />
        )}
        {tab === "scores" && (
          <ScoreOverview
            adjustment={{
              target,
              action,
              players: shownPlayers,
              teams: shownTeams,
              selectedPlayerId: playerId,
              selectedTeamName: teamName,
              points,
              reason,
              onTargetChange: setTarget,
              onActionChange: setAction,
              onPlayerChange: setPlayerId,
              onTeamChange: setTeamName,
              onPointsChange: setPoints,
              onReasonChange: setReason,
              onSubmit: () => {
                const amount = Number(points);
                if (!Number.isFinite(amount) || amount <= 0) {
                  setNotice("Enter positive preview points.");
                  return;
                }
                setPlayers((items) =>
                  items.map((p) =>
                    (
                      target === "player"
                        ? p.id === playerId
                        : p.team === teamName
                    )
                      ? {
                          ...p,
                          score:
                            p.score + (action === "award" ? amount : -amount),
                        }
                      : p,
                  ),
                );
                setReason("");
                setNotice("Points changed locally.");
              },
            }}
            leaderboard={{
              target: leaderboardTarget,
              loading: busy,
              entries:
                leaderboardTarget === "player"
                  ? shownPlayers.map((player) => ({
                      ...player,
                      avatarUrl:
                        player.id === "pat"
                          ? `${import.meta.env.BASE_URL}chaos-monster-peek.png`
                          : undefined,
                    }))
                  : teamScores,
              onTargetChange: setLeaderboardTarget,
            }}
            display={{
              showVoteResults: results,
              onOpenSlideshow: () => {
                setSlideshow(true);
                setNotice("Slideshow opened locally.");
              },
              onReturnToGame: returnToGame,
            }}
          />
        )}
        {tab === "players" && (
          <PlayersOverview
            teams={{
              teamCount: shownTeams.length,
              names: shownTeams,
              loading: busy,
              draft: teamDraft,
              creating: busy,
              canCreate: !busy && Boolean(teamDraft.trim()),
              onDraftChange: setTeamDraft,
              onCreate: () => {
                if (!teamDraft.trim()) return;
                setTeams((items) => [...items, teamDraft.trim()]);
                setTeamDraft("");
              },
            }}
            roster={{
              teams: shownTeams,
              players: shownPlayers.map((player) => ({
                ...player,
                initial: player.name.slice(0, 1).toUpperCase(),
                avatarUrl:
                  player.id === "pat"
                    ? `${import.meta.env.BASE_URL}chaos-monster-peek.png`
                    : undefined,
                onRename: (name) => {
                  if (name.trim())
                    setPlayers((items) =>
                      items.map((p) =>
                        p.id === player.id ? { ...p, name: name.trim() } : p,
                      ),
                    );
                },
                onAssignTeam: (team) =>
                  setPlayers((items) =>
                    items.map((p) => (p.id === player.id ? { ...p, team } : p)),
                  ),
                onRemove: () =>
                  setPlayers((items) =>
                    items.filter((p) => p.id !== player.id),
                  ),
              })),
              draft: playerDraft,
              creating: busy,
              canCreate: !busy && Boolean(playerDraft.trim()),
              onDraftChange: setPlayerDraft,
              onCreate: () => {
                if (!playerDraft.trim()) return;
                setPlayers((items) => [
                  ...items,
                  {
                    id: `preview-${items.length}`,
                    name: playerDraft.trim(),
                    team: "",
                    score: 0,
                  },
                ]);
                setPlayerDraft("");
              },
            }}
          />
        )}
      </HostGameFrame>
    </section>
  );
}
