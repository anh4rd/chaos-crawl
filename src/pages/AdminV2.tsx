import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  Flag,
  ListChecks,
  MapPin,
  Minus,
  Plus,
  Radio,
  Trophy,
  Users,
  X,
} from "lucide-react";

import { useGameState } from "../game/hooks/useGameState";
import { usePlayers, type Player } from "../game/hooks/usePlayers";
import { usePubs } from "../game/hooks/usePubs";
import { useChallenges, type Challenge } from "../game/hooks/useChallenges";
import useSideChallenges from "../game/hooks/useSideChallenges";
import useChallengeCompletions from "../game/hooks/useChallengeCompletions";
import { useScoreEvents } from "../game/hooks/useScoreEvents";
import { updateGameState } from "../lib/gameApi";
import { awardScore } from "../lib/scoreApi";
import { deletePlayer, renamePlayer } from "../lib/playerApi";
import { supabase } from "../lib/supabase";
import "../styles/HostV2.css";

type HostTab = "live" | "challenges" | "scores" | "players";
type ScoreTarget = "player" | "team";
type ScoreAction = "award" | "dock";

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
  Icon: typeof Radio;
}> = [
  { id: "live", label: "Live", Icon: Radio },
  { id: "challenges", label: "Challenges", Icon: ListChecks },
  { id: "scores", label: "Scores", Icon: Trophy },
  { id: "players", label: "Players", Icon: Users },
];

