import ChallengeCatalogue from "../features/legacy-host/ChallengeCatalogue";
import ScoreOverview from "../features/legacy-host/ScoreOverview";
import type {
  ChallengeRoundModel,
  SideChallengeItemModel,
  ScoreTarget,
  ScoreAction,
} from "../features/legacy-host/types";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon, { type IconName } from "../components/ui/Icon";

import DataError from "../components/ui/DataError";
import { useChallengeCompletions } from "../game/hooks/useChallengeCompletions";
import { useChallenges, type Challenge } from "../game/hooks/useChallenges";
import { useGameState } from "../game/hooks/useGameState";
import { usePlayers, type Player } from "../game/hooks/usePlayers";
import { usePubs } from "../game/hooks/usePubs";
import { useScoreEvents } from "../game/hooks/useScoreEvents";
import { useSideChallenges } from "../game/hooks/useSideChallenges";
import { updateGameState } from "../lib/gameApi";
import { buildLeaderboards } from "../lib/leaderboard";
import { deletePlayer, renamePlayer } from "../lib/playerApi";
import { awardScore } from "../lib/scoreApi";
import { supabase } from "../lib/supabase";
import "../styles/HostPlanning.css";

type HostTab = "live" | "challenges" | "scores" | "players";

interface Team {
  id: string | number;
  name: string;
}

interface Round {
  id: string;
  label: string;
  legacyName: string;
  challenges: Challenge[];
}

const TAB_ITEMS: Array<{
  id: HostTab;
  label: string;
  icon: IconName;
}> = [
  { id: "live", label: "Live", icon: "radio" },
  { id: "challenges", label: "Challenges", icon: "list-checks" },
  { id: "scores", label: "Scores", icon: "trophy" },
  { id: "players", label: "Players", icon: "users" },
];

export default function AdminV2() {
  const navigate = useNavigate();
  const gameQuery = useGameState();
  const { data: game } = gameQuery;
  const playersQuery = usePlayers();
  const { data: players } = playersQuery;
  const pubsQuery = usePubs();
  const { data: pubs } = pubsQuery;
  const challengesQuery = useChallenges();
  const { data: challenges } = challengesQuery;
  const sideChallengesQuery = useSideChallenges();
  const { data: sideChallenges } = sideChallengesQuery;
  const completionsQuery = useChallengeCompletions();
  const { data: completions } = completionsQuery;
  const scoresQuery = useScoreEvents();
  const { data: scoreEvents, loading: scoresLoading } = scoresQuery;

  const [activeTab, setActiveTab] = useState<HostTab>("live");
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [teamNameDraft, setTeamNameDraft] = useState("");
  const [newPlayerName, setNewPlayerName] = useState("");
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [creatingPlayer, setCreatingPlayer] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [scheduleMinutes, setScheduleMinutes] = useState("15");
  const [scoreTarget, setScoreTarget] = useState<ScoreTarget>("player");
  const [scoreLeaderboardTarget, setScoreLeaderboardTarget] =
    useState<ScoreTarget>("player");
  const [scoreAction, setScoreAction] = useState<ScoreAction>("award");
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [selectedTeamName, setSelectedTeamName] = useState("");
  const [pointsDraft, setPointsDraft] = useState("5");
  const [scoreReason, setScoreReason] = useState("");
  const [voteTarget, setVoteTarget] = useState<ScoreTarget>("player");

  const sortedPubs = useMemo(
    () =>
      [...pubs].sort(
        (a, b) =>
          Number(a.sort_order ?? a.order_index ?? 0) -
          Number(b.sort_order ?? b.order_index ?? 0),
      ),
    [pubs],
  );

  // The old pub groups are retained in the database but become round groups in V2.
  // This avoids migrating challenge rows just to run a stationary event.
  const rounds = useMemo<Round[]>(() => {
    const grouped = sortedPubs.map((pub, index) => ({
      id: String(pub.id),
      label: `Round ${index + 1}`,
      legacyName: String(pub.name ?? `Round ${index + 1}`),
      challenges: challenges
        .filter((challenge) => String(challenge.pub_id) === String(pub.id))
        .sort(
          (a, b) =>
            Number(a.reveal_order ?? 0) - Number(b.reveal_order ?? 0) ||
            Number(a.id) - Number(b.id),
        ),
    }));

    const unassigned = challenges
      .filter(
        (challenge) =>
          !challenge.pub_id ||
          !sortedPubs.some(
            (pub) => String(pub.id) === String(challenge.pub_id),
          ),
      )
      .sort(
        (a, b) =>
          Number(a.reveal_order ?? 0) - Number(b.reveal_order ?? 0) ||
          Number(a.id) - Number(b.id),
      );

    const nonEmpty = grouped.filter((round) => round.challenges.length > 0);
    if (unassigned.length > 0) {
      nonEmpty.push({
        id: "unassigned",
        label: `Round ${nonEmpty.length + 1}`,
        legacyName: game?.current_pub || "Stationary venue",
        challenges: unassigned,
      });
    }
    return nonEmpty;
  }, [sortedPubs, challenges, game?.current_pub]);

  const orderedChallenges = useMemo(
    () => rounds.flatMap((round) => round.challenges),
    [rounds],
  );
  const currentChallenge = useMemo(() => {
    return (
      orderedChallenges.find(
        (challenge) =>
          String(challenge.id) === String(game?.current_challenge_id),
      ) ??
      orderedChallenges.find(
        (challenge) => challenge.title === game?.current_challenge,
      ) ??
      null
    );
  }, [orderedChallenges, game?.current_challenge_id, game?.current_challenge]);
  const currentChallengeIndex = currentChallenge
    ? orderedChallenges.findIndex(
        (challenge) => String(challenge.id) === String(currentChallenge.id),
      )
    : -1;
  const nextChallenge =
    orderedChallenges[
      currentChallengeIndex >= 0 ? currentChallengeIndex + 1 : 0
    ] ?? null;
  const scheduledChallenge =
    orderedChallenges.find(
      (challenge) =>
        String(challenge.id) === String(game?.scheduled_challenge_id),
    ) ?? null;
  const currentRound =
    rounds.find((round) =>
      round.challenges.some(
        (challenge) => String(challenge.id) === String(currentChallenge?.id),
      ),
    ) ?? null;

  const leaderboards = useMemo(
    () => buildLeaderboards(players, scoreEvents),
    [players, scoreEvents],
  );
  const playerLeaderboard = leaderboards.players;

  const teamNames = useMemo(
    () =>
      Array.from(
        new Set([
          ...teams.map((team) => team.name),
          ...players
            .map((player) => player.team)
            .filter((team): team is string => Boolean(team)),
          ...scoreEvents
            .map((event) => event.team_name)
            .filter((team): team is string => Boolean(team)),
        ]),
      ).sort((a, b) => a.localeCompare(b)),
    [teams, players, scoreEvents],
  );

  const teamLeaderboard = useMemo(
    () =>
      teamNames
        .map((name) => ({
          id: name,
          name,
          score:
            leaderboards.teams.find((team) => team.name === name)?.score ?? 0,
        }))
        .sort((a, b) => b.score - a.score),
    [teamNames, leaderboards],
  );

  const loadTeams = useCallback(async () => {
    setTeamsLoading(true);
    const { data, error } = await supabase
      .from("teams")
      .select("id, name")
      .order("name");
    if (error) {
      console.error("Could not load teams", error);
    } else {
      setTeams((data ?? []) as Team[]);
    }
    setTeamsLoading(false);
  }, []);

  useEffect(() => {
    void loadTeams();
    const channel = supabase
      .channel("host-v2-teams")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "teams" },
        () => void loadTeams(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadTeams]);

  const runBusy = async (key: string, operation: () => Promise<void>) => {
    setBusyAction(key);
    try {
      await operation();
    } finally {
      setBusyAction(null);
    }
  };

  async function revealChallenge(challenge: Challenge) {
    const round = rounds.find((item) =>
      item.challenges.some(
        (entry) => String(entry.id) === String(challenge.id),
      ),
    );
    await runBusy(`reveal-${challenge.id}`, async () => {
      const { error } = await updateGameState({
        current_pub:
          round?.legacyName ?? game?.current_pub ?? "Stationary venue",
        current_challenge_id: Number(challenge.id),
        current_challenge: challenge.title,
        challenge_description: challenge.description ?? "",
        current_challenge_order: challenge.reveal_order ?? 0,
        voting_open: false,
        show_vote_results: false,
        slideshow_open: false,
        scheduled_challenge_id: null,
        scheduled_reveal_at: null,
      });
      if (error) {
        window.alert(`Could not reveal challenge: ${error.message}`);
        return;
      }
      setActiveTab("live");
    });
  }

  async function scheduleChallenge(challenge: Challenge) {
    const minutes = Number(scheduleMinutes);
    if (!Number.isFinite(minutes) || minutes <= 0 || minutes > 240) {
      window.alert("Enter a reveal time between 1 and 240 minutes.");
      return;
    }
    await runBusy(`schedule-${challenge.id}`, async () => {
      const revealAt = new Date(Date.now() + minutes * 60_000).toISOString();
      const { error } = await updateGameState({
        scheduled_challenge_id: Number(challenge.id),
        scheduled_reveal_at: revealAt,
      });
      if (error) {
        window.alert(`Could not schedule challenge: ${error.message}`);
        return;
      }
      setActiveTab("live");
    });
  }

  async function cancelScheduledReveal() {
    await runBusy("cancel-schedule", async () => {
      const { error } = await updateGameState({
        scheduled_challenge_id: null,
        scheduled_reveal_at: null,
      });
      if (error) {
        window.alert(`Could not cancel schedule: ${error.message}`);
        throw error;
      }
    });
  }

  async function setVoting(open: boolean, target: ScoreTarget = voteTarget) {
    const { error } = await updateGameState(
      open
        ? {
            voting_open: true,
            voting_target: target,
            show_vote_results: false,
            slideshow_open: false,
          }
        : {
            voting_open: false,
            show_vote_results: true,
            slideshow_open: false,
          },
    );
    if (error) window.alert(`Could not update voting: ${error.message}`);
  }

  async function returnEveryoneToGame() {
    const { error } = await updateGameState({
      voting_open: false,
      show_vote_results: false,
      slideshow_open: false,
    });
    if (error)
      window.alert(`Could not return everyone to the game: ${error.message}`);
  }

  async function setSlideshow(open: boolean) {
    const { error } = await updateGameState({
      slideshow_open: open,
      ...(open ? { voting_open: false, show_vote_results: false } : {}),
    });
    if (error) window.alert(`Could not update the slideshow: ${error.message}`);
  }

  function openReview(challenge: Challenge | null) {
    if (!challenge) {
      window.alert("Reveal a challenge before reviewing submissions.");
      return;
    }
    navigate(
      `/challenge-review?type=main&id=${encodeURIComponent(String(challenge.id))}&title=${encodeURIComponent(challenge.title)}&from=admin-v2`,
    );
  }

  async function handleAwardOrDock() {
    const points = Number(pointsDraft);
    if (!Number.isFinite(points) || points <= 0) {
      window.alert("Enter a points amount greater than zero.");
      return;
    }
    if (scoreTarget === "player" && !selectedPlayerId) {
      window.alert("Choose a player first.");
      return;
    }
    if (scoreTarget === "team" && !selectedTeamName) {
      window.alert("Choose a team first.");
      return;
    }

    const challengeTitle =
      scoreReason.trim() ||
      (scoreAction === "award" ? "Host points award" : "Host points deduction");
    const { error } = await awardScore({
      playerId: scoreTarget === "player" ? selectedPlayerId : null,
      teamName: scoreTarget === "team" ? selectedTeamName : null,
      challengeType: "manual",
      challengeId: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      challengeTitle,
      points: scoreAction === "award" ? points : -points,
      reason: challengeTitle,
    });
    if (error) {
      window.alert(`Could not update score: ${error.message}`);
      return;
    }
    setScoreReason("");
  }

  async function addTeam() {
    const name = teamNameDraft.trim();
    if (!name) return;
    setCreatingTeam(true);
    const { error } = await supabase.from("teams").insert({ name });
    setCreatingTeam(false);
    if (error) {
      window.alert(`Could not create team: ${error.message}`);
      return;
    }
    setTeamNameDraft("");
    await loadTeams();
  }

  async function addPlayer() {
    const name = newPlayerName.trim();
    if (!name) return;
    setCreatingPlayer(true);
    const { error } = await supabase
      .from("players")
      .insert({ name, team: null, score: 0 });
    setCreatingPlayer(false);
    if (error) {
      window.alert(`Could not add player: ${error.message}`);
      return;
    }
    setNewPlayerName("");
  }

  async function assignTeam(player: Player, teamName: string) {
    const { error } = await supabase
      .from("players")
      .update({ team: teamName || null })
      .eq("id", player.id);
    if (error)
      window.alert(`Could not change ${player.name}'s team: ${error.message}`);
  }

  async function savePlayerName(player: Player, newName: string) {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === player.name) return;
    const { error } = await renamePlayer(player.id, trimmed);
    if (error) window.alert(`Could not rename player: ${error.message}`);
  }

  async function removePlayer(player: Player) {
    if (!window.confirm(`Remove ${player.name} from this game?`)) return;
    const { error } = await deletePlayer(player.id);
    if (error) window.alert(`Could not remove player: ${error.message}`);
  }

  const failedQuery = [
    gameQuery,
    playersQuery,
    pubsQuery,
    challengesQuery,
    sideChallengesQuery,
    completionsQuery,
    scoresQuery,
  ].find((query) => query.error);
  if (failedQuery?.error) {
    return <DataError error={failedQuery.error} retry={failedQuery.reload} />;
  }

  if (!game) {
    return (
      <main className="host-v2">
        <div className="host-v2__loading">Loading host controls…</div>
      </main>
    );
  }

  const challengeProgress =
    orderedChallenges.length > 0
      ? Math.max(
          0,
          Math.min(
            100,
            ((currentChallengeIndex + 1) / orderedChallenges.length) * 100,
          ),
        )
      : 0;
  const scheduledTime = game.scheduled_reveal_at
    ? new Date(game.scheduled_reveal_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const challengeRounds: ChallengeRoundModel[] =
    activeTab === "challenges"
      ? rounds.map((round) => ({
          id: round.id,
          label: round.label,
          challenges: round.challenges.map((challenge) => ({
            id: challenge.id,
            title: challenge.title,
            description: challenge.description,
            points: challenge.points,
            current: String(challenge.id) === String(game.current_challenge_id),
            scheduled:
              String(challenge.id) === String(game.scheduled_challenge_id),
            past:
              currentChallengeIndex >= 0 &&
              orderedChallenges.findIndex(
                (item) => String(item.id) === String(challenge.id),
              ) < currentChallengeIndex,
            onReveal: () => {
              void revealChallenge(challenge);
            },
            onSchedule: () => {
              void scheduleChallenge(challenge);
            },
          })),
        }))
      : [];
  const optionalChallenges: SideChallengeItemModel[] =
    activeTab === "challenges"
      ? sideChallenges.map((challenge) => ({
          id: challenge.id,
          title: challenge.title,
          description: challenge.description,
          points: challenge.points,
          completionCount: completions.filter(
            (item) =>
              item.challenge_type === "side" &&
              String(item.challenge_id) === String(challenge.id),
          ).length,
          onReview: () =>
            navigate(
              `/challenge-review?type=side&id=${encodeURIComponent(String(challenge.id))}&title=${encodeURIComponent(challenge.title)}&from=admin-v2`,
            ),
        }))
      : [];

  const scoreEntries =
    scoreLeaderboardTarget === "player" ? playerLeaderboard : teamLeaderboard;

  return (
    <main className="host-v2">
      <div className="host-v2__app">
        <header className="host-v2__header">
          <div className="host-v2__brand-row">
            <div>
              <p className="host-v2__eyebrow">CHAOS · HOST CONTROL</p>
              <h1 className="host-v2__brand">Run the game</h1>
            </div>
            <span
              className={`host-v2__live-pill ${currentChallenge ? "is-live" : "is-ready"}`}
            >
              <span className="host-v2__live-dot" />
              {currentChallenge ? "LIVE" : "READY"}
            </span>
          </div>
          <div className="host-v2__event-row">
            <span>
              <Icon name="map-pin" className="icon--size-14" /> One venue · No
              travel between rounds
            </span>
            <span>{players.length} players</span>
          </div>
        </header>

        <div className="host-v2__content">
          {activeTab === "live" && (
            <>
              <section className="host-v2__round-overview">
                <div className="host-v2__section-heading">
                  <div>
                    <p className="host-v2__eyebrow">GAME PROGRESS</p>
                    <h2>{currentRound?.label ?? "Ready to start"}</h2>
                  </div>
                  <span className="host-v2__progress-number">
                    {Math.max(currentChallengeIndex + 1, 0)} /{" "}
                    {orderedChallenges.length}
                  </span>
                </div>
                <div className="host-v2__progress">
                  <span style={{ width: `${challengeProgress}%` }} />
                </div>
              </section>

              <section className="host-v2__panel host-v2__panel--white">
                <div className="host-v2__panel-topline">
                  <span className="host-v2__kicker">
                    <Icon name="radio" className="icon--size-14" /> NOW
                  </span>
                  {currentChallenge && (
                    <span className="host-v2__status host-v2__status--live">
                      Live challenge
                    </span>
                  )}
                </div>
                {currentChallenge ? (
                  <>
                    <div className="host-v2__challenge-title-row">
                      <div className="host-v2__challenge-art">
                        <Icon name="flag" className="icon--size-28" />
                      </div>
                      <div className="host-v2__grow">
                        <h2>{currentChallenge.title}</h2>
                        <p>
                          {currentChallenge.description ||
                            "No extra instructions for this challenge."}
                        </p>
                      </div>
                      <span className="host-v2__points">
                        +{currentChallenge.points} pts
                      </span>
                    </div>
                    <div className="host-v2__meta-row">
                      <span>
                        <Icon name="check-circle2" className="icon--size-15" />{" "}
                        {
                          completions.filter(
                            (item) =>
                              item.challenge_type === "main" &&
                              String(item.challenge_id) ===
                                String(currentChallenge.id),
                          ).length
                        }{" "}
                        submissions
                      </span>
                      <button
                        type="button"
                        className="host-v2__text-button"
                        onClick={() => openReview(currentChallenge)}
                      >
                        Review{" "}
                        <Icon name="chevron-right" className="icon--size-16" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="host-v2__empty">
                    <h2>No challenge is live yet</h2>
                    <p>Reveal the first challenge when everyone is ready.</p>
                  </div>
                )}
              </section>

              <section className="host-v2__panel host-v2__panel--white">
                <div className="host-v2__panel-topline">
                  <span className="host-v2__kicker">
                    <Icon name="arrow-right" className="icon--size-14" /> NEXT
                  </span>
                  {scheduledTime && (
                    <span className="host-v2__status host-v2__status--scheduled">
                      <Icon name="clock3" className="icon--size-13" />{" "}
                      {scheduledTime}
                    </span>
                  )}
                </div>
                {scheduledChallenge ? (
                  <div className="host-v2__challenge-title-row">
                    <div className="host-v2__challenge-art host-v2__challenge-art--lime">
                      <Icon name="calendar-clock" className="icon--size-25" />
                    </div>
                    <div className="host-v2__grow">
                      <h2>{scheduledChallenge.title}</h2>
                      <p>
                        {scheduledChallenge.description ||
                          "Scheduled challenge"}
                      </p>
                      <p className="host-v2__small-note">
                        Scheduled to reveal
                        {scheduledTime ? ` at ${scheduledTime}` : " soon"}.
                      </p>
                    </div>
                  </div>
                ) : nextChallenge ? (
                  <div className="host-v2__challenge-title-row">
                    <div className="host-v2__challenge-art host-v2__challenge-art--lime">
                      <Icon name="circle-dot" className="icon--size-25" />
                    </div>
                    <div className="host-v2__grow">
                      <h2>{nextChallenge.title}</h2>
                      <p>
                        {nextChallenge.description ||
                          "No extra instructions for this challenge."}
                      </p>
                      <span className="host-v2__points-inline">
                        +{nextChallenge.points} points
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="host-v2__empty">
                    <h2>All rounds revealed</h2>
                    <p>You've reached the end of the main challenge list.</p>
                  </div>
                )}
                <div className="host-v2__actions">
                  {nextChallenge && (
                    <button
                      type="button"
                      className="host-v2__button host-v2__button--primary"
                      disabled={Boolean(busyAction)}
                      onClick={() => void revealChallenge(nextChallenge)}
                    >
                      {busyAction === `reveal-${nextChallenge.id}`
                        ? "Revealing…"
                        : "Reveal next challenge"}
                      <Icon name="chevron-right" className="icon--size-17" />
                    </button>
                  )}
                  {scheduledChallenge && (
                    <button
                      type="button"
                      className="host-v2__button host-v2__button--subtle"
                      disabled={Boolean(busyAction)}
                      onClick={() => void cancelScheduledReveal()}
                    >
                      <Icon name="x" className="icon--size-16" /> Cancel
                      schedule
                    </button>
                  )}
                </div>
                {nextChallenge && !scheduledChallenge && (
                  <div className="host-v2__schedule-row">
                    <label htmlFor="host-v2-schedule">Auto-reveal in</label>
                    <input
                      id="host-v2-schedule"
                      aria-label="Minutes until auto reveal"
                      type="number"
                      min={1}
                      max={240}
                      value={scheduleMinutes}
                      onChange={(event) =>
                        setScheduleMinutes(event.target.value)
                      }
                    />
                    <span>min</span>
                    <button
                      type="button"
                      className="host-v2__icon-button"
                      disabled={Boolean(busyAction)}
                      aria-label="Schedule next challenge"
                      onClick={() => void scheduleChallenge(nextChallenge)}
                    >
                      <Icon name="calendar-clock" className="icon--size-17" />
                    </button>
                  </div>
                )}
              </section>

              <section className="host-v2__panel host-v2__panel--tint">
                <div className="host-v2__panel-topline">
                  <span className="host-v2__kicker">
                    <Icon name="users" className="icon--size-14" /> LIVE
                    CONTROLS
                  </span>
                </div>
                <div className="host-v2__actions host-v2__actions--stack">
                  {game.voting_open ? (
                    <button
                      type="button"
                      className="host-v2__button host-v2__button--primary"
                      onClick={() => void setVoting(false)}
                    >
                      Close voting & show results{" "}
                      <Icon name="trophy" className="icon--size-17" />
                    </button>
                  ) : game.show_vote_results ? (
                    <>
                      <button
                        type="button"
                        className="host-v2__button host-v2__button--primary"
                        onClick={() => navigate("/vote-results")}
                      >
                        View vote results{" "}
                        <Icon name="chevron-right" className="icon--size-17" />
                      </button>
                      <button
                        type="button"
                        className="host-v2__button host-v2__button--subtle"
                        onClick={() => void returnEveryoneToGame()}
                      >
                        Return everyone to game
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="host-v2__inline-selects">
                        <label htmlFor="host-v2-vote-target">Vote for</label>
                        <select
                          id="host-v2-vote-target"
                          value={voteTarget}
                          onChange={(event) =>
                            setVoteTarget(event.target.value as ScoreTarget)
                          }
                        >
                          <option value="player">Players</option>
                          <option value="team">Teams</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        className="host-v2__button host-v2__button--primary"
                        disabled={!currentChallenge}
                        onClick={() => void setVoting(true, voteTarget)}
                      >
                        Open voting{" "}
                        <Icon name="trophy" className="icon--size-17" />
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    className="host-v2__button host-v2__button--subtle"
                    onClick={() => void setSlideshow(!game.slideshow_open)}
                  >
                    {game.slideshow_open ? "Close slideshow" : "Open slideshow"}
                    <Icon name="chevron-right" className="icon--size-17" />
                  </button>
                </div>
              </section>
            </>
          )}

          {activeTab === "challenges" && (
            <ChallengeCatalogue
              rounds={challengeRounds}
              sideChallenges={optionalChallenges}
              busy={Boolean(busyAction)}
            />
          )}

          {activeTab === "scores" && (
            <ScoreOverview
              adjustment={{
                target: scoreTarget,
                action: scoreAction,
                players: players.map(({ id, name }) => ({ id, name })),
                teams: teamNames,
                selectedPlayerId,
                selectedTeamName,
                points: pointsDraft,
                reason: scoreReason,
                onTargetChange: setScoreTarget,
                onActionChange: setScoreAction,
                onPlayerChange: setSelectedPlayerId,
                onTeamChange: setSelectedTeamName,
                onPointsChange: setPointsDraft,
                onReasonChange: setScoreReason,
                onSubmit: () => {
                  void handleAwardOrDock();
                },
              }}
              leaderboard={{
                target: scoreLeaderboardTarget,
                loading: scoresLoading,
                entries: scoreEntries,
                onTargetChange: setScoreLeaderboardTarget,
              }}
              display={{
                showVoteResults: game.show_vote_results,
                onOpenSlideshow: () => {
                  void setSlideshow(true);
                },
                onReturnToGame: () => {
                  void returnEveryoneToGame();
                },
              }}
            />
          )}

          {activeTab === "players" && (
            <>
              <div className="host-v2__page-intro">
                <p className="host-v2__eyebrow">THE PARTY</p>
                <h2>Players & teams</h2>
                <p>Manage your roster and keep teams balanced.</p>
              </div>
              <section className="host-v2__panel host-v2__panel--white">
                <div className="host-v2__panel-topline">
                  <span className="host-v2__kicker">
                    <Icon name="users" className="icon--size-14" /> TEAMS
                  </span>
                  <span className="host-v2__muted">{teams.length} teams</span>
                </div>
                <div className="host-v2__add-row">
                  <input
                    aria-label="New team name"
                    placeholder="New team name"
                    value={teamNameDraft}
                    onChange={(event) => setTeamNameDraft(event.target.value)}
                  />
                  <button
                    type="button"
                    className="host-v2__icon-button"
                    aria-label="Create team"
                    disabled={creatingTeam || !teamNameDraft.trim()}
                    onClick={() => void addTeam()}
                  >
                    {creatingTeam ? (
                      "…"
                    ) : (
                      <Icon name="plus" className="icon--size-18" />
                    )}
                  </button>
                </div>
                {teamsLoading ? (
                  <p className="host-v2__muted">Loading teams…</p>
                ) : teamNames.length ? (
                  <div className="host-v2__team-chips">
                    {teamNames.map((name) => (
                      <span key={name}>{name}</span>
                    ))}
                  </div>
                ) : (
                  <p className="host-v2__empty-copy">
                    Create a team or assign players to a team below.
                  </p>
                )}
              </section>
              <section className="host-v2__panel host-v2__panel--white">
                <div className="host-v2__panel-topline">
                  <span className="host-v2__kicker">
                    <Icon name="users" className="icon--size-14" /> PLAYER
                    ROSTER
                  </span>
                  <span className="host-v2__muted">
                    {players.length} players
                  </span>
                </div>
                <div className="host-v2__add-row">
                  <input
                    aria-label="New player name"
                    placeholder="Add a player"
                    value={newPlayerName}
                    onChange={(event) => setNewPlayerName(event.target.value)}
                  />
                  <button
                    type="button"
                    className="host-v2__icon-button"
                    aria-label="Add player"
                    disabled={creatingPlayer || !newPlayerName.trim()}
                    onClick={() => void addPlayer()}
                  >
                    {creatingPlayer ? (
                      "…"
                    ) : (
                      <Icon name="plus" className="icon--size-18" />
                    )}
                  </button>
                </div>
                {players.length ? (
                  <div className="host-v2__player-list">
                    {players.map((player) => (
                      <article className="host-v2__player-row" key={player.id}>
                        <div className="host-v2__avatar" aria-hidden="true">
                          {player.name.trim().slice(0, 1).toUpperCase() || "?"}
                        </div>
                        <div className="host-v2__grow">
                          <input
                            aria-label={`Rename ${player.name}`}
                            className="host-v2__player-name"
                            defaultValue={player.name}
                            key={`${player.id}-${player.name}`}
                            onBlur={(event) =>
                              void savePlayerName(player, event.target.value)
                            }
                          />
                          <label className="host-v2__team-select">
                            <span>Team</span>
                            <select
                              value={player.team ?? ""}
                              onChange={(event) =>
                                void assignTeam(player, event.target.value)
                              }
                            >
                              <option value="">Unassigned</option>
                              {teamNames.map((name) => (
                                <option key={name} value={name}>
                                  {name}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                        <button
                          type="button"
                          className="host-v2__remove-button"
                          aria-label={`Remove ${player.name}`}
                          onClick={() => void removePlayer(player)}
                        >
                          <Icon name="x" className="icon--size-16" />
                        </button>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="host-v2__empty-copy">
                    Players will appear here when they join using your game
                    code.
                  </p>
                )}
              </section>
            </>
          )}
        </div>

        <nav className="host-v2__bottom-nav" aria-label="Host navigation">
          {TAB_ITEMS.map(({ id, label, icon }) => (
            <button
              type="button"
              key={id}
              className={activeTab === id ? "is-active" : ""}
              aria-current={activeTab === id ? "page" : undefined}
              onClick={() => setActiveTab(id)}
            >
              <Icon name={icon} className="icon--size-19" strokeWidth={2.5} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>
    </main>
  );
}