export default function AdminV2() {
  const navigate = useNavigate();
  const game = useGameState();
  const players = usePlayers();
  const pubs = usePubs();
  const challenges = useChallenges();
  const sideChallenges = useSideChallenges();
  const completions = useChallengeCompletions();
  const { scoreEvents, loading: scoresLoading } = useScoreEvents();

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
  const [scoreLeaderboardTarget, setScoreLeaderboardTarget] = useState<ScoreTarget>("player");
  const [scoreAction, setScoreAction] = useState<ScoreAction>("award");
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [selectedTeamName, setSelectedTeamName] = useState("");
  const [pointsDraft, setPointsDraft] = useState("5");
  const [scoreReason, setScoreReason] = useState("");
  const [voteTarget, setVoteTarget] = useState<ScoreTarget>("player");
  const firedScheduleRef = useRef<string | null>(null);

  const sortedPubs = useMemo(
    () => [...pubs].sort((a, b) => Number(a.sort_order ?? a.order_index ?? 0) - Number(b.sort_order ?? b.order_index ?? 0)),
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
        .sort((a, b) => Number(a.reveal_order ?? 0) - Number(b.reveal_order ?? 0) || Number(a.id) - Number(b.id)),
    }));

    const unassigned = challenges
      .filter((challenge) => !challenge.pub_id || !sortedPubs.some((pub) => String(pub.id) === String(challenge.pub_id)))
      .sort((a, b) => Number(a.reveal_order ?? 0) - Number(b.reveal_order ?? 0) || Number(a.id) - Number(b.id));

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

  const orderedChallenges = useMemo(() => rounds.flatMap((round) => round.challenges), [rounds]);
  const currentChallenge = useMemo(() => {
    return orderedChallenges.find((challenge) => String(challenge.id) === String(game?.current_challenge_id))
      ?? orderedChallenges.find((challenge) => challenge.title === game?.current_challenge)
      ?? null;
  }, [orderedChallenges, game?.current_challenge_id, game?.current_challenge]);
  const currentChallengeIndex = currentChallenge
    ? orderedChallenges.findIndex((challenge) => String(challenge.id) === String(currentChallenge.id))
    : -1;
  const nextChallenge = orderedChallenges[currentChallengeIndex >= 0 ? currentChallengeIndex + 1 : 0] ?? null;
  const scheduledChallenge = orderedChallenges.find((challenge) => String(challenge.id) === String(game?.scheduled_challenge_id)) ?? null;
  const currentRound = rounds.find((round) => round.challenges.some((challenge) => String(challenge.id) === String(currentChallenge?.id))) ?? null;

  const playerLeaderboard = useMemo(() => players.map((player) => {
    const score = scoreEvents
      .filter((event) => String(event.player_id) === String(player.id))
      .reduce((total, event) => total + Number(event.points ?? 0), 0);
    return { id: String(player.id), name: player.name, score, player };
  }).sort((a, b) => b.score - a.score), [players, scoreEvents]);

  const teamNames = useMemo(() => Array.from(new Set([
    ...teams.map((team) => team.name),
    ...players.map((player) => player.team).filter((team): team is string => Boolean(team)),
    ...scoreEvents.map((event) => event.team_name).filter((team): team is string => Boolean(team)),
  ])).sort((a, b) => a.localeCompare(b)), [teams, players, scoreEvents]);

  const teamLeaderboard = useMemo(() => teamNames.map((name) => {
    const score = scoreEvents
      .filter((event) => event.team_name === name)
      .reduce((total, event) => total + Number(event.points ?? 0), 0);
    return { id: name, name, score };
  }).sort((a, b) => b.score - a.score), [teamNames, scoreEvents]);

  const loadTeams = useCallback(async () => {
    setTeamsLoading(true);
    const { data, error } = await supabase.from("teams").select("id, name").order("name");
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
      .on("postgres_changes", { event: "*", schema: "public", table: "teams" }, () => void loadTeams())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [loadTeams]);

  // If a scheduled reveal becomes due while the host dashboard is open,
  // publish the challenge to all connected player screens.
  useEffect(() => {
    if (!game?.scheduled_reveal_at || game.scheduled_challenge_id == null) return;
    const dueAt = Date.parse(game.scheduled_reveal_at);
    if (!Number.isFinite(dueAt)) return;

    const scheduleKey = `${game.scheduled_challenge_id}:${game.scheduled_reveal_at}`;
    const checkSchedule = () => {
      if (Date.now() < dueAt || firedScheduleRef.current === scheduleKey) return;
      const challenge = orderedChallenges.find((item) => String(item.id) === String(game.scheduled_challenge_id));
      if (!challenge) return;
      firedScheduleRef.current = scheduleKey;
      const round = rounds.find((item) => item.challenges.some((entry) => String(entry.id) === String(challenge.id)));
      void updateGameState({
        current_pub: round?.legacyName ?? game.current_pub,
        current_challenge_id: Number(challenge.id),
        current_challenge: challenge.title,
        challenge_description: challenge.description ?? "",
        current_challenge_order: challenge.reveal_order ?? 0,
        voting_open: false,
        show_vote_results: false,
        slideshow_open: false,
        scheduled_challenge_id: null,
        scheduled_reveal_at: null,
      }).then(({ error }) => {
        if (error) {
          console.error("Scheduled reveal failed", error);
          window.alert(`Scheduled reveal failed: ${error.message}`);
        }
      });
    };

    checkSchedule();
    const intervalId = window.setInterval(checkSchedule, 1000);
    return () => window.clearInterval(intervalId);
  }, [game?.scheduled_reveal_at, game?.scheduled_challenge_id, game?.current_pub, orderedChallenges, rounds]);

  const runBusy = async (key: string, operation: () => Promise<void>) => {
    setBusyAction(key);
    try {
      await operation();
    } finally {
      setBusyAction(null);
    }
  };

  async function revealChallenge(challenge: Challenge) {
    const round = rounds.find((item) => item.challenges.some((entry) => String(entry.id) === String(challenge.id)));
    await runBusy(`reveal-${challenge.id}`, async () => {
      const { error } = await updateGameState({
        current_pub: round?.legacyName ?? game?.current_pub ?? "Stationary venue",
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
      const { error } = await updateGameState({ scheduled_challenge_id: null, scheduled_reveal_at: null });
      if (error) {
        window.alert(`Could not cancel schedule: ${error.message}`);
        throw error;
      }
    });
  }

  async function setVoting(open: boolean, target: ScoreTarget = voteTarget) {
    const { error } = await updateGameState(open
      ? { voting_open: true, voting_target: target, show_vote_results: false, slideshow_open: false }
      : { voting_open: false, show_vote_results: true, slideshow_open: false });
    if (error) window.alert(`Could not update voting: ${error.message}`);
  }

  async function returnEveryoneToGame() {
    const { error } = await updateGameState({ voting_open: false, show_vote_results: false, slideshow_open: false });
    if (error) window.alert(`Could not return everyone to the game: ${error.message}`);
  }

  async function setSlideshow(open: boolean) {
    const { error } = await updateGameState({ slideshow_open: open, ...(open ? { voting_open: false, show_vote_results: false } : {}) });
    if (error) window.alert(`Could not update the slideshow: ${error.message}`);
  }

  function openReview(challenge: Challenge | null) {
    if (!challenge) {
      window.alert("Reveal a challenge before reviewing submissions.");
      return;
    }
    navigate(`/challenge-review?type=main&id=${encodeURIComponent(String(challenge.id))}&title=${encodeURIComponent(challenge.title)}&from=admin-v2`);
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

    const challengeTitle = scoreReason.trim() || (scoreAction === "award" ? "Host points award" : "Host points deduction");
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
    const { error } = await supabase.from("players").insert({ name, team: null, score: 0 });
    setCreatingPlayer(false);
    if (error) {
      window.alert(`Could not add player: ${error.message}`);
      return;
    }
    setNewPlayerName("");
  }

  async function assignTeam(player: Player, teamName: string) {
    const { error } = await supabase.from("players").update({ team: teamName || null }).eq("id", player.id);
    if (error) window.alert(`Could not change ${player.name}'s team: ${error.message}`);
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

  if (!game) {
    return (
      <main className="host-v2">
        <div className="host-v2__loading">Loading host controls…</div>
      </main>
    );
  }

  const challengeProgress = orderedChallenges.length > 0
    ? Math.max(0, Math.min(100, ((currentChallengeIndex + 1) / orderedChallenges.length) * 100))
    : 0;
  const scheduledTime = game.scheduled_reveal_at
    ? new Date(game.scheduled_reveal_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <main className="host-v2">
      <div className="host-v2__app">
        <header className="host-v2__header">
          <div className="host-v2__brand-row">
            <div>
              <p className="host-v2__eyebrow">CHAOS · HOST CONTROL</p>
              <h1 className="host-v2__brand">Run the game</h1>
            </div>
            <span className={`host-v2__live-pill ${currentChallenge ? "is-live" : "is-ready"}`}>
              <span className="host-v2__live-dot" />
              {currentChallenge ? "LIVE" : "READY"}
            </span>
          </div>
          <div className="host-v2__event-row">
            <span><MapPin size={14} /> One venue · No travel between rounds</span>
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
                  <span className="host-v2__progress-number">{Math.max(currentChallengeIndex + 1, 0)} / {orderedChallenges.length}</span>
                </div>
                <div className="host-v2__progress"><span style={{ width: `${challengeProgress}%` }} /></div>
              </section>

              <section className="host-v2__panel host-v2__panel--white">
                <div className="host-v2__panel-topline">
                  <span className="host-v2__kicker"><Radio size={14} /> NOW</span>
                  {currentChallenge && <span className="host-v2__status host-v2__status--live">Live challenge</span>}
                </div>
                {currentChallenge ? (
                  <>
                    <div className="host-v2__challenge-title-row">
                      <div className="host-v2__challenge-art"><Flag size={28} /></div>
                      <div className="host-v2__grow">
                        <h2>{currentChallenge.title}</h2>
                        <p>{currentChallenge.description || "No extra instructions for this challenge."}</p>
                      </div>
                      <span className="host-v2__points">+{currentChallenge.points} pts</span>
                    </div>
                    <div className="host-v2__meta-row">
                      <span><CheckCircle2 size={15} /> {completions.filter((item) => item.challenge_type === "main" && String(item.challenge_id) === String(currentChallenge.id)).length} submissions</span>
                      <button type="button" className="host-v2__text-button" onClick={() => openReview(currentChallenge)}>Review <ChevronRight size={16} /></button>
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
                  <span className="host-v2__kicker"><ArrowRight size={14} /> NEXT</span>
                  {scheduledTime && <span className="host-v2__status host-v2__status--scheduled"><Clock3 size={13} /> {scheduledTime}</span>}
                </div>
                {scheduledChallenge ? (
                  <div className="host-v2__challenge-title-row">
                    <div className="host-v2__challenge-art host-v2__challenge-art--lime"><CalendarClock size={25} /></div>
                    <div className="host-v2__grow">
                      <h2>{scheduledChallenge.title}</h2>
                      <p>{scheduledChallenge.description || "Scheduled challenge"}</p>
                      <p className="host-v2__small-note">Scheduled to reveal{scheduledTime ? ` at ${scheduledTime}` : " soon"}.</p>
                    </div>
                  </div>
                ) : nextChallenge ? (
                  <div className="host-v2__challenge-title-row">
                    <div className="host-v2__challenge-art host-v2__challenge-art--lime"><CircleDot size={25} /></div>
                    <div className="host-v2__grow">
                      <h2>{nextChallenge.title}</h2>
                      <p>{nextChallenge.description || "No extra instructions for this challenge."}</p>
                      <span className="host-v2__points-inline">+{nextChallenge.points} points</span>
                    </div>
                  </div>
                ) : (
                  <div className="host-v2__empty"><h2>All rounds revealed</h2><p>You've reached the end of the main challenge list.</p></div>
                )}
                <div className="host-v2__actions">
                  {nextChallenge && <button type="button" className="host-v2__button host-v2__button--primary" disabled={Boolean(busyAction)} onClick={() => void revealChallenge(nextChallenge)}>{busyAction === `reveal-${nextChallenge.id}` ? "Revealing…" : "Reveal next challenge"}<ChevronRight size={17} /></button>}
                  {scheduledChallenge && <button type="button" className="host-v2__button host-v2__button--subtle" disabled={Boolean(busyAction)} onClick={() => void cancelScheduledReveal()}><X size={16} /> Cancel schedule</button>}
                </div>
                {nextChallenge && !scheduledChallenge && (
                  <div className="host-v2__schedule-row">
                    <label htmlFor="host-v2-schedule">Auto-reveal in</label>
                    <input id="host-v2-schedule" aria-label="Minutes until auto reveal" type="number" min={1} max={240} value={scheduleMinutes} onChange={(event) => setScheduleMinutes(event.target.value)} />
                    <span>min</span>
                    <button type="button" className="host-v2__icon-button" disabled={Boolean(busyAction)} aria-label="Schedule next challenge" onClick={() => void scheduleChallenge(nextChallenge)}><CalendarClock size={17} /></button>
                  </div>
                )}
              </section>

              <section className="host-v2__panel host-v2__panel--tint">
                <div className="host-v2__panel-topline"><span className="host-v2__kicker"><Users size={14} /> LIVE CONTROLS</span></div>
                <div className="host-v2__actions host-v2__actions--stack">
                  {game.voting_open ? (
                    <button type="button" className="host-v2__button host-v2__button--primary" onClick={() => void setVoting(false)}>Close voting & show results <Trophy size={17} /></button>
                  ) : game.show_vote_results ? (
                    <>
                      <button type="button" className="host-v2__button host-v2__button--primary" onClick={() => navigate("/vote-results")}>View vote results <ChevronRight size={17} /></button>
                      <button type="button" className="host-v2__button host-v2__button--subtle" onClick={() => void returnEveryoneToGame()}>Return everyone to game</button>
                    </>
                  ) : (
                    <>
                      <div className="host-v2__inline-selects">
                        <label htmlFor="host-v2-vote-target">Vote for</label>
                        <select id="host-v2-vote-target" value={voteTarget} onChange={(event) => setVoteTarget(event.target.value as ScoreTarget)}><option value="player">Players</option><option value="team">Teams</option></select>
                      </div>
                      <button type="button" className="host-v2__button host-v2__button--primary" disabled={!currentChallenge} onClick={() => void setVoting(true, voteTarget)}>Open voting <Trophy size={17} /></button>
                    </>
                  )}
                  <button type="button" className="host-v2__button host-v2__button--subtle" onClick={() => void setSlideshow(!game.slideshow_open)}>{game.slideshow_open ? "Close slideshow" : "Open slideshow"}<ChevronRight size={17} /></button>
                </div>
              </section>
            </>
          )}

          {activeTab === "challenges" && (
            <>
              <div className="host-v2__page-intro"><p className="host-v2__eyebrow">GAME CONTENT</p><h2>Challenges</h2><p>Rounds happen here at the venue. Reveal or schedule a challenge whenever you're ready.</p></div>
              {rounds.map((round) => (
                <section className="host-v2__panel host-v2__panel--white" key={round.id}>
                  <div className="host-v2__panel-topline"><span className="host-v2__kicker">{round.label.toUpperCase()}</span><span className="host-v2__muted">{round.challenges.length} challenges</span></div>
                  <div className="host-v2__list">
                    {round.challenges.map((challenge) => {
                      const isCurrent = String(challenge.id) === String(game.current_challenge_id);
                      const isScheduled = String(challenge.id) === String(game.scheduled_challenge_id);
                      const isPast = currentChallengeIndex >= 0 && orderedChallenges.findIndex((item) => String(item.id) === String(challenge.id)) < currentChallengeIndex;
                      return (
                        <article className="host-v2__challenge-list-item" key={challenge.id}>
                          <div className="host-v2__list-icon">{isPast ? <Check size={17} /> : <Flag size={17} />}</div>
                          <div className="host-v2__grow">
                            <div className="host-v2__title-line"><h3>{challenge.title}</h3>{isCurrent && <span className="host-v2__status host-v2__status--live">Live</span>}{isScheduled && <span className="host-v2__status host-v2__status--scheduled">Scheduled</span>}</div>
                            <p>{challenge.description || "No description added."}</p>
                            <span className="host-v2__points-inline">+{challenge.points} points</span>
                          </div>
                          <div className="host-v2__row-actions">
                            <button type="button" className="host-v2__small-action" disabled={Boolean(busyAction) || isCurrent} onClick={() => void revealChallenge(challenge)}>{isCurrent ? "Live" : "Reveal"}</button>
                            {!isCurrent && !isScheduled && <button type="button" className="host-v2__small-action host-v2__small-action--quiet" disabled={Boolean(busyAction)} onClick={() => void scheduleChallenge(challenge)}>Schedule</button>}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}
              <section className="host-v2__panel host-v2__panel--tint">
                <div className="host-v2__section-heading"><div><p className="host-v2__eyebrow">OPTIONAL TASKS</p><h2>Side challenges</h2></div><span className="host-v2__count-pill">{sideChallenges.length}</span></div>
                <p className="host-v2__body-copy">These can be completed at any point during the party.</p>
                {sideChallenges.length ? <div className="host-v2__list">
                  {sideChallenges.map((challenge) => {
                    const count = completions.filter((item) => item.challenge_type === "side" && String(item.challenge_id) === String(challenge.id)).length;
                    return <article className="host-v2__side-card" key={challenge.id}><div className="host-v2__side-card-top"><h3>{challenge.title}</h3><span className="host-v2__points">+{challenge.points} pts</span></div><p>{challenge.description}</p><div className="host-v2__side-card-bottom"><span className="host-v2__muted">{count} completions recorded</span><button type="button" className="host-v2__small-action" onClick={() => navigate(`/challenge-review?type=side&id=${encodeURIComponent(String(challenge.id))}&title=${encodeURIComponent(challenge.title)}&from=admin-v2`)}>Review</button></div></article>;
                  })}
                </div> : <p className="host-v2__empty-copy">No active side challenges found.</p>}
              </section>
            </>
          )}

          {activeTab === "scores" && (
            <>
              <div className="host-v2__page-intro"><p className="host-v2__eyebrow">COMPETITION</p><h2>Scores & results</h2><p>Award points, dock points and keep track of the leaderboard.</p></div>
              <section className="host-v2__panel host-v2__panel--white">
                <div className="host-v2__panel-topline"><span className="host-v2__kicker"><Plus size={14} /> POINTS ADJUSTMENT</span></div>
                <div className="host-v2__segmented" role="group" aria-label="Score target">
                  <button type="button" className={scoreTarget === "player" ? "is-selected" : ""} onClick={() => setScoreTarget("player")}>Player</button>
                  <button type="button" className={scoreTarget === "team" ? "is-selected" : ""} onClick={() => setScoreTarget("team")}>Team</button>
                </div>
                <div className="host-v2__segmented host-v2__segmented--action" role="group" aria-label="Award or dock points">
                  <button type="button" className={scoreAction === "award" ? "is-selected" : ""} onClick={() => setScoreAction("award")}><Plus size={15} /> Award</button>
                  <button type="button" className={scoreAction === "dock" ? "is-selected" : ""} onClick={() => setScoreAction("dock")}><Minus size={15} /> Dock</button>
                </div>
                {scoreTarget === "player" ? (
                  <label className="host-v2__field"><span>Player</span><select value={selectedPlayerId} onChange={(event) => setSelectedPlayerId(event.target.value)}><option value="">Select a player</option>{players.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}</select></label>
                ) : (
                  <label className="host-v2__field"><span>Team</span><select value={selectedTeamName} onChange={(event) => setSelectedTeamName(event.target.value)}><option value="">Select a team</option>{teamNames.map((name) => <option key={name} value={name}>{name}</option>)}</select></label>
                )}
                <label className="host-v2__field"><span>Points</span><input type="number" min={1} value={pointsDraft} onChange={(event) => setPointsDraft(event.target.value)} /></label>
                <label className="host-v2__field"><span>Reason (optional)</span><input value={scoreReason} onChange={(event) => setScoreReason(event.target.value)} placeholder="e.g. Best costume" /></label>
                <button type="button" className="host-v2__button host-v2__button--primary" onClick={() => void handleAwardOrDock()}>{scoreAction === "award" ? "Award points" : "Dock points"}<ChevronRight size={17} /></button>
              </section>
              <section className="host-v2__panel host-v2__panel--white">
                <div className="host-v2__panel-topline"><span className="host-v2__kicker"><Trophy size={14} /> LEADERBOARD</span><span className="host-v2__muted">{scoresLoading ? "Updating…" : "Live scores"}</span></div>
                <div className="host-v2__segmented" role="group" aria-label="Leaderboard view">
                  <button type="button" className={scoreLeaderboardTarget === "player" ? "is-selected" : ""} onClick={() => setScoreLeaderboardTarget("player")}>Player scores</button>
                  <button type="button" className={scoreLeaderboardTarget === "team" ? "is-selected" : ""} onClick={() => setScoreLeaderboardTarget("team")}>Team scores</button>
                </div>
                {(scoreLeaderboardTarget === "player" ? playerLeaderboard : teamLeaderboard).length ? (
                  <div className="host-v2__leaderboard">
                    {(scoreLeaderboardTarget === "player" ? playerLeaderboard : teamLeaderboard).map((entry, index) => (
                      <div className="host-v2__leader-row" key={entry.id}>
                        <span className={`host-v2__rank ${index === 0 ? "is-first" : ""}`}>{index + 1}</span>
                        <span className="host-v2__leader-name">{entry.name}</span>
                        <strong>{entry.score} <small>pts</small></strong>
                      </div>
                    ))}
                  </div>
                ) : <p className="host-v2__empty-copy">Scores will appear here when points are awarded.</p>}
              </section>
              <section className="host-v2__panel host-v2__panel--tint">
                <div className="host-v2__panel-topline"><span className="host-v2__kicker">DISPLAY CONTROLS</span></div>
                <button type="button" className="host-v2__button host-v2__button--primary" onClick={() => void setSlideshow(true)}>Open slideshow <ChevronRight size={17} /></button>
                {game.show_vote_results && <button type="button" className="host-v2__button host-v2__button--subtle" onClick={() => void returnEveryoneToGame()}>Return everyone to game</button>}
              </section>
            </>
          )}

          {activeTab === "players" && (
            <>
              <div className="host-v2__page-intro"><p className="host-v2__eyebrow">THE PARTY</p><h2>Players & teams</h2><p>Manage your roster and keep teams balanced.</p></div>
              <section className="host-v2__panel host-v2__panel--white">
                <div className="host-v2__panel-topline"><span className="host-v2__kicker"><Users size={14} /> TEAMS</span><span className="host-v2__muted">{teams.length} teams</span></div>
                <div className="host-v2__add-row"><input aria-label="New team name" placeholder="New team name" value={teamNameDraft} onChange={(event) => setTeamNameDraft(event.target.value)} /><button type="button" className="host-v2__icon-button" aria-label="Create team" disabled={creatingTeam || !teamNameDraft.trim()} onClick={() => void addTeam()}>{creatingTeam ? "…" : <Plus size={18} />}</button></div>
                {teamsLoading ? <p className="host-v2__muted">Loading teams…</p> : teamNames.length ? <div className="host-v2__team-chips">{teamNames.map((name) => <span key={name}>{name}</span>)}</div> : <p className="host-v2__empty-copy">Create a team or assign players to a team below.</p>}
              </section>
              <section className="host-v2__panel host-v2__panel--white">
                <div className="host-v2__panel-topline"><span className="host-v2__kicker"><Users size={14} /> PLAYER ROSTER</span><span className="host-v2__muted">{players.length} players</span></div>
                <div className="host-v2__add-row"><input aria-label="New player name" placeholder="Add a player" value={newPlayerName} onChange={(event) => setNewPlayerName(event.target.value)} /><button type="button" className="host-v2__icon-button" aria-label="Add player" disabled={creatingPlayer || !newPlayerName.trim()} onClick={() => void addPlayer()}>{creatingPlayer ? "…" : <Plus size={18} />}</button></div>
                {players.length ? <div className="host-v2__player-list">
                  {players.map((player) => (
                    <article className="host-v2__player-row" key={player.id}>
                      <div className="host-v2__avatar" aria-hidden="true">{player.name.trim().slice(0, 1).toUpperCase() || "?"}</div>
                      <div className="host-v2__grow">
                        <input aria-label={`Rename ${player.name}`} className="host-v2__player-name" defaultValue={player.name} key={`${player.id}-${player.name}`} onBlur={(event) => void savePlayerName(player, event.target.value)} />
                        <label className="host-v2__team-select"><span>Team</span><select value={player.team ?? ""} onChange={(event) => void assignTeam(player, event.target.value)}><option value="">Unassigned</option>{teamNames.map((name) => <option key={name} value={name}>{name}</option>)}</select></label>
                      </div>
                      <button type="button" className="host-v2__remove-button" aria-label={`Remove ${player.name}`} onClick={() => void removePlayer(player)}><X size={16} /></button>
                    </article>
                  ))}
                </div> : <p className="host-v2__empty-copy">Players will appear here when they join using your game code.</p>}
              </section>
            </>
          )}
        </div>

        <nav className="host-v2__bottom-nav" aria-label="Host navigation">
          {TAB_ITEMS.map(({ id, label, Icon }) => (
            <button type="button" key={id} className={activeTab === id ? "is-active" : ""} aria-current={activeTab === id ? "page" : undefined} onClick={() => setActiveTab(id)}>
              <Icon size={19} strokeWidth={2.5} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>
    </main>
  );
}
