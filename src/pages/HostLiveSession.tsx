import SessionFeedback from "../components/session/SessionFeedback";
import SessionReview from "../components/session/SessionReview";
import SessionRewardRound from "../components/session/SessionRewardRound";
import { rewardPresentation } from "../features/host-live/rewardPresentation";
import SessionBreak from "../components/session/SessionBreak";
import SessionChallengeCard from "../components/session/SessionChallengeCard";
import SessionNavigation from "../components/session/SessionNavigation";
import SessionPage from "../components/session/SessionPage";
import SessionState from "../components/session/SessionState";
import Icon from "../components/ui/Icon";
import BreakTimerEditor from "../features/host-live/BreakTimerEditor";
import ChallengeEditor from "../features/host-live/ChallengeEditor";
import HostFinalRound from "../features/host-live/HostFinalRound";
import HostManagement from "../features/host-live/HostManagement";
import HostRewardRound from "../features/host-live/HostRewardRound";
import HostSessionLeaderboard from "../features/host-live/HostSessionLeaderboard";
import RoundOverrideDialog from "../features/host-live/RoundOverrideDialog";
import type {
  GameScheduleItem,
  HostTab,
  PlannedTaskInfo,
  PresentationConnectionLike,
  PresentationRequestConstructor,
  RewardMethod,
  RewardTargetKind,
  SessionChallenge,
  SessionPlayer,
  SessionSubmission,
  SessionTeam,
} from "../features/host-live/types";
import { useHostSessionData } from "../features/host-live/useHostSessionData";
import SessionParticipant from "../features/session-player/SessionParticipant";
import type { PlayerPage } from "../features/session-player/types";

import { QRCodeSVG } from "qrcode.react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Link, useParams } from "react-router-dom";
import SessionMainChallengeCard from "../components/session/SessionMainChallengeCard";
import GuidedTour, { type GuidedTourStep } from "../components/tour/GuidedTour";
import { challengeIcon } from "../lib/challengeVisuals";
import { supabase } from "../lib/sessionSupabase";
import "../styles/HostPortal.css";
import "../styles/HostLiveGame.css";
import "../styles/PlayerGame.css";
function hostPlayerStorageKey(sessionId: string) {
  return `chaos-crawl-host-player:${sessionId}`;
}
export default function HostLiveSession() {
  const { sessionId = "" } = useParams();
  const {
    session,
    setSession,
    challenges,
    players,
    teams,
    submissions,
    secretAssignments,
    secretReviewState,
    secretReviewAssignments,
    secretReviewVotes,
    evidence,
    finalVotes,
    finalRoundState,
    finalRoundChallenges,
    rewardRounds,
    rewardVotes,
    rewardAwards,
    rewardChallengeId,
    setRewardChallengeId,
    rewardMethod,
    setRewardMethod,
    loading,
    error,
    setError,
    load,
  } = useHostSessionData(sessionId);
  const [hostPlayerToken, setHostPlayerToken] = useState<string | null>(() =>
    localStorage.getItem(hostPlayerStorageKey(sessionId)),
  );
  const [focusedHostChallenge, setFocusedHostChallenge] = useState<
    string | null
  >(null);
  useEffect(() => {
    setHostPlayerToken(localStorage.getItem(hostPlayerStorageKey(sessionId)));
    setFocusedHostChallenge(null);
  }, [sessionId]);
  const navigateParticipant = useCallback(
    (section: PlayerPage) =>
      setActiveTab(section === "final" ? "final-round" : section),
    [],
  );
  const [showRewardSetup, setShowRewardSetup] = useState(false);
  const [showRewardOverlay, setShowRewardOverlay] = useState(false);
  const [rewardTargetKind, setRewardTargetKind] =
    useState<RewardTargetKind>("player");
  const [rewardPoints, setRewardPoints] = useState(10);
  const [rewardFinalPoints, setRewardFinalPoints] = useState(10);
  const [selectedRewardWinnerIds, setSelectedRewardWinnerIds] = useState<
    string[]
  >([]);
  const [selectedSecretPlayerId, setSelectedSecretPlayerId] = useState("");
  const [selectedSecretChallengeId, setSelectedSecretChallengeId] =
    useState("");
  const [secretScheduleAt, setSecretScheduleAt] = useState("");
  const [newSecretTitle, setNewSecretTitle] = useState("");
  const [newSecretDescription, setNewSecretDescription] = useState("");
  const [newSecretPoints, setNewSecretPoints] = useState(10);
  const [newSecretEvidenceRequired, setNewSecretEvidenceRequired] =
    useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [teamName, setTeamName] = useState("");
  const [activeTab, setActiveTab] = useState<HostTab>("game");
  const [lobbyStep, setLobbyStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(() => {
    const saved = Number(
      localStorage.getItem(`chaos-crawl-host-flow:${sessionId}`),
    );
    return saved >= 1 && saved <= 6 ? (saved as 1 | 2 | 3 | 4 | 5 | 6) : 1;
  });
  const [hostJoinChoice, setHostJoinChoice] = useState<boolean | null>(null);
  const [hostAvatarFile, setHostAvatarFile] = useState<File | null>(null);
  const [hostAvatarPreview, setHostAvatarPreview] = useState("");
  const [selectedLobbyPlayerId, setSelectedLobbyPlayerId] = useState("");
  const [teamNameEdits, setTeamNameEdits] = useState<Record<string, string>>(
    {},
  );
  const [teamPhotoUrls, setTeamPhotoUrls] = useState<Record<string, string>>(
    {},
  );
  const [hostPlayerName, setHostPlayerName] = useState("Host");
  const [hostDisplayName, setHostDisplayName] = useState("Host");
  const [gamePhotoUrl, setGamePhotoUrl] = useState<string | null>(null);
  const [hostBreakActive, setHostBreakActive] = useState(false);
  const [roundClockSeconds, setRoundClockSeconds] = useState(0);
  const [roundClockRunning, setRoundClockRunning] = useState(false);
  const [hydratedRoundClockKey, setHydratedRoundClockKey] = useState("");
  const [hostTourOpen, setHostTourOpen] = useState(false);
  const [autoplayEnabled, setAutoplayEnabled] = useState(false);
  const [autoplayOverridden, setAutoplayOverridden] = useState(false);
  const [overridePrompt, setOverridePrompt] = useState<
    | null
    | { kind: "start" }
    | { kind: "round"; round: number; forceBreak?: boolean }
  >(null);
  const [gameSchedule, setGameSchedule] = useState<GameScheduleItem[]>([]);
  const [plannedTasks, setPlannedTasks] = useState<PlannedTaskInfo[]>([]);
  const [editingBreakChallenge, setEditingBreakChallenge] =
    useState<SessionChallenge | null>(null);
  const [editingBreakTimer, setEditingBreakTimer] = useState(false);
  const [editBreakMinutes, setEditBreakMinutes] = useState(15);
  const [editChallengeTitle, setEditChallengeTitle] = useState("");
  const [editChallengeDescription, setEditChallengeDescription] = useState("");
  const [editChallengeEquipment, setEditChallengeEquipment] = useState("");
  const [editChallengeDuration, setEditChallengeDuration] = useState(15);
  const [editChallengePoints, setEditChallengePoints] = useState(10);
  const [editChallengeEvidence, setEditChallengeEvidence] = useState(false);
  const [defaultBreakMinutes, setDefaultBreakMinutes] = useState(0);
  const [breakResumeRound, setBreakResumeRound] = useState<number | null>(null);
  const breakAdvanceRequested = useRef(false);
  const finalSlideshowConnection = useRef<PresentationConnectionLike | null>(
    null,
  );
  const [isFinalSlideshowConnected, setIsFinalSlideshowConnected] =
    useState(false);
  const secretSlideshowConnection = useRef<PresentationConnectionLike | null>(
    null,
  );
  const [isSecretSlideshowConnected, setIsSecretSlideshowConnected] =
    useState(false);
  const roundClockSecondsRef = useRef(roundClockSeconds);
  roundClockSecondsRef.current = roundClockSeconds;
  const sharedTimerWriteQueue = useRef<Promise<void>>(Promise.resolve());

  useEffect(
    () => () => {
      finalSlideshowConnection.current?.close();
      finalSlideshowConnection.current = null;
      secretSlideshowConnection.current?.close();
      secretSlideshowConnection.current = null;
    },
    [],
  );

  const hostTourSteps: GuidedTourStep[] = [
    {
      target: '[data-tour="host-overview"]',
      title: "Your live game overview",
      body: "The game code, live status and player count help you keep track of the session. Share the code or QR from Host Controls when people are joining.",
      page: "game",
    },
    {
      target: '[data-tour="host-sections"]',
      title: "The same game sections",
      body: "These tabs mirror the player experience: Game, Leaderboard, Side Challenges and Reward Round. The Host Controls tab contains the tools players cannot access.",
      page: "game",
    },
    {
      target: '[data-tour="host-player-game"]',
      title: "The player experience",
      body: "This is the same game screen players use. If host participation is enabled, join the roster here and complete challenges, upload evidence and follow the game like everyone else.",
      page: "game",
    },
    {
      target: '[data-tour="host-leaderboard"]',
      title: "Leaderboard",
      body: "Switch between player and team rankings, check scores and assign teams while the game is in the lobby.",
      page: "leaderboard",
    },
    {
      target: '[data-tour="host-side-review"]',
      title: "Side challenges",
      body: "Side-challenge submissions are automatically approved for 5 points. Every submitted photo and video is included in its challenge vote; tied top submissions receive the configured bonus.",
      page: "side-challenges",
    },
    {
      target: '[data-tour="host-controls-tab"]',
      title: "Host-only controls",
      body: "This tab contains tools players cannot access: start or finish the game, navigate rounds, manage teams, review submissions and schedule secret missions.",
      page: "host-controls",
    },
    {
      target: '[data-tour="host-start-controls"]',
      title: "Start and manage the game",
      body: "Share the join code and QR, check who has joined, assign teams and start the game when everyone is ready. During play, use the round controls to move the game along.",
      page: "host-controls",
    },
    {
      target: '[data-tour="host-review"]',
      title: "Review main challenges",
      body: "Open submitted photos or videos, approve or reject the work and assign main-challenge points here. Side-challenge points are handled separately after voting.",
      page: "host-controls",
    },
    {
      target: '[data-tour="host-reward"]',
      title: "Run a reward round",
      body: "Choose an enabled method, set the points, run voting or select winners, then show the results and return everyone to the game.",
      page: "reward-round",
    },
    {
      target: '[data-tour="host-final-round"]',
      title: "Run the final round",
      body: "Open side-challenge voting, cast the slideshow to a TV and vote alongside players from the submission list.",
      page: "final-round",
    },
  ];
  const navigateHostTour = useCallback((page: string) => {
    setActiveTab(page as HostTab);
  }, []);

  useEffect(() => {
    let alive = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (!alive) return;
      const name = String(
        data.user?.user_metadata?.display_name ??
          data.user?.email?.split("@")[0] ??
          "Host",
      );
      setHostDisplayName(name);
      setHostPlayerName(name);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!session?.host_game_id) return;
    let alive = true;
    void supabase
      .from("host_games")
      .select("plan_data")
      .eq("id", session.host_game_id)
      .maybeSingle()
      .then(({ data }) => {
        if (!alive) return;
        const planData = data?.plan_data as {
          gamePhotoUrl?: string | null;
          teamPhotoUrls?: Record<string, string>;
          autoplay?: boolean;
          breakMinutes?: number;
          schedule?: GameScheduleItem[];
          selectedTasks?: PlannedTaskInfo[];
        } | null;
        setGamePhotoUrl(planData?.gamePhotoUrl ?? null);
        setTeamPhotoUrls(planData?.teamPhotoUrls ?? {});
        setAutoplayEnabled(Boolean(planData?.autoplay));
        setDefaultBreakMinutes(
          Math.max(0, Number(planData?.breakMinutes) || 0),
        );
        setGameSchedule(
          Array.isArray(planData?.schedule) ? planData.schedule : [],
        );
        setPlannedTasks(
          Array.isArray(planData?.selectedTasks) ? planData.selectedTasks : [],
        );
      });
    return () => {
      alive = false;
    };
  }, [session?.host_game_id]);

  useEffect(() => {
    setAutoplayOverridden(
      localStorage.getItem(
        `chaos-crawl-host-autoplay-override:${sessionId}`,
      ) === "1",
    );
  }, [sessionId]);

  useEffect(() => {
    if (session) setHostJoinChoice(session.host_participates);
  }, [session?.id]);

  useEffect(() => {
    setTeamNameEdits((current) =>
      Object.fromEntries(
        teams.map((team) => [team.id, current[team.id] ?? team.name]),
      ),
    );
    if (!players.some((player) => player.id === selectedLobbyPlayerId)) {
      const nextPlayer =
        players.find((player) => !player.team_id) ?? players[0];
      setSelectedLobbyPlayerId(nextPlayer?.id ?? "");
    }
  }, [players, selectedLobbyPlayerId, teams]);

  useEffect(() => {
    let mounted = true;
    const initial = async () => {
      if (mounted) await load();
    };
    void initial();
    const timer = window.setInterval(() => {
      if (mounted) void load();
    }, 3000);
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, [load]);

  const mainRounds = useMemo(
    () =>
      challenges
        .filter((item) => item.kind === "main" && item.round_number !== null)
        .sort((a, b) => Number(a.round_number) - Number(b.round_number)),
    [challenges],
  );
  const sideChallenges = challenges.filter((item) => item.kind === "side");
  const secretChallenges = challenges.filter((item) => item.kind === "secret");
  const currentChallenge = mainRounds.find(
    (item) => item.round_number === session?.current_round_number,
  );
  const nextBreakChallenge = mainRounds.find(
    (item) =>
      item.round_number ===
      (breakResumeRound ?? (session?.current_round_number ?? 0) + 1),
  );
  const nextBreakTask = nextBreakChallenge
    ? (plannedTasks.find((task) =>
        gameSchedule.some(
          (item) =>
            item.type === "challenge" &&
            item.taskId === task.id &&
            (item.title === nextBreakChallenge.title ||
              item.title.startsWith(task.title ?? "")),
        ),
      ) ??
      plannedTasks.find(
        (task) =>
          (task.title ?? "").toLowerCase() ===
          nextBreakChallenge.title.toLowerCase(),
      ))
    : undefined;
  const breakStartAt =
    hostBreakActive && roundClockRunning
      ? new Date(Date.now() + roundClockSeconds * 1000)
      : null;
  const nextRoundStartAt = breakStartAt
    ? new Date(breakStartAt.getTime())
    : null;
  const nextRoundEndAt =
    nextRoundStartAt && nextBreakChallenge
      ? new Date(
          nextRoundStartAt.getTime() +
            Math.max(0, Number(nextBreakChallenge.duration_minutes) || 0) *
              60_000,
        )
      : null;
  const readyTeamsCount = teams.filter((team) =>
    players.some((player) => player.team_id === team.id),
  ).length;
  const unassignedPlayers = players.filter((player) => !player.team_id);
  function plannedBreakAfter(roundNumber: number) {
    if (roundNumber >= mainRounds.length) return 0;
    const currentRound = mainRounds.find(
      (round) => Number(round.round_number) === roundNumber,
    );
    if (!currentRound) return defaultBreakMinutes;
    const normalize = (title: string) =>
      title
        .toLowerCase()
        .replace(/\s*[-–—]\s*(player prep|player performance)$/i, "")
        .trim();
    const currentTitle = normalize(currentRound.title);
    let scheduleIndex = gameSchedule.findIndex(
      (item) =>
        item.type === "challenge" && normalize(item.title) === currentTitle,
    );
    if (scheduleIndex < 0)
      scheduleIndex = gameSchedule.findIndex(
        (item) =>
          item.type === "challenge" &&
          (normalize(item.title).startsWith(currentTitle) ||
            currentTitle.startsWith(normalize(item.title))),
      );
    if (scheduleIndex >= 0) {
      let planned = 0;
      for (
        let index = scheduleIndex + 1;
        index < gameSchedule.length;
        index += 1
      ) {
        const item = gameSchedule[index];
        if (item.type === "challenge") break;
        if (item.type === "break")
          planned += Math.max(0, Number(item.duration) || 0);
      }
      if (planned > 0) return planned;
    }
    return defaultBreakMinutes;
  }
  const upcomingBreakMinutes =
    session && session.status === "live"
      ? plannedBreakAfter(session.current_round_number)
      : 0;
  const roundClockKey =
    session?.id && session.status === "live"
      ? `${session.id}:${session.current_round_number}`
      : "";
  const roundClockStorageKey = roundClockKey
    ? `chaos-crawl-host-round-clock:${roundClockKey}`
    : "";
  const roundClockText = `${Math.floor(roundClockSeconds / 60)
    .toString()
    .padStart(2, "0")}:${(roundClockSeconds % 60).toString().padStart(2, "0")}`;
  const roundTimerHydrated = Boolean(
    roundClockKey && hydratedRoundClockKey === roundClockKey,
  );
  useEffect(() => {
    if (!roundClockStorageKey || !currentChallenge) return;
    let seconds =
      Math.max(0, Number(currentChallenge.duration_minutes) || 0) * 60;
    let running = false;
    let onBreak = false;
    let resumeRound: number | null = null;
    try {
      const saved = JSON.parse(
        localStorage.getItem(roundClockStorageKey) ?? "null",
      ) as {
        seconds?: number;
        running?: boolean;
        onBreak?: boolean;
        resumeRound?: number | null;
        updatedAt?: number;
      } | null;
      if (saved && Number.isFinite(saved.seconds)) {
        seconds = Math.max(0, Number(saved.seconds));
        running = Boolean(saved.running);
        onBreak = Boolean(saved.onBreak);
        resumeRound = saved.resumeRound ?? null;
        if (running && Number.isFinite(saved.updatedAt))
          seconds = Math.max(
            0,
            seconds - Math.floor((Date.now() - Number(saved.updatedAt)) / 1000),
          );
      }
    } catch {
      /* Start a fresh host-side clock if browser storage is unavailable. */
    }
    setRoundClockSeconds(seconds);
    setRoundClockRunning(running && seconds > 0);
    setHostBreakActive(onBreak);
    setBreakResumeRound(resumeRound);
    setHydratedRoundClockKey(roundClockKey);
    void saveSharedTimer(
      Number(
        currentChallenge.round_number ?? session?.current_round_number ?? 1,
      ),
      seconds,
      running && seconds > 0,
      onBreak,
      resumeRound,
    );
  }, [roundClockKey, roundClockStorageKey, currentChallenge?.duration_minutes]);
  useEffect(() => {
    if (!roundClockRunning || !roundClockKey) return;
    const interval = window.setInterval(
      () => setRoundClockSeconds((seconds) => Math.max(0, seconds - 1)),
      1000,
    );
    return () => window.clearInterval(interval);
  }, [roundClockKey, roundClockRunning]);
  useEffect(() => {
    if (!roundClockRunning || !session || !roundClockKey) return;
    const interval = window.setInterval(() => {
      void saveSharedTimer(
        session.current_round_number,
        roundClockSecondsRef.current,
        true,
        hostBreakActive,
        breakResumeRound,
      );
    }, 5000);
    return () => window.clearInterval(interval);
  }, [
    breakResumeRound,
    hostBreakActive,
    roundClockKey,
    roundClockRunning,
    session?.current_round_number,
  ]);
  useEffect(() => {
    if (roundClockRunning && roundClockSeconds === 0)
      setRoundClockRunning(false);
  }, [roundClockRunning, roundClockSeconds]);
  useEffect(() => {
    if (
      !session ||
      !roundTimerHydrated ||
      !roundClockKey ||
      hostBreakActive ||
      roundClockRunning ||
      roundClockSeconds !== 0
    )
      return;
    void saveSharedTimer(session.current_round_number, 0, false, false);
  }, [
    hostBreakActive,
    roundClockKey,
    roundClockRunning,
    roundClockSeconds,
    roundTimerHydrated,
    session?.current_round_number,
  ]);
  useEffect(() => {
    if (
      !session ||
      session.status !== "live" ||
      busy ||
      !hostBreakActive ||
      roundClockSeconds !== 0 ||
      !breakResumeRound ||
      breakAdvanceRequested.current
    )
      return;
    breakAdvanceRequested.current = true;
    void moveToRound(breakResumeRound);
  }, [
    breakResumeRound,
    busy,
    hostBreakActive,
    roundClockSeconds,
    session?.id,
    session?.status,
  ]);
  useEffect(() => {
    if (!roundClockStorageKey || hydratedRoundClockKey !== roundClockKey)
      return;
    try {
      localStorage.setItem(
        roundClockStorageKey,
        JSON.stringify({
          seconds: roundClockSeconds,
          running: roundClockRunning,
          onBreak: hostBreakActive,
          resumeRound: breakResumeRound,
          updatedAt: Date.now(),
        }),
      );
    } catch {
      /* The timer continues for this visit without persistence. */
    }
  }, [
    breakResumeRound,
    hostBreakActive,
    hydratedRoundClockKey,
    roundClockKey,
    roundClockRunning,
    roundClockSeconds,
    roundClockStorageKey,
  ]);
  const activeRewardRound =
    rewardRounds.find(
      (item) =>
        item.released_at === null &&
        (item.status === "open" || item.status === "completed"),
    ) ?? null;
  const currentRoundPointsAwarded = Boolean(
    currentChallenge &&
    rewardRounds.some(
      (item) =>
        item.challenge_id === currentChallenge.id &&
        item.status === "completed" &&
        item.released_at !== null,
    ),
  );
  useEffect(() => {
    if (activeRewardRound) setRewardFinalPoints(activeRewardRound.points);
  }, [activeRewardRound?.id]);
  const activeRewardVotes = activeRewardRound
    ? rewardVotes.filter(
        (item) => item.reward_round_id === activeRewardRound.id,
      )
    : [];
  const activeRewardAwards = activeRewardRound
    ? rewardAwards.filter(
        (item) => item.reward_round_id === activeRewardRound.id,
      )
    : [];
  const activeRewardChallenge = activeRewardRound
    ? challenges.find((item) => item.id === activeRewardRound.challenge_id)
    : undefined;
  const hostRewardVote = session?.host_player_id
    ? activeRewardVotes.find(
        (vote) => vote.voter_player_id === session.host_player_id,
      )
    : undefined;
  const hostRewardVoteTargetId =
    activeRewardRound?.target_kind === "team"
      ? hostRewardVote?.target_team_id
      : hostRewardVote?.target_player_id;
  const rewardTargetRows =
    activeRewardRound?.target_kind === "team"
      ? teams.map((team) => ({
          id: team.id,
          name: team.name,
          detail: `${players.filter((player) => player.team_id === team.id).length} players`,
          score: players
            .filter((player) => player.team_id === team.id)
            .reduce((sum, player) => sum + player.score, 0),
        }))
      : players.map((player) => ({
          id: player.id,
          name: player.name,
          detail:
            teams.find((team) => team.id === player.team_id)?.name ?? "Player",
          score: player.score,
        }));
  const enabledRewardMethods = (
    session?.reward_methods ?? ["voting", "host_awards", "audience_cheers"]
  ).filter((method): method is RewardMethod =>
    ["voting", "host_awards", "audience_cheers"].includes(method),
  );
  const rewardMethodLabel = (method: RewardMethod) =>
    method === "voting"
      ? "Player voting"
      : method === "host_awards"
        ? "Host awards"
        : "Audience cheers";
  const joinUrl = session
    ? `${window.location.origin}${window.location.pathname}#/join?code=${session.join_code}`
    : "";
  const secretReviewOptions = secretAssignments.filter(
    (assignment) =>
      assignment.status === "submitted" ||
      secretReviewAssignments.some(
        (review) =>
          review.assignment_id === assignment.id && review.status === "results",
      ),
  );
  const hasPendingSecretReviews = secretReviewOptions.some(
    (assignment) =>
      !secretReviewAssignments.some(
        (review) =>
          review.assignment_id === assignment.id && review.status === "results",
      ),
  );
  const selectedSecretReviewAssignmentId =
    secretReviewState?.current_assignment_id ??
    secretReviewOptions.find(
      (assignment) =>
        !secretReviewAssignments.some(
          (review) =>
            review.assignment_id === assignment.id &&
            review.status === "results",
        ),
    )?.id ??
    secretReviewOptions[0]?.id ??
    "";
  const selectedSecretReviewAssignment = secretAssignments.find(
    (assignment) => assignment.id === selectedSecretReviewAssignmentId,
  );
  const selectedSecretReview = secretReviewAssignments.find(
    (review) => review.assignment_id === selectedSecretReviewAssignmentId,
  );
  const selectedSecretReviewChallenge = selectedSecretReviewAssignment
    ? challenges.find(
        (challenge) =>
          challenge.id === selectedSecretReviewAssignment.challenge_id,
      )
    : undefined;
  const selectedSecretReviewEvidence = evidence.filter(
    (item) => item.secret_assignment_id === selectedSecretReviewAssignmentId,
  );
  const currentSecretReviewEvidenceId = secretReviewState?.current_evidence_id;
  const currentSecretReviewEvidenceIndex =
    selectedSecretReviewEvidence.findIndex(
      (item) => item.id === currentSecretReviewEvidenceId,
    );
  const currentSecretReviewVoteCount = selectedSecretReviewAssignmentId
    ? secretReviewVotes.filter(
        (vote) => vote.assignment_id === selectedSecretReviewAssignmentId,
      ).length
    : 0;
  const hostSecretReviewVote = session?.host_player_id
    ? secretReviewVotes.find(
        (vote) =>
          vote.assignment_id === selectedSecretReviewAssignmentId &&
          vote.player_id === session.host_player_id,
      )
    : undefined;

  function goToLobbyStep(step: 1 | 2 | 3 | 4 | 5 | 6) {
    setLobbyStep(step);
    localStorage.setItem(`chaos-crawl-host-flow:${sessionId}`, String(step));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function setHostParticipation(participates: boolean): Promise<boolean> {
    if (!session) return false;
    setBusy(true);
    setError("");
    setNotice("");
    const { error: updateError } = await supabase
      .from("cc_game_sessions")
      .update({ host_participates: participates })
      .eq("id", session.id);
    setBusy(false);
    if (updateError) {
      setError(updateError.message);
      return false;
    }
    setHostJoinChoice(participates);
    setSession({ ...session, host_participates: participates });
    if (participates) {
      await openHostPlayerView();
    } else {
      setNotice("You’ll host the game without joining the player list.");
    }
    return true;
  }

  async function openHostPlayerView() {
    if (!session) return;
    setBusy(true);
    setError("");
    setNotice("");
    const { data, error: joinError } = await supabase.rpc(
      "cc_host_join_as_player",
      {
        p_session_id: session.id,
        p_player_name: hostPlayerName.trim() || "Host",
      },
    );
    setBusy(false);
    if (joinError) {
      setError(joinError.message);
      return;
    }
    const result = data as {
      join_code?: string;
      player_token?: string;
      name?: string;
    } | null;
    const joinCode = result?.join_code ?? session.join_code;
    const playerToken = result?.player_token;
    if (!playerToken) {
      setError(
        "The host player profile was created, but no player token was returned. Check the host participation migration.",
      );
      return;
    }
    localStorage.setItem(hostPlayerStorageKey(session.id), playerToken);
    setHostPlayerToken(playerToken);
    localStorage.setItem(
      `chaos-crawl-session-player:${joinCode.replace(/\D/g, "")}`,
      playerToken,
    );
    let avatarUrl: string | null = null;
    if (hostAvatarFile) {
      const extension =
        hostAvatarFile.name
          .split(".")
          .pop()
          ?.replace(/[^a-z0-9]/gi, "") || "jpg";
      const path = `host-avatars/${session.id}/${Date.now()}.${extension}`;
      const { error: avatarUploadError } = await supabase.storage
        .from("game-assets")
        .upload(path, hostAvatarFile, {
          upsert: true,
          contentType: hostAvatarFile.type,
        });
      if (avatarUploadError)
        setError(
          `You joined, but your profile photo couldn't upload: ${avatarUploadError.message}`,
        );
      else
        avatarUrl = supabase.storage.from("game-assets").getPublicUrl(path)
          .data.publicUrl;
    }
    setActiveTab("game");
    setNotice(
      `You're in the game${result?.name ? ` as ${result.name}` : " as Host"}.`,
    );
    await load();
    if (avatarUrl) {
      const { data: refreshedSession } = await supabase
        .from("cc_game_sessions")
        .select("host_player_id")
        .eq("id", session.id)
        .maybeSingle();
      if (refreshedSession?.host_player_id) {
        await supabase
          .from("cc_game_session_players")
          .update({ avatar_url: avatarUrl })
          .eq("id", refreshedSession.host_player_id)
          .eq("session_id", session.id);
        await load();
      }
    }
  }

  async function updatePlayersPerTeam(size: number) {
    if (!session || !Number.isFinite(size)) return;
    setBusy(true);
    setError("");
    setNotice("");
    const { error: sizeError } = await supabase
      .from("cc_game_sessions")
      .update({ team_size: size })
      .eq("id", session.id);
    setBusy(false);
    if (sizeError) {
      setError(sizeError.message);
      return;
    }
    setSession({ ...session, team_size: size });
    setNotice(`Team capacity updated to ${size} players.`);
    await load();
  }

  function startOverrideReasons() {
    const reasons: string[] = [];
    if (autoplayEnabled) reasons.push("You are taking control from autoplay.");
    if (players.length === 0) reasons.push("No players have joined yet.");
    if (session?.teams_enabled && teams.length === 0)
      reasons.push("No teams have been created.");
    if (session?.teams_enabled && unassignedPlayers.length > 0)
      reasons.push(
        `${unassignedPlayers.length} player${unassignedPlayers.length === 1 ? " is" : "s are"} not assigned to a team.`,
      );
    if (session?.host_participates && !session.host_player_id)
      reasons.push(
        "You selected host participation but have not joined as a player.",
      );
    return reasons;
  }

  async function startGame(confirmedOverride = false) {
    if (!session) return;
    if (players.length === 0) {
      setError("At least one player must join before you can start the game.");
      return;
    }
    if (
      session.teams_enabled &&
      (teams.length === 0 || unassignedPlayers.length > 0)
    ) {
      setError(
        "Every player must be assigned to a team before you can start. Assign the remaining players, then try again.",
      );
      return;
    }
    if (!confirmedOverride && startOverrideReasons().length > 0) {
      setOverridePrompt({ kind: "start" });
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    if (
      session.host_participates &&
      !session.host_player_id &&
      confirmedOverride
    ) {
      const { error: participationError } = await supabase
        .from("cc_game_sessions")
        .update({ host_participates: false })
        .eq("id", session.id);
      if (participationError) {
        setBusy(false);
        setError(participationError.message);
        return;
      }
      setSession({ ...session, host_participates: false });
    }
    const { error: startError } = await supabase.rpc(
      "cc_host_start_game_session",
      { p_session_id: session.id },
    );
    setBusy(false);
    if (startError) {
      setError(startError.message);
      return;
    }
    if (autoplayEnabled && confirmedOverride) {
      localStorage.setItem(
        `chaos-crawl-host-autoplay-override:${sessionId}`,
        "1",
      );
      setAutoplayOverridden(true);
    }
    const firstRound =
      mainRounds.find((round) => round.round_number === 1) ?? mainRounds[0];
    if (firstRound) {
      const key = `chaos-crawl-host-round-clock:${session.id}:${firstRound.round_number}`;
      const seconds =
        Math.max(0, Number(firstRound.duration_minutes) || 0) * 60;
      localStorage.setItem(
        key,
        JSON.stringify({
          seconds,
          running: false,
          onBreak: false,
          updatedAt: Date.now(),
        }),
      );
      await saveSharedTimer(
        Number(firstRound.round_number ?? 1),
        seconds,
        false,
        false,
      );
    }
    setNotice(
      confirmedOverride
        ? "Game started with host control. Round 1 is ready; start its timer when everyone is set."
        : "Game started. Players will see Round 1.",
    );
    await load();
  }

  function runStartRoundControl() {
    if (session?.status === "lobby") {
      void startGame();
      return;
    }
    if (!session || !currentChallenge) return;
    const nextRunning = !roundClockRunning;
    const seconds =
      roundClockSeconds > 0
        ? roundClockSeconds
        : hostBreakActive
          ? 0
          : Math.max(0, Number(currentChallenge.duration_minutes) || 0) * 60;
    setRoundClockSeconds(seconds);
    setRoundClockRunning(nextRunning && seconds > 0);
    void saveSharedTimer(
      session.current_round_number,
      seconds,
      nextRunning && seconds > 0,
      hostBreakActive,
      breakResumeRound,
    );
    setNotice(
      nextRunning
        ? hostBreakActive
          ? "Break timer resumed. Players can see the updated resume time."
          : "Round timer started."
        : hostBreakActive
          ? "Break timer paused. Players will see that the break is paused."
          : "Round timer paused.",
    );
  }

  async function startScheduledBreak(
    nextRound: number,
    minutes: number,
    confirmedOverride = false,
  ) {
    if (!session || busy || minutes <= 0) return;
    const seconds = Math.round(minutes * 60);
    breakAdvanceRequested.current = false;
    setHostBreakActive(true);
    setBreakResumeRound(nextRound);
    setRoundClockSeconds(seconds);
    setRoundClockRunning(true);
    setError("");
    setNotice("");
    if (roundClockStorageKey) {
      localStorage.setItem(
        roundClockStorageKey,
        JSON.stringify({
          seconds,
          running: true,
          onBreak: true,
          resumeRound: nextRound,
          updatedAt: Date.now(),
        }),
      );
    }
    await saveSharedTimer(
      session.current_round_number,
      seconds,
      true,
      true,
      nextRound,
    );
    if (confirmedOverride && autoplayEnabled) {
      localStorage.setItem(
        `chaos-crawl-host-autoplay-override:${sessionId}`,
        "1",
      );
      setAutoplayOverridden(true);
    }
    const resumeAt = new Date(Date.now() + seconds * 1000).toLocaleTimeString(
      [],
      { hour: "2-digit", minute: "2-digit" },
    );
    setNotice(
      `Break started for ${minutes} minutes. The next round is scheduled to resume at ${resumeAt}.`,
    );
  }

  function openBreakTimerEditor() {
    setEditBreakMinutes(Math.max(1, Math.ceil(roundClockSeconds / 60)));
    setEditingBreakTimer(true);
  }

  async function saveBreakTimer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session || !hostBreakActive || !breakResumeRound) return;
    const minutes = Number(editBreakMinutes);
    if (!Number.isFinite(minutes) || minutes < 1 || minutes > 240) {
      setError("Break duration must be between 1 and 240 minutes.");
      return;
    }
    const seconds = Math.round(minutes * 60);
    setBusy(true);
    setError("");
    setNotice("");
    const saved = await saveSharedTimer(
      session.current_round_number,
      seconds,
      roundClockRunning,
      true,
      breakResumeRound,
    );
    setBusy(false);
    if (!saved) return;
    setRoundClockSeconds(seconds);
    if (roundClockStorageKey) {
      localStorage.setItem(
        roundClockStorageKey,
        JSON.stringify({
          seconds,
          running: roundClockRunning,
          onBreak: true,
          resumeRound: breakResumeRound,
          updatedAt: Date.now(),
        }),
      );
    }
    setEditingBreakTimer(false);
    setNotice(
      `Break timer updated to ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    );
  }

  function openPointReview() {
    if (!activeRewardRound && currentChallenge) {
      setRewardChallengeId(currentChallenge.id);
      setRewardPoints(currentChallenge.points);
      setShowRewardSetup(true);
    } else {
      setShowRewardSetup(false);
    }
    setShowRewardOverlay(true);
  }

  function skipTimerAndReview() {
    if (roundClockRunning && !hostBreakActive) runStartRoundControl();
    openPointReview();
  }

  function restartRoundTimer() {
    if (!session || !currentChallenge || hostBreakActive) return;
    const seconds =
      Math.max(0, Number(currentChallenge.duration_minutes) || 0) * 60;
    const running = seconds > 0;
    setRoundClockSeconds(seconds);
    setRoundClockRunning(running);
    void saveSharedTimer(session.current_round_number, seconds, running, false);
    setNotice("Round timer restarted.");
  }

  function redoRoundTimer() {
    if (!session || !currentChallenge || hostBreakActive) return;
    const seconds =
      Math.max(0, Number(currentChallenge.duration_minutes) || 0) * 60;
    setRoundClockSeconds(seconds);
    setRoundClockRunning(false);
    if (roundClockStorageKey) {
      localStorage.setItem(
        roundClockStorageKey,
        JSON.stringify({
          seconds,
          running: false,
          onBreak: false,
          updatedAt: Date.now(),
        }),
      );
    }
    void saveSharedTimer(session.current_round_number, seconds, false, false);
    setNotice("Round timer reset. Start it when you’re ready.");
  }

  async function moveToRound(
    nextRound: number,
    confirmedOverride = false,
    forceBreakMinutes = 0,
  ) {
    if (!session || busy) return;
    if (activeRewardRound) {
      setError(
        "Complete or cancel the reward flow before moving to another round.",
      );
      return;
    }
    if (!hostBreakActive && nextRound > session.current_round_number) {
      const breakMinutes =
        forceBreakMinutes || plannedBreakAfter(session.current_round_number);
      if (breakMinutes > 0) {
        await startScheduledBreak(nextRound, breakMinutes, confirmedOverride);
        return;
      }
    }
    setBusy(true);
    setError("");
    setNotice("");
    const { error: roundError } = await supabase.rpc(
      "cc_host_set_game_session_round",
      {
        p_session_id: session.id,
        p_round_number: nextRound,
      },
    );
    setBusy(false);
    if (roundError) {
      setError(roundError.message);
      return;
    }
    if (confirmedOverride && autoplayEnabled) {
      localStorage.setItem(
        `chaos-crawl-host-autoplay-override:${sessionId}`,
        "1",
      );
      setAutoplayOverridden(true);
    }
    const targetRound = mainRounds.find(
      (round) => round.round_number === nextRound,
    );
    const clockKey = `chaos-crawl-host-round-clock:${session.id}:${nextRound}`;
    localStorage.setItem(
      clockKey,
      JSON.stringify({
        seconds: Math.max(0, Number(targetRound?.duration_minutes) || 0) * 60,
        running: false,
        onBreak: false,
        updatedAt: Date.now(),
      }),
    );
    await saveSharedTimer(
      nextRound,
      Math.max(0, Number(targetRound?.duration_minutes) || 0) * 60,
      false,
      false,
      null,
    );
    setHostBreakActive(false);
    setBreakResumeRound(null);
    breakAdvanceRequested.current = false;
    setNotice(
      `Round ${nextRound} is ready. Announce the challenge, then start its timer when everyone is set. Later timings will follow from this change.`,
    );
    await load();
  }

  async function saveSharedTimer(
    roundNumber: number,
    remainingSeconds: number,
    isRunning: boolean,
    isOnBreak: boolean,
    resumeRoundNumber: number | null = null,
  ): Promise<boolean> {
    if (!session) return false;
    const seconds = Math.max(0, Math.floor(remainingSeconds));
    const timerId = session.id;
    const write = sharedTimerWriteQueue.current.then(async () => {
      const { error: timerError } = await supabase
        .from("cc_game_session_timers")
        .upsert(
          {
            session_id: timerId,
            round_number: roundNumber,
            remaining_seconds: seconds,
            is_running: isRunning,
            is_on_break: isOnBreak,
            resume_round_number: isOnBreak ? resumeRoundNumber : null,
            break_ends_at:
              isOnBreak && isRunning
                ? new Date(Date.now() + seconds * 1000).toISOString()
                : null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "session_id" },
        );
      if (timerError) {
        setError(
          `The host timer changed, but players could not receive the timer update: ${timerError.message}`,
        );
        return false;
      }
      return true;
    });
    sharedTimerWriteQueue.current = write.then(
      () => undefined,
      () => undefined,
    );
    return write;
  }

  function requestMoveToRound(nextRound: number) {
    if (autoplayEnabled && !autoplayOverridden) {
      setOverridePrompt({ kind: "round", round: nextRound });
      return;
    }
    void moveToRound(nextRound);
  }

  function requestStartBreak() {
    if (
      !session ||
      session.status !== "live" ||
      session.current_round_number >= mainRounds.length
    )
      return;
    const nextRound = session.current_round_number + 1;
    if (autoplayEnabled && !autoplayOverridden) {
      setOverridePrompt({ kind: "round", round: nextRound, forceBreak: true });
      return;
    }
    void moveToRound(
      nextRound,
      false,
      plannedBreakAfter(session.current_round_number) || 15,
    );
  }

  function confirmHostOverride() {
    const prompt = overridePrompt;
    setOverridePrompt(null);
    if (prompt?.kind === "start") void startGame(true);
    if (prompt?.kind === "round")
      void moveToRound(
        prompt.round,
        true,
        prompt.forceBreak
          ? plannedBreakAfter(session?.current_round_number ?? 0) || 15
          : 0,
      );
  }

  async function finishGame() {
    if (!session) return;
    if (activeRewardRound) {
      setError(
        "Complete or cancel the reward flow and return everyone to the game before finishing.",
      );
      return;
    }
    if (
      !window.confirm(
        "Finish this game? Players will no longer be able to submit challenges.",
      )
    )
      return;
    setBusy(true);
    setError("");
    setNotice("");
    const { error: finishError } = await supabase.rpc(
      "cc_host_complete_game_session",
      { p_session_id: session.id },
    );
    setBusy(false);
    if (finishError) {
      setError(finishError.message);
      return;
    }
    setNotice("Game completed.");
    await load();
  }

  async function startRewardRound(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session || !rewardChallengeId) {
      setError("Choose a challenge to reward.");
      return;
    }
    if (!enabledRewardMethods.includes(rewardMethod)) {
      setError("Choose a reward method enabled in game setup.");
      return;
    }
    if (
      rewardTargetKind === "team" &&
      (!session.teams_enabled || teams.length === 0)
    ) {
      setError("Create teams before rewarding a team.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    const { data, error: startError } = await supabase.rpc(
      "cc_host_start_session_reward_round",
      {
        p_session_id: session.id,
        p_challenge_id: rewardChallengeId,
        p_reward_method: rewardMethod,
        p_target_kind: rewardTargetKind,
        p_points: Math.max(0, Math.min(10000, Number(rewardPoints) || 0)),
      },
    );
    setBusy(false);
    if (startError) {
      setError(startError.message);
      return;
    }
    setShowRewardSetup(false);
    setSelectedRewardWinnerIds([]);
    const method =
      (data as { reward_method?: RewardMethod } | null)?.reward_method ??
      rewardMethod;
    setNotice(
      `${rewardMethodLabel(method)} started. Players' screens have updated.`,
    );
    await load();
  }

  function toggleRewardWinner(id: string) {
    setSelectedRewardWinnerIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  async function castHostRewardVote(candidateId: string) {
    if (
      !session ||
      !activeRewardRound ||
      activeRewardRound.status !== "open" ||
      activeRewardRound.reward_method !== "voting" ||
      busy
    )
      return;
    let playerToken = localStorage.getItem(hostPlayerStorageKey(session.id));
    if (!session.host_participates || !session.host_player_id || !playerToken) {
      const joined = await setHostParticipation(true);
      if (!joined) return;
      playerToken = localStorage.getItem(hostPlayerStorageKey(session.id));
    }
    if (!playerToken) {
      setError(
        "Host participation was enabled, but the host player token is missing. Please rejoin as Host and try again.",
      );
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    const { error: voteError } = await supabase.rpc(
      "cc_player_cast_session_reward_vote",
      {
        p_join_code: session.join_code,
        p_player_token: playerToken,
        p_reward_round_id: activeRewardRound.id,
        p_target_player_id:
          activeRewardRound.target_kind === "player" ? candidateId : null,
        p_target_team_id:
          activeRewardRound.target_kind === "team" ? candidateId : null,
      },
    );
    setBusy(false);
    if (voteError) {
      setError(voteError.message);
      return;
    }
    setNotice("Your host vote has been counted.");
    await load();
  }

  async function completeRewardRound() {
    if (!activeRewardRound || busy) return;
    const manual = activeRewardRound.reward_method !== "voting";
    if (manual && selectedRewardWinnerIds.length === 0) {
      setError("Select at least one winner first.");
      return;
    }
    const confirmText =
      activeRewardRound.reward_method === "voting"
        ? `Close voting and award ${activeRewardRound.points} points to the top vote-getter${activeRewardVotes.length ? "(s)" : ""}? Tied top votes will all win.`
        : `Award ${activeRewardRound.points} points to ${selectedRewardWinnerIds.length} selected winner${selectedRewardWinnerIds.length === 1 ? "" : "s"}?`;
    if (!window.confirm(confirmText)) return;
    setBusy(true);
    setError("");
    setNotice("");
    const { data, error: awardError } = await supabase.rpc(
      "cc_host_complete_session_reward_round",
      {
        p_reward_round_id: activeRewardRound.id,
        p_winner_player_ids:
          activeRewardRound.target_kind === "player"
            ? selectedRewardWinnerIds
            : [],
        p_winner_team_ids:
          activeRewardRound.target_kind === "team"
            ? selectedRewardWinnerIds
            : [],
        p_points:
          activeRewardRound.reward_method === "voting"
            ? null
            : Math.max(0, Math.min(10000, Number(rewardFinalPoints) || 0)),
      },
    );
    setBusy(false);
    if (awardError) {
      setError(awardError.message);
      return;
    }
    const result = data as {
      winner_count?: number;
      points_awarded?: number;
    } | null;
    setNotice(
      `Reward complete. ${result?.winner_count ?? 0} winner${result?.winner_count === 1 ? "" : "s"}; ${result?.points_awarded ?? 0} points awarded. Players can see the updated leaderboard.`,
    );
    setSelectedRewardWinnerIds([]);
    await load();
  }

  async function returnFromRewardRound() {
    if (!activeRewardRound || busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    const { error: releaseError } = await supabase.rpc(
      "cc_host_release_session_reward_round",
      { p_reward_round_id: activeRewardRound.id },
    );
    setBusy(false);
    if (releaseError) {
      setError(releaseError.message);
      return;
    }
    setNotice("Everyone has been returned to the game.");
    setShowRewardOverlay(false);
    await load();
  }

  async function cancelRewardRound() {
    if (
      !activeRewardRound ||
      busy ||
      !window.confirm(
        "Cancel this reward flow and return everyone to the game without awarding points?",
      )
    )
      return;
    setBusy(true);
    setError("");
    setNotice("");
    const { error: cancelError } = await supabase.rpc(
      "cc_host_cancel_session_reward_round",
      { p_reward_round_id: activeRewardRound.id },
    );
    setBusy(false);
    if (cancelError) {
      setError(cancelError.message);
      return;
    }
    setNotice("Reward flow cancelled. No points were awarded.");
    setShowRewardOverlay(false);
    await load();
  }

  async function copyCode() {
    if (!session) return;
    try {
      await navigator.clipboard.writeText(session.join_code);
      setNotice("Join code copied.");
    } catch {
      setNotice(`Join code: ${session.join_code}`);
    }
  }

  async function createTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = teamName.trim();
    if (!session || !cleanName) return;
    setBusy(true);
    setError("");
    setNotice("");
    const { error: createError } = await supabase
      .from("cc_game_session_teams")
      .insert({ session_id: session.id, name: cleanName });
    setBusy(false);
    if (createError) {
      setError(
        createError.message.includes("unique")
          ? "That team name is already used in this game."
          : createError.message,
      );
      return;
    }
    setTeamName("");
    setNotice(`Team "${cleanName}" created.`);
    await load();
  }

  async function renameTeam(team: SessionTeam) {
    const name = (teamNameEdits[team.id] ?? team.name).trim();
    if (!session || !name || name === team.name) return;
    setBusy(true);
    setError("");
    setNotice("");
    const { error: renameError } = await supabase
      .from("cc_game_session_teams")
      .update({ name })
      .eq("id", team.id)
      .eq("session_id", session.id);
    setBusy(false);
    if (renameError) {
      setError(renameError.message);
      return;
    }
    setNotice(`Team renamed to ${name}.`);
    await load();
  }

  async function uploadTeamPhoto(team: SessionTeam, file: File) {
    if (!session?.host_game_id) {
      setError(
        "This game is not linked to a saved plan, so team photos cannot be saved.",
      );
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    const extension =
      file.name
        .split(".")
        .pop()
        ?.replace(/[^a-z0-9]/gi, "") || "jpg";
    const path = `team-photos/${session.id}/${team.id}-${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("game-assets")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) {
      setBusy(false);
      setError(uploadError.message);
      return;
    }
    const url = supabase.storage.from("game-assets").getPublicUrl(path)
      .data.publicUrl;
    const { data: gameData, error: gameError } = await supabase
      .from("host_games")
      .select("plan_data")
      .eq("id", session.host_game_id)
      .eq("host_id", session.host_id)
      .maybeSingle();
    if (gameError) {
      setBusy(false);
      setError(gameError.message);
      return;
    }
    const planData = (gameData?.plan_data ?? {}) as Record<string, unknown>;
    const previousPhotos = (planData.teamPhotoUrls ?? {}) as Record<
      string,
      string
    >;
    const { error: saveError } = await supabase
      .from("host_games")
      .update({
        plan_data: {
          ...planData,
          teamPhotoUrls: { ...previousPhotos, [team.id]: url },
        },
      })
      .eq("id", session.host_game_id)
      .eq("host_id", session.host_id);
    setBusy(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    setTeamPhotoUrls((photos) => ({ ...photos, [team.id]: url }));
    setNotice(`Photo saved for ${team.name}.`);
  }

  async function assignTeam(player: SessionPlayer, teamId: string) {
    if (!session) return;
    if (teamId) {
      const count = players.filter(
        (person) => person.team_id === teamId && person.id !== player.id,
      ).length;
      if (count >= session.team_size) {
        setError(
          "That team is full. Increase team size in the game plan or choose another team.",
        );
        return;
      }
    }
    setBusy(true);
    setError("");
    setNotice("");
    const { error: assignError } = await supabase
      .from("cc_game_session_players")
      .update({ team_id: teamId || null })
      .eq("id", player.id)
      .eq("session_id", session.id);
    setBusy(false);
    if (assignError) {
      setError(assignError.message);
      return;
    }
    await load();
  }

  async function reviewSubmission(
    submission: SessionSubmission,
    approve: boolean,
  ) {
    const challenge = challenges.find(
      (item) => item.id === submission.challenge_id,
    );
    if (challenge?.kind === "side") {
      setError("Side-challenge submissions are approved automatically.");
      return;
    }
    const suggested = Number(challenge?.points ?? 0);
    const points = approve
      ? Number(
          window.prompt(
            `Points to award (suggested: ${suggested})`,
            String(suggested),
          ) ?? "-1",
        )
      : 0;
    if (approve && (!Number.isFinite(points) || points < 0)) return;
    setBusy(true);
    setError("");
    setNotice("");
    const { error: reviewError } = await supabase.rpc(
      "cc_host_review_session_submission",
      {
        p_submission_id: submission.id,
        p_approve: approve,
        p_points: points,
      },
    );
    setBusy(false);
    if (reviewError) {
      setError(reviewError.message);
      return;
    }
    setNotice(
      !approve
        ? "Submission rejected."
        : `Approved submission for ${points} points.`,
    );
    await load();
  }

  function evidenceUrl(path: string) {
    return supabase.storage.from("session-evidence").getPublicUrl(path).data
      .publicUrl;
  }

  function evidenceForChallenge(playerId: string, challengeId: string) {
    return evidence.filter(
      (item) =>
        item.player_id === playerId &&
        item.challenge_id === challengeId &&
        item.secret_assignment_id === null,
    );
  }

  function evidenceForAssignment(assignmentId: string) {
    return evidence.filter(
      (item) => item.secret_assignment_id === assignmentId,
    );
  }

  async function setFinalGallery(galleryOpen: boolean, votingOpen: boolean) {
    if (!session) return;
    const closingVote = session.final_voting_open && !votingOpen;
    setBusy(true);
    setError("");
    setNotice("");
    const { data: galleryResult, error: galleryError } = await supabase.rpc(
      "cc_host_manage_session_final_round",
      {
        p_session_id: session.id,
        p_gallery_open: galleryOpen,
        p_voting_open: votingOpen,
      },
    );
    setBusy(false);
    if (galleryError) {
      setError(galleryError.message);
      return;
    }
    if (closingVote) {
      const votesCast = Number(
        (galleryResult as { votes_cast?: number } | null)?.votes_cast ?? 0,
      );
      setNotice(
        `Voting closed with ${votesCast} vote${votesCast === 1 ? "" : "s"}. Results and the updated leaderboard are now visible.`,
      );
    } else {
      setNotice(
        galleryOpen
          ? votingOpen
            ? "Voting is open for the selected side challenge."
            : "The current challenge results are visible."
          : "Final gallery hidden from players.",
      );
    }
    await load();
  }

  async function advanceFinalChallenge() {
    if (!session) return;
    if (nextReviewedFinalChallenge && !nextPendingFinalChallenge) {
      await reopenFinalChallengeVoting(nextReviewedFinalChallenge.id);
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    const { error: advanceError } = await supabase.rpc(
      "cc_host_advance_session_final_round_challenge",
      {
        p_session_id: session.id,
      },
    );
    setBusy(false);
    if (advanceError) {
      setError(advanceError.message);
      return;
    }
    setNotice(
      "The next challenge is open for voting, and the TV slideshow has switched to its submissions.",
    );
    await load();
  }

  async function reopenFinalChallengeVoting(
    challengeId = selectedFinalChallenge?.id,
  ) {
    const challenge = challenges.find((item) => item.id === challengeId);
    if (!session || !challenge || busy) return;
    const confirmed = window.confirm(
      `Reopen voting for "${challenge.title}"? This clears its votes and reverses the bonus points awarded for this challenge.`,
    );
    if (!confirmed) return;
    setBusy(true);
    setError("");
    setNotice("");
    const { error: reopenError } = await supabase.rpc(
      "cc_host_reopen_session_final_round_challenge",
      {
        p_session_id: session.id,
        p_challenge_id: challenge.id,
      },
    );
    setBusy(false);
    if (reopenError) {
      setError(reopenError.message);
      return;
    }
    setNotice("Voting reopened with previous votes cleared.");
    await load();
  }

  async function selectFinalChallenge(challengeId: string) {
    if (!session || busy) return;
    const firstItem = finalSideEvidence.find(
      (item) => item.challenge_id === challengeId,
    );
    setBusy(true);
    setError("");
    setNotice("");
    const { error: selectError } = await supabase.rpc(
      "cc_host_select_session_final_round_challenge",
      {
        p_session_id: session.id,
        p_challenge_id: challengeId,
        p_evidence_id: firstItem?.id ?? null,
      },
    );
    setBusy(false);
    if (selectError) {
      setError(selectError.message);
      return;
    }
    await load();
  }

  async function setFinalSlideshow(
    challengeId: string,
    evidenceId: string | null,
  ) {
    if (!session || !challengeId) return;
    setBusy(true);
    setError("");
    setNotice("");
    const { error: slideshowError } = await supabase.rpc(
      "cc_host_set_session_final_slideshow",
      {
        p_session_id: session.id,
        p_challenge_id: challengeId,
        p_evidence_id: evidenceId,
      },
    );
    setBusy(false);
    if (slideshowError) {
      setError(slideshowError.message);
      return;
    }
    await load();
  }

  async function castFinalSlideshow() {
    if (!session || !selectedFinalEvidence || finalSlideshowConnection.current)
      return;
    const requestConstructor = (
      window as Window & {
        PresentationRequest?: PresentationRequestConstructor;
      }
    ).PresentationRequest;
    if (!requestConstructor) {
      setError(
        "This browser can't open a TV device picker. Use Chrome's Cast tab option or AirPlay screen mirroring instead.",
      );
      return;
    }

    const url = `${window.location.origin}${window.location.pathname}#/final-slideshow/${session.id}`;
    setError("");
    setNotice("");
    try {
      const connection = await new requestConstructor([url]).start();
      finalSlideshowConnection.current = connection;
      setIsFinalSlideshowConnected(connection.state === "connected");
      connection.addEventListener("statechange", () => {
        const connected = connection.state === "connected";
        setIsFinalSlideshowConnected(connected);
        if (!connected && finalSlideshowConnection.current === connection) {
          finalSlideshowConnection.current = null;
        }
      });
    } catch (castError) {
      if (castError instanceof DOMException && castError.name === "AbortError")
        return;
      setError(
        castError instanceof Error
          ? `Couldn't cast the slideshow: ${castError.message}`
          : "Couldn't cast the slideshow.",
      );
    }
  }

  function disconnectFinalSlideshow() {
    finalSlideshowConnection.current?.close();
    finalSlideshowConnection.current = null;
    setIsFinalSlideshowConnected(false);
  }

  async function castHostFinalVote(evidenceId: string) {
    if (!session || selectedFinalChallengeStatus !== "voting" || busy) return;
    let playerToken = localStorage.getItem(hostPlayerStorageKey(session.id));
    if (!session.host_participates || !session.host_player_id || !playerToken) {
      const joined = await setHostParticipation(true);
      if (!joined) return;
      setActiveTab("final-round");
      playerToken = localStorage.getItem(hostPlayerStorageKey(session.id));
    }
    if (!playerToken) {
      setError(
        "Host participation was enabled, but the host player token is missing. Please rejoin as Host and try again.",
      );
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    const { error: voteError } = await supabase.rpc(
      "cc_player_cast_session_final_round_vote",
      {
        p_join_code: session.join_code,
        p_player_token: playerToken,
        p_evidence_id: evidenceId,
      },
    );
    setBusy(false);
    if (voteError) {
      setError(voteError.message);
      return;
    }
    setNotice("Your vote has been counted.");
    await load();
  }

  async function openHostSideChallengeUpload(challenge: SessionChallenge) {
    if (!session || session.status !== "live") return;
    if (
      !session.host_participates ||
      !localStorage.getItem(hostPlayerStorageKey(session.id))
    ) {
      await setHostParticipation(true);
    }
    if (!localStorage.getItem(hostPlayerStorageKey(session.id))) return;
    setFocusedHostChallenge(challenge.id);
    setActiveTab("side-challenges");
  }

  function openBreakChallengeEditor(challenge: SessionChallenge) {
    setEditingBreakChallenge(challenge);
    setEditChallengeTitle(challenge.title);
    setEditChallengeDescription(challenge.description);
    setEditChallengeEquipment((nextBreakTask?.equipment ?? []).join(", "));
    setEditChallengeDuration(Math.max(1, challenge.duration_minutes || 15));
    setEditChallengePoints(Math.max(0, challenge.points || 0));
    setEditChallengeEvidence(challenge.allow_photo_upload);
  }

  async function saveBreakChallengeEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session || !editingBreakChallenge || !editChallengeTitle.trim())
      return;
    setBusy(true);
    setError("");
    setNotice("");
    const equipment = editChallengeEquipment
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const { error: challengeError } = await supabase
      .from("cc_game_session_challenges")
      .update({
        title: editChallengeTitle.trim(),
        description: editChallengeDescription.trim(),
        duration_minutes: Math.max(1, Number(editChallengeDuration) || 1),
        points: Math.max(0, Number(editChallengePoints) || 0),
        allow_photo_upload: editChallengeEvidence,
      })
      .eq("id", editingBreakChallenge.id)
      .eq("session_id", session.id);
    if (challengeError) {
      setBusy(false);
      setError(`Couldn't update this challenge: ${challengeError.message}`);
      return;
    }
    let saveNotice = `Round ${editingBreakChallenge.round_number} updated.`;
    if (session.host_game_id && nextBreakTask?.id) {
      const { data: gameData } = await supabase
        .from("host_games")
        .select("plan_data")
        .eq("id", session.host_game_id)
        .maybeSingle();
      const planData = (gameData?.plan_data ?? {}) as Record<string, unknown>;
      const selectedTasks = Array.isArray(planData.selectedTasks)
        ? (planData.selectedTasks as PlannedTaskInfo[])
        : [];
      const updatedTasks = selectedTasks.map((task) =>
        task.id === nextBreakTask.id
          ? {
              ...task,
              title: editChallengeTitle.trim(),
              description: editChallengeDescription.trim(),
              minutes: Math.max(1, Number(editChallengeDuration) || 1),
              points: Math.max(0, Number(editChallengePoints) || 0),
              equipment,
            }
          : task,
      );
      const { error: planError } = await supabase
        .from("host_games")
        .update({ plan_data: { ...planData, selectedTasks: updatedTasks } })
        .eq("id", session.host_game_id)
        .eq("host_id", session.host_id);
      if (planError)
        saveNotice =
          "Challenge updated for this game. Its saved plan equipment could not be updated.";
      else setPlannedTasks(updatedTasks);
    }
    setBusy(false);
    setNotice(saveNotice);
    setEditingBreakChallenge(null);
    await load();
  }

  async function createSecretChallenge(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session || !newSecretTitle.trim()) return;
    setBusy(true);
    setError("");
    setNotice("");
    const nextSortOrder =
      Math.max(0, ...challenges.map((item) => Number(item.sort_order ?? 0))) +
      1;
    const { data, error: createError } = await supabase
      .from("cc_game_session_challenges")
      .insert({
        session_id: session.id,
        kind: "secret",
        round_number: null,
        title: newSecretTitle.trim(),
        description: newSecretDescription.trim(),
        points: Math.max(0, Number(newSecretPoints) || 0),
        duration_minutes: 10,
        sort_order: nextSortOrder,
        allow_photo_upload: newSecretEvidenceRequired,
      })
      .select("id")
      .single();
    setBusy(false);
    if (createError || !data) {
      setError(createError?.message ?? "Couldn't add that secret mission.");
      return;
    }
    setNewSecretTitle("");
    setNewSecretDescription("");
    setNewSecretPoints(10);
    setNewSecretEvidenceRequired(false);
    setSelectedSecretChallengeId(data.id);
    setNotice(
      "Secret mission added. Choose a player and send it now or schedule it.",
    );
    await load();
  }

  async function assignSecretMission(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session || !selectedSecretPlayerId || !selectedSecretChallengeId) {
      setError("Choose one player and one secret mission.");
      return;
    }
    if (session.status === "completed") {
      setError("This game has finished.");
      return;
    }
    let scheduledAt: string;
    if (secretScheduleAt) {
      const when = new Date(secretScheduleAt);
      if (Number.isNaN(when.getTime())) {
        setError("Choose a valid delivery date and time.");
        return;
      }
      scheduledAt = when.toISOString();
    } else {
      scheduledAt = new Date().toISOString();
    }
    const targetPlayer = players.find(
      (item) => item.id === selectedSecretPlayerId,
    );
    setBusy(true);
    setError("");
    setNotice("");
    const { error: assignError } = await supabase.rpc(
      "cc_host_assign_secret_mission",
      {
        p_session_id: session.id,
        p_player_id: selectedSecretPlayerId,
        p_challenge_id: selectedSecretChallengeId,
        p_scheduled_at: scheduledAt,
      },
    );
    setBusy(false);
    if (assignError) {
      setError(assignError.message);
      return;
    }
    setSecretScheduleAt("");
    const isFuture =
      new Date(scheduledAt).getTime() > Date.now() && session.status === "live";
    setNotice(
      isFuture
        ? `Secret mission scheduled for ${targetPlayer?.name ?? "the player"} at ${new Date(scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`
        : `Secret mission ${session.status === "live" ? "sent" : "queued for the start of the game"} to ${targetPlayer?.name ?? "the player"}.`,
    );
    await load();
  }

  async function selectSecretReviewAssignment(assignmentId: string) {
    if (!session || busy) return;
    const firstEvidence = evidence.find(
      (item) => item.secret_assignment_id === assignmentId,
    );
    setBusy(true);
    setError("");
    setNotice("");
    const { error: selectError } = await supabase.rpc(
      "cc_host_select_secret_review_assignment",
      {
        p_session_id: session.id,
        p_assignment_id: assignmentId,
        p_evidence_id: firstEvidence?.id ?? null,
      },
    );
    setBusy(false);
    if (selectError) {
      setError(selectError.message);
      return;
    }
    await load();
  }

  async function openSecretReviewVote(assignmentId: string) {
    if (!session || busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    const { error: openError } = await supabase.rpc(
      "cc_host_open_secret_review",
      {
        p_session_id: session.id,
        p_assignment_id: assignmentId,
      },
    );
    setBusy(false);
    if (openError) {
      setError(openError.message);
      return;
    }
    setNotice("Secret mission voting is open.");
    await load();
  }

  async function reopenSecretReviewVote(assignmentId: string) {
    if (!session || busy) return;
    const assignment = secretAssignments.find(
      (item) => item.id === assignmentId,
    );
    const challenge =
      assignment &&
      challenges.find((item) => item.id === assignment.challenge_id);
    if (
      !window.confirm(
        `Reopen "${challenge?.title ?? "this secret mission"}"? This clears its votes and reverses its awarded points.`,
      )
    )
      return;
    setBusy(true);
    setError("");
    setNotice("");
    const { error: reopenError } = await supabase.rpc(
      "cc_host_reopen_secret_review",
      {
        p_session_id: session.id,
        p_assignment_id: assignmentId,
      },
    );
    setBusy(false);
    if (reopenError) {
      setError(reopenError.message);
      return;
    }
    setNotice(
      "Secret mission voting reopened with its previous votes cleared.",
    );
    await load();
  }

  async function closeSecretReviewVote() {
    if (!session || busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    const { data, error: closeError } = await supabase.rpc(
      "cc_host_close_secret_review_vote",
      {
        p_session_id: session.id,
      },
    );
    setBusy(false);
    if (closeError) {
      setError(closeError.message);
      return;
    }
    const result = data as {
      outcome?: "success" | "fail";
      points_awarded?: number;
    } | null;
    setNotice(
      result?.outcome === "success"
        ? `Mission success confirmed · ${result.points_awarded ?? 0} points awarded.`
        : "Mission failed · no points awarded.",
    );
    await load();
  }

  async function advanceSecretReview() {
    if (!session || busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    const { data, error: advanceError } = await supabase.rpc(
      "cc_host_advance_secret_review",
      {
        p_session_id: session.id,
      },
    );
    setBusy(false);
    if (advanceError) {
      setError(advanceError.message);
      return;
    }
    const result = data as { completed?: boolean } | null;
    setNotice(
      result?.completed
        ? "All submitted secret missions have been reviewed."
        : "The next secret mission is open for voting, and the TV slideshow has switched to its evidence.",
    );
    await load();
  }

  async function castHostSecretReviewVote(vote: "success" | "fail") {
    if (
      !session ||
      !secretReviewState?.current_assignment_id ||
      !secretReviewState.voting_open ||
      busy
    )
      return;
    let playerToken = localStorage.getItem(hostPlayerStorageKey(session.id));
    if (!session.host_participates || !session.host_player_id || !playerToken) {
      const joined = await setHostParticipation(true);
      if (!joined) return;
      setActiveTab("side-challenges");
      playerToken = localStorage.getItem(hostPlayerStorageKey(session.id));
    }
    if (!playerToken) {
      setError(
        "Host participation was enabled, but the host player token is missing. Please rejoin as Host and try again.",
      );
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    const { error: voteError } = await supabase.rpc(
      "cc_player_cast_secret_review_vote",
      {
        p_join_code: session.join_code,
        p_player_token: playerToken,
        p_assignment_id: secretReviewState.current_assignment_id,
        p_vote: vote,
      },
    );
    setBusy(false);
    if (voteError) {
      setError(voteError.message);
      return;
    }
    setNotice(`Your host vote for ${vote} has been counted.`);
    await load();
  }

  async function setSecretReviewEvidence(evidenceId: string | null) {
    if (!session || busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    const { error: slideshowError } = await supabase.rpc(
      "cc_host_set_secret_review_evidence",
      {
        p_session_id: session.id,
        p_evidence_id: evidenceId,
      },
    );
    setBusy(false);
    if (slideshowError) {
      setError(slideshowError.message);
      return;
    }
    await load();
  }

  async function castSecretReviewSlideshow() {
    if (!session || secretSlideshowConnection.current) return;
    const requestConstructor = (
      window as Window & {
        PresentationRequest?: PresentationRequestConstructor;
      }
    ).PresentationRequest;
    if (!requestConstructor) {
      setError(
        "This browser can't open a TV device picker. Use Chrome's Cast tab option or AirPlay screen mirroring instead.",
      );
      return;
    }
    const url = `${window.location.origin}${window.location.pathname}#/secret-slideshow/${session.id}`;
    setError("");
    setNotice("");
    try {
      const connection = await new requestConstructor([url]).start();
      secretSlideshowConnection.current = connection;
      setIsSecretSlideshowConnected(connection.state === "connected");
      connection.addEventListener("statechange", () => {
        const connected = connection.state === "connected";
        setIsSecretSlideshowConnected(connected);
        if (!connected && secretSlideshowConnection.current === connection)
          secretSlideshowConnection.current = null;
      });
    } catch (castError) {
      if (castError instanceof DOMException && castError.name === "AbortError")
        return;
      setError(
        castError instanceof Error
          ? `Couldn't cast the secret mission slideshow: ${castError.message}`
          : "Couldn't cast the secret mission slideshow.",
      );
    }
  }

  function disconnectSecretReviewSlideshow() {
    secretSlideshowConnection.current?.close();
    secretSlideshowConnection.current = null;
    setIsSecretSlideshowConnected(false);
  }

  const playerById = new Map(players.map((player) => [player.id, player]));
  const hostPlayer = session?.host_player_id
    ? playerById.get(session.host_player_id)
    : undefined;
  const rankedPlayers = [...players].sort(
    (a, b) => b.score - a.score || a.name.localeCompare(b.name),
  );
  const headerPlayer = hostPlayer ?? rankedPlayers[0];
  const headerRank = headerPlayer
    ? rankedPlayers.findIndex((player) => player.id === headerPlayer.id) + 1
    : null;
  const challengeById = new Map(
    challenges.map((challenge) => [challenge.id, challenge]),
  );
  const sideSubmissions = submissions.filter(
    (item) => challengeById.get(item.challenge_id)?.kind === "side",
  );
  const teamById = new Map(teams.map((team) => [team.id, team]));
  const finalSideEvidence = evidence
    .filter((item) => {
      if (
        item.secret_assignment_id ||
        challengeById.get(item.challenge_id)?.kind !== "side"
      )
        return false;
      return submissions.some(
        (submission) =>
          submission.player_id === item.player_id &&
          submission.challenge_id === item.challenge_id &&
          (submission.status === "submitted" ||
            submission.status === "approved"),
      );
    })
    .sort(
      (a, b) =>
        a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id),
    );
  const selectedFinalChallengeId =
    finalRoundState?.slideshow_challenge_id ?? sideChallenges[0]?.id ?? "";
  const selectedFinalChallengeState = finalRoundChallenges.find(
    (item) => item.challenge_id === selectedFinalChallengeId,
  );
  const selectedFinalChallengeStatus =
    selectedFinalChallengeState?.status ?? "pending";
  const selectedFinalChallenge = challengeById.get(selectedFinalChallengeId);
  const selectedFinalChallengeEvidence = finalSideEvidence.filter(
    (item) => item.challenge_id === selectedFinalChallengeId,
  );
  const selectedFinalEvidenceIndex = Math.max(
    0,
    selectedFinalChallengeEvidence.findIndex(
      (item) => item.id === finalRoundState?.slideshow_evidence_id,
    ),
  );
  const selectedFinalEvidence =
    selectedFinalChallengeEvidence[selectedFinalEvidenceIndex] ??
    selectedFinalChallengeEvidence[0] ??
    null;
  const selectedFinalChallengeVotes = finalVotes.filter(
    (item) => item.challenge_id === selectedFinalChallengeId,
  );
  const finalVoteCountByEvidence = new Map<string, number>();
  for (const vote of selectedFinalChallengeVotes) {
    finalVoteCountByEvidence.set(
      vote.evidence_id,
      (finalVoteCountByEvidence.get(vote.evidence_id) ?? 0) + 1,
    );
  }
  const finalTopVoteCount = Math.max(0, ...finalVoteCountByEvidence.values());
  const finalWinningEvidenceIds = new Set(
    [...finalVoteCountByEvidence.entries()]
      .filter(
        ([, voteCount]) =>
          finalTopVoteCount > 0 && voteCount === finalTopVoteCount,
      )
      .map(([evidenceId]) => evidenceId),
  );
  const currentFinalSortOrder =
    selectedFinalChallenge?.sort_order ?? Number.NEGATIVE_INFINITY;
  const pendingFinalChallengesInOrder = sideChallenges
    .filter((challenge) =>
      finalRoundChallenges.some(
        (state) =>
          state.challenge_id === challenge.id && state.status === "pending",
      ),
    )
    .sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id));
  const nextPendingFinalChallenge =
    pendingFinalChallengesInOrder.find(
      (challenge) =>
        challenge.id !== selectedFinalChallengeId &&
        challenge.sort_order > currentFinalSortOrder,
    ) ??
    pendingFinalChallengesInOrder.find(
      (challenge) => challenge.id !== selectedFinalChallengeId,
    );
  const reviewedFinalChallengesInOrder = sideChallenges
    .filter(
      (challenge) =>
        challenge.id !== selectedFinalChallengeId &&
        finalRoundChallenges.some(
          (state) =>
            state.challenge_id === challenge.id && state.status === "results",
        ),
    )
    .sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id));
  const nextReviewedFinalChallenge =
    reviewedFinalChallengesInOrder.find(
      (challenge) => challenge.sort_order > currentFinalSortOrder,
    ) ?? reviewedFinalChallengesInOrder[0];

  if (loading) {
    return (
      <SessionPage viewerRole="host">
        <SessionState title="Loading your game session…" />
      </SessionPage>
    );
  }
  if (!session) {
    return (
      <SessionPage viewerRole="host">
        <SessionState
          title="Could not load this game session"
          action={
            <Link className="btn" to="/host">
              Back to Host Hub
            </Link>
          }
        >
          {error && <SessionFeedback message={error} />}
        </SessionState>
      </SessionPage>
    );
  }

  const lobbyFlow = (
    <section
      className="cc-host-lobby-flow"
      aria-label={`Game setup step ${lobbyStep} of 6`}
    >
      <header className="cc-host-lobby-step-heading">
        <span>STEP {lobbyStep} OF 6</span>
        <div className="cc-host-lobby-progress">
          <i style={{ width: `${(lobbyStep / 6) * 100}%` }} />
        </div>
        <h1>
          {
            (
              [
                "Share the invite",
                "Join your game",
                "Players & teams",
                "Choose your teams",
                "Name your teams",
                "Ready to start",
              ] as const
            )[lobbyStep - 1]
          }
        </h1>
        <p>
          {
            (
              [
                "Share the game link, code or QR so players can join.",
                "Decide whether you’d like to play alongside everyone.",
                "See who has joined and set the team capacity.",
                "Move players into teams and check who is ready.",
                "Give each team a name and picture.",
                "Gather everyone, explain the rules and start the game.",
              ] as const
            )[lobbyStep - 1]
          }
        </p>
      </header>

      {lobbyStep === 1 && (
        <div className="cc-host-lobby-card cc-host-invite-step">
          <div className="cc-host-lobby-game-mark">
            {gamePhotoUrl ? (
              <img src={gamePhotoUrl} alt="" />
            ) : (
              <span aria-hidden="true">🎉</span>
            )}
          </div>
          <h2>{session.name}</h2>
          <p>Share this link with your players to join the game.</p>
          <a
            className="cc-host-invite-link"
            href={joinUrl}
            target="_blank"
            rel="noreferrer"
          >
            {joinUrl}
            <span>↗</span>
          </a>
          <div className="cc-host-invite-code-row">
            <span>
              GAME CODE <strong>{session.join_code}</strong>
            </span>
            <button type="button" onClick={() => void copyCode()}>
              <Icon name="clipboard" className="icon--size-16" /> Copy code
            </button>
          </div>
          <div className="cc-host-invite-qr">
            <QRCodeSVG value={joinUrl} size={190} level="M" marginSize={3} />
          </div>
          <strong className="cc-host-joined-count">
            {players.length} player{players.length === 1 ? "" : "s"} joined so
            far
          </strong>
        </div>
      )}

      {lobbyStep === 2 && (
        <div className="cc-host-lobby-card cc-host-join-step">
          <div className="cc-host-lobby-game-mark">
            {gamePhotoUrl ? (
              <img src={gamePhotoUrl} alt="" />
            ) : (
              <span aria-hidden="true">🎉</span>
            )}
          </div>
          <h2>{session.name}</h2>
          <h3>Would you like to join the game?</h3>
          <p>
            Join the player list, choose a team and play along. You can still
            use every host control.
          </p>
          <label className="cc-host-avatar-upload">
            <span className="cc-host-avatar-preview">
              {hostAvatarPreview ? (
                <img src={hostAvatarPreview} alt="Profile preview" />
              ) : (
                <Icon name="users" className="icon--size-27" />
              )}
            </span>
            <span>
              <strong>Upload a profile picture</strong>
              <small>Optional · JPG, PNG or WebP</small>
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setHostAvatarFile(file);
                setHostAvatarPreview(file ? URL.createObjectURL(file) : "");
              }}
            />
          </label>
          <div className="cc-host-lobby-choice-row">
            <button
              type="button"
              className={`cc-host-lobby-choice${hostJoinChoice === true ? " is-selected" : ""}`}
              disabled={busy}
              onClick={() => void setHostParticipation(true)}
            >
              {busy ? (
                <Icon name="loader-circle" className="icon--size-16 cc-spin" />
              ) : (
                <Icon name="gamepad2" className="icon--size-16" />
              )}{" "}
              Yes, I’ll play
            </button>
            <button
              type="button"
              className={`cc-host-lobby-choice${hostJoinChoice === false ? " is-selected" : ""}`}
              disabled={busy}
              onClick={() => void setHostParticipation(false)}
            >
              <Icon name="shield" className="icon--size-16" /> No, I’ll host
            </button>
          </div>
          {hostPlayer && (
            <p className="cc-host-lobby-confirmation">
              You’re in as <strong>{hostPlayer.name}</strong>.
            </p>
          )}
        </div>
      )}

      {lobbyStep === 3 && (
        <div className="cc-host-lobby-card cc-host-roster-step">
          <div className="cc-host-lobby-counts">
            <div>
              <strong>{players.length}</strong>
              <span>Players joined</span>
            </div>
            <div>
              <strong>{session.teams_enabled ? teams.length : 0}</strong>
              <span>Teams ready</span>
            </div>
          </div>
          <div className="cc-host-lobby-player-list">
            {players.length ? (
              players.map((player) => (
                <div className="cc-host-lobby-player-row" key={player.id}>
                  <span className="cc-host-lobby-player-avatar">
                    {player.avatar_url ? (
                      <img src={player.avatar_url} alt="" />
                    ) : (
                      player.name.slice(0, 1).toUpperCase()
                    )}
                  </span>
                  <strong>
                    {player.name}
                    {player.id === hostPlayer?.id ? " (You)" : ""}
                  </strong>
                  <span>
                    {session.teams_enabled
                      ? (teamById.get(player.team_id ?? "")?.name ??
                        "Not in a team")
                      : "Ready"}
                  </span>
                </div>
              ))
            ) : (
              <p className="cc-host-lobby-empty">
                Players will appear here as they join using your code or link.
              </p>
            )}
          </div>
          {session.teams_enabled ? (
            <label className="cc-host-team-size-field">
              <span>Players per team</span>
              <select
                value={session.team_size}
                disabled={busy}
                onChange={(event) =>
                  void updatePlayersPerTeam(Number(event.target.value))
                }
              >
                {[...new Set([session.team_size, 2, 3, 4, 5, 6, 8, 10, 12])]
                  .sort((a, b) => a - b)
                  .map((size) => (
                    <option key={size} value={size}>
                      {size} players
                    </option>
                  ))}
              </select>
            </label>
          ) : (
            <p className="cc-host-lobby-note">
              This game is set up for individual players.
            </p>
          )}
        </div>
      )}

      {lobbyStep === 4 && (
        <div className="cc-host-lobby-card cc-host-team-select-step">
          {!session.teams_enabled ? (
            <>
              <h2>Playing solo</h2>
              <p>
                Teams are turned off for this game. Continue to the waiting
                screen when everyone is ready.
              </p>
            </>
          ) : (
            <>
              <div className="cc-host-lobby-counts">
                <div>
                  <strong>{players.length}</strong>
                  <span>Players joined</span>
                </div>
                <div>
                  <strong>
                    {readyTeamsCount}/{teams.length}
                  </strong>
                  <span>Teams with players</span>
                </div>
              </div>
              <label className="cc-host-player-picker">
                <span>Choose a player to move</span>
                <select
                  value={selectedLobbyPlayerId}
                  onChange={(event) =>
                    setSelectedLobbyPlayerId(event.target.value)
                  }
                >
                  <option value="">Select a player…</option>
                  {players.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.name}
                      {player.team_id
                        ? ` · ${teamById.get(player.team_id)?.name ?? "In a team"}`
                        : " · Unassigned"}
                    </option>
                  ))}
                </select>
              </label>
              <div
                className="cc-host-unassigned-tray"
                aria-label="Players not yet in a team"
              >
                {unassignedPlayers.map((player) => (
                  <button
                    type="button"
                    className={`cc-host-unassigned-player${player.id === selectedLobbyPlayerId ? " is-selected" : ""}`}
                    key={player.id}
                    onClick={() => setSelectedLobbyPlayerId(player.id)}
                  >
                    <span>
                      {player.avatar_url ? (
                        <img src={player.avatar_url} alt="" />
                      ) : (
                        player.name.slice(0, 1).toUpperCase()
                      )}
                    </span>
                    <strong>{player.name}</strong>
                  </button>
                ))}
                {unassignedPlayers.length === 0 && (
                  <p>
                    Everyone is in a team. Choose a player above to move them.
                  </p>
                )}
              </div>
              <div className="cc-host-team-cards">
                {teams.map((team) => {
                  const members = players.filter(
                    (player) => player.team_id === team.id,
                  );
                  const selectedPlayer = players.find(
                    (player) => player.id === selectedLobbyPlayerId,
                  );
                  const isMember = selectedPlayer?.team_id === team.id;
                  const full = members.length >= session.team_size && !isMember;
                  return (
                    <article className="cc-host-lobby-team-card" key={team.id}>
                      <header>
                        <div>
                          <span className="cc-host-lobby-team-icon">
                            {teamPhotoUrls[team.id] ? (
                              <img src={teamPhotoUrls[team.id]} alt="" />
                            ) : (
                              <Icon name="users" className="icon--size-21" />
                            )}
                          </span>
                          <strong>{team.name}</strong>
                        </div>
                        <span>
                          {members.length}/{session.team_size}
                        </span>
                      </header>
                      <div className="cc-host-lobby-team-members">
                        {members.map((player) => (
                          <button
                            type="button"
                            key={player.id}
                            className={
                              player.id === selectedLobbyPlayerId
                                ? "is-selected"
                                : ""
                            }
                            onClick={() => setSelectedLobbyPlayerId(player.id)}
                          >
                            <span>
                              {player.avatar_url ? (
                                <img src={player.avatar_url} alt="" />
                              ) : (
                                player.name.slice(0, 1).toUpperCase()
                              )}
                            </span>
                            <strong>{player.name}</strong>
                          </button>
                        ))}
                        {members.length === 0 && <p>Waiting for players</p>}
                      </div>
                      <button
                        type="button"
                        className={`cc-host-team-join-button${isMember ? " is-leave" : ""}`}
                        disabled={
                          busy || !selectedPlayer || (full && !isMember)
                        }
                        onClick={() =>
                          selectedPlayer &&
                          void assignTeam(
                            selectedPlayer,
                            isMember ? "" : team.id,
                          )
                        }
                      >
                        {isMember
                          ? "Leave team"
                          : full
                            ? "Team full"
                            : selectedPlayer
                              ? `Add ${selectedPlayer.name}`
                              : "Choose a player above"}
                      </button>
                    </article>
                  );
                })}
              </div>
              <form
                className="cc-host-add-team-form"
                onSubmit={(event) => void createTeam(event)}
              >
                <input
                  aria-label="New team name"
                  value={teamName}
                  onChange={(event) => setTeamName(event.target.value)}
                  placeholder={`Team ${teams.length + 1}`}
                  maxLength={40}
                />
                <button type="submit" disabled={busy || !teamName.trim()}>
                  + Add team
                </button>
              </form>
              <button
                type="button"
                className="cc-host-team-start-shortcut"
                onClick={() => goToLobbyStep(6)}
              >
                Start Game <Icon name="arrow-right" className="icon--size-15" />
              </button>
            </>
          )}
        </div>
      )}

      {lobbyStep === 5 && (
        <div className="cc-host-lobby-card cc-host-team-name-step">
          <h2>Edit teams and players</h2>
          <p>
            Set team names and add a picture. You can still move players between
            teams here.
          </p>
          {!session.teams_enabled ? (
            <p className="cc-host-lobby-note">
              This game is set up for individual players, so team setup is
              skipped.
            </p>
          ) : (
            <>
              {teams.map((team) => (
                <article className="cc-host-team-edit-card" key={team.id}>
                  <div className="cc-host-team-edit-identity">
                    <span className="cc-host-lobby-team-icon">
                      {teamPhotoUrls[team.id] ? (
                        <img src={teamPhotoUrls[team.id]} alt="" />
                      ) : (
                        <Icon name="users" className="icon--size-21" />
                      )}
                    </span>
                    <input
                      aria-label={`Name for ${team.name}`}
                      value={teamNameEdits[team.id] ?? team.name}
                      maxLength={40}
                      onChange={(event) =>
                        setTeamNameEdits((values) => ({
                          ...values,
                          [team.id]: event.target.value,
                        }))
                      }
                    />
                    <button
                      type="button"
                      disabled={
                        busy ||
                        !teamNameEdits[team.id]?.trim() ||
                        teamNameEdits[team.id] === team.name
                      }
                      onClick={() => void renameTeam(team)}
                    >
                      Save
                    </button>
                  </div>
                  <label className="cc-host-team-photo-upload">
                    <span>
                      {teamPhotoUrls[team.id] ? (
                        <img src={teamPhotoUrls[team.id]} alt="Team photo" />
                      ) : (
                        <Icon name="plus" className="icon--size-20" />
                      )}
                    </span>
                    <strong>Upload team picture</strong>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={busy}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void uploadTeamPhoto(team, file);
                        event.currentTarget.value = "";
                      }}
                    />
                  </label>
                  <div className="cc-host-team-edit-members">
                    {players
                      .filter((player) => player.team_id === team.id)
                      .map((player) => (
                        <label key={player.id}>
                          <span>
                            {player.avatar_url ? (
                              <img src={player.avatar_url} alt="" />
                            ) : (
                              player.name.slice(0, 1).toUpperCase()
                            )}
                          </span>
                          <strong>{player.name}</strong>
                          <select
                            aria-label={`Team for ${player.name}`}
                            value={player.team_id ?? ""}
                            disabled={busy}
                            onChange={(event) =>
                              void assignTeam(player, event.target.value)
                            }
                          >
                            <option value="">No team</option>
                            {teams.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.name}
                              </option>
                            ))}
                          </select>
                        </label>
                      ))}
                  </div>
                </article>
              ))}
              <form
                className="cc-host-add-team-form"
                onSubmit={(event) => void createTeam(event)}
              >
                <input
                  aria-label="New team name"
                  value={teamName}
                  onChange={(event) => setTeamName(event.target.value)}
                  placeholder={`Team ${teams.length + 1}`}
                  maxLength={40}
                />
                <button type="submit" disabled={busy || !teamName.trim()}>
                  + Add team
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {lobbyStep === 6 && (
        <div className="cc-host-lobby-card cc-host-waiting-step">
          <div className="cc-host-waiting-art">
            {gamePhotoUrl ? (
              <img src={gamePhotoUrl} alt="" />
            ) : (
              <span aria-hidden="true">🎉</span>
            )}
          </div>
          <span className="cc-host-waiting-kicker">READY WHEN YOU ARE</span>
          <h2>{session.name}</h2>
          <strong className="cc-host-waiting-count">
            {session.teams_enabled
              ? `${readyTeamsCount} of ${teams.length} teams ready`
              : `${players.length} players ready`}
          </strong>
          <p>
            Everyone is together. This is a good time to explain the rules,
            answer questions and make sure each team knows how to play.
          </p>
          <div className="cc-host-waiting-summary">
            {players.length} players ·{" "}
            {session.teams_enabled
              ? `${teams.length} teams · ${session.team_size} players per team`
              : "Individual play"}
          </div>
        </div>
      )}

      <footer className="cc-host-lobby-step-actions">
        <button
          type="button"
          className="cc-host-lobby-back"
          disabled={lobbyStep === 1}
          onClick={() =>
            goToLobbyStep((lobbyStep - 1) as 1 | 2 | 3 | 4 | 5 | 6)
          }
        >
          <Icon name="arrow-left" className="icon--size-16" /> Back
        </button>
        {lobbyStep < 6 ? (
          <button
            type="button"
            className="cc-host-lobby-next"
            onClick={() =>
              goToLobbyStep((lobbyStep + 1) as 1 | 2 | 3 | 4 | 5 | 6)
            }
          >
            {lobbyStep === 5 ? "Next" : "Next"}{" "}
            <Icon name="arrow-right" className="icon--size-17" />
          </button>
        ) : (
          <button
            type="button"
            className="cc-host-lobby-next"
            disabled={busy}
            onClick={() => void startGame()}
          >
            {busy ? (
              <Icon name="loader-circle" className="icon--size-17 cc-spin" />
            ) : (
              <Icon name="play" className="icon--size-17" />
            )}{" "}
            Start Game
          </button>
        )}
      </footer>
    </section>
  );

  const canParticipate = Boolean(
    session.host_participates && hostPlayer && hostPlayerToken,
  );
  const participantSection =
    activeTab === "final-round"
      ? "final"
      : activeTab === "leaderboard" || activeTab === "side-challenges"
        ? activeTab
        : "game";
  return (
    <SessionPage
      viewerRole="host"
      profile={{
        name: hostPlayer?.name ?? headerPlayer?.name ?? hostDisplayName,
        subtitle: hostPlayer
          ? (teamById.get(hostPlayer.team_id ?? "")?.name ??
            "Playing in this game")
          : headerPlayer
            ? "Current leader"
            : "Game host",
        avatarUrl: hostPlayer?.avatar_url ?? headerPlayer?.avatar_url,
        score: headerPlayer?.score ?? 0,
        rank: headerRank,
        badge: hostPlayer ? "HOST" : headerPlayer ? "LEADER" : "HOST",
      }}
      game={{
        name: session.name,
        code: session.join_code,
        photoUrl: gamePhotoUrl,
        onCopy: () => void copyCode(),
      }}
      toolbar={
        <HostManagement>
          <div className="cc-session-topbar" data-tour="host-overview">
            <Link to="/host" className="cc-session-back">
              <Icon name="arrow-left" className="icon--size-17" /> Host Hub
            </Link>
            <div className="cc-host-topbar-right">
              {headerPlayer && (
                <span className="cc-host-topbar-score">
                  <Icon name="trophy" className="icon--size-15" />
                  {headerPlayer.score} pts · #{headerRank}
                </span>
              )}
              <span className="cc-host-controls-badge">
                <span className="cc-host-controls-dot" /> HOST CONTROLS
              </span>
              <span
                className={`cc-session-status cc-session-status--${session.status}`}
              >
                {session.status === "lobby"
                  ? "LOBBY"
                  : session.status === "live"
                    ? "LIVE"
                    : "COMPLETED"}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="session-page__tour"
            onClick={() => setHostTourOpen(true)}
          >
            ✦ Take the host tour
          </button>
        </HostManagement>
      }
      navigation={
        session.status !== "lobby" ? (
          <SessionNavigation
            active={
              activeTab === "final-round"
                ? "final"
                : activeTab === "reward-round"
                  ? "host-controls"
                  : activeTab
            }
            showFinal
            showHost
            tourTarget="host-sections"
            onSelect={(section) =>
              setActiveTab(section === "final" ? "final-round" : section)
            }
          />
        ) : undefined
      }
      feedback={
        <>
          {error && (
            <SessionFeedback
              message={error}
              kind="error"
              onDismiss={() => setError("")}
            />
          )}
          {notice && (
            <SessionFeedback
              message={notice}
              kind="success"
              onDismiss={() => setNotice("")}
            />
          )}
        </>
      }
      overlays={
        <>
          {editingBreakChallenge && (
            <ChallengeEditor
              busy={busy}
              setEditingBreakChallenge={setEditingBreakChallenge}
              saveBreakChallengeEdit={saveBreakChallengeEdit}
              editingBreakChallenge={editingBreakChallenge}
              editChallengeTitle={editChallengeTitle}
              setEditChallengeTitle={setEditChallengeTitle}
              editChallengeDescription={editChallengeDescription}
              setEditChallengeDescription={setEditChallengeDescription}
              editChallengeEquipment={editChallengeEquipment}
              setEditChallengeEquipment={setEditChallengeEquipment}
              editChallengeDuration={editChallengeDuration}
              setEditChallengeDuration={setEditChallengeDuration}
              editChallengePoints={editChallengePoints}
              setEditChallengePoints={setEditChallengePoints}
              editChallengeEvidence={editChallengeEvidence}
              setEditChallengeEvidence={setEditChallengeEvidence}
            />
          )}
          {editingBreakTimer && (
            <BreakTimerEditor
              busy={busy}
              setEditingBreakTimer={setEditingBreakTimer}
              saveBreakTimer={saveBreakTimer}
              breakResumeRound={breakResumeRound}
              session={session}
              editBreakMinutes={editBreakMinutes}
              setEditBreakMinutes={setEditBreakMinutes}
              error={error}
              setError={setError}
            />
          )}
          {overridePrompt && (
            <RoundOverrideDialog
              busy={busy}
              setOverridePrompt={setOverridePrompt}
              overridePrompt={overridePrompt}
              startOverrideReasons={startOverrideReasons}
              players={players}
              session={session}
              unassignedPlayers={unassignedPlayers}
              autoplayEnabled={autoplayEnabled}
              teams={teams}
              confirmHostOverride={confirmHostOverride}
            />
          )}
          {hostTourOpen && (
            <GuidedTour
              steps={hostTourSteps}
              onNavigate={navigateHostTour}
              onClose={() => setHostTourOpen(false)}
              label="HOST TOUR"
            />
          )}
        </>
      }
    >
      {session.status === "lobby" ? (
        <HostManagement>{lobbyFlow}</HostManagement>
      ) : (
        <>
          {canParticipate &&
            activeTab !== "host-controls" &&
            activeTab !== "reward-round" &&
            activeTab !== "leaderboard" && (
              <SessionParticipant
                key={`${session.id}:${hostPlayerToken}`}
                joinCode={session.join_code}
                section={participantSection}
                playerToken={hostPlayerToken ?? undefined}
                embedded
                onSectionChange={navigateParticipant}
                onRecover={() => void openHostPlayerView()}
                focusChallengeId={focusedHostChallenge}
              />
            )}
          {!canParticipate &&
            activeTab === "game" &&
            activeRewardRound &&
            !secretReviewState?.is_open && (
              <SessionRewardRound
                round={rewardPresentation(
                  activeRewardRound,
                  activeRewardChallenge?.title ?? "Reward round",
                  activeRewardVotes,
                  activeRewardAwards,
                  rewardTargetRows,
                  players,
                  teams,
                )}
              />
            )}
          {!canParticipate &&
            activeTab === "game" &&
            !activeRewardRound &&
            !secretReviewState?.is_open &&
            (session.status === "completed" ? (
              <SessionState title="Game over. Chaos achieved." icon="flag">
                <p>This session has finished.</p>
              </SessionState>
            ) : hostBreakActive ? (
              <SessionBreak label={roundClockText} running={roundClockRunning}>
                {nextBreakChallenge && (
                  <p>
                    Up next: {nextBreakChallenge.title} · starts{" "}
                    {nextRoundStartAt?.toLocaleTimeString() ??
                      "when the host resumes"}{" "}
                    · ends{" "}
                    {nextRoundEndAt?.toLocaleTimeString() ?? "after the timer"}
                  </p>
                )}
              </SessionBreak>
            ) : (
              <SessionMainChallengeCard
                viewerRole="host"
                title={currentChallenge?.title ?? "Challenge not found"}
                description={
                  currentChallenge?.description ??
                  "Check that this session has a main challenge assigned to the current round."
                }
                points={currentChallenge?.points ?? 0}
                round={session.current_round_number}
                roundCount={mainRounds.length}
                durationMinutes={currentChallenge?.duration_minutes ?? 0}
                timerLabel={roundClockText}
                timerCaption={
                  hostBreakActive
                    ? "BREAK"
                    : roundClockRunning
                      ? "TIME LEFT"
                      : "READY"
                }
                actionTourTarget="host-round-timer"
              />
            ))}
          {!canParticipate && activeTab === "side-challenges" && (
            <section data-tour="player-side-challenges">
              <h2 className="session-page__heading">Side challenges</h2>
              {sideChallenges.length === 0 && (
                <SessionState title="No side challenges added" />
              )}
              {sideChallenges.map((challenge) => (
                <SessionChallengeCard
                  key={challenge.id}
                  id={challenge.id}
                  title={challenge.title}
                  description={challenge.description}
                  points={challenge.points}
                >
                  <button
                    type="button"
                    className="btn"
                    disabled={busy || session.status !== "live"}
                    onClick={() => void openHostSideChallengeUpload(challenge)}
                  >
                    Join & upload evidence
                  </button>
                </SessionChallengeCard>
              ))}
            </section>
          )}
          {!canParticipate &&
            (activeTab === "game" || activeTab === "side-challenges") &&
            session.status !== "completed" && (
              <SessionState
                title="Hosting without playing"
                icon="shield"
                action={
                  <button
                    type="button"
                    className="btn"
                    disabled={busy}
                    onClick={() => void setHostParticipation(true)}
                  >
                    Join and play
                  </button>
                }
              >
                <p>
                  Join the player list to submit your own evidence and vote.
                  Host controls remain in the Host tab.
                </p>
              </SessionState>
            )}
          {activeTab === "leaderboard" && (
            <HostSessionLeaderboard
              session={session}
              players={players}
              teams={teams}
              busy={busy}
              assignTeam={assignTeam}
              teamById={teamById}
            />
          )}
          {activeTab === "final-round" && (
            <HostFinalRound
              canVote={canParticipate}
              participantView={canParticipate}
              selectedFinalChallengeEvidence={selectedFinalChallengeEvidence}
              sideChallenges={sideChallenges}
              selectedFinalChallengeId={selectedFinalChallengeId}
              busy={busy}
              selectedFinalChallengeStatus={selectedFinalChallengeStatus}
              selectFinalChallenge={selectFinalChallenge}
              setFinalGallery={setFinalGallery}
              selectedFinalChallengeVotes={selectedFinalChallengeVotes}
              players={players}
              session={session}
              selectedFinalChallengeState={selectedFinalChallengeState}
              reopenFinalChallengeVoting={reopenFinalChallengeVoting}
              nextPendingFinalChallenge={nextPendingFinalChallenge}
              advanceFinalChallenge={advanceFinalChallenge}
              isFinalSlideshowConnected={isFinalSlideshowConnected}
              selectedFinalEvidenceIndex={selectedFinalEvidenceIndex}
              setFinalSlideshow={setFinalSlideshow}
              selectedFinalEvidence={selectedFinalEvidence}
              disconnectFinalSlideshow={disconnectFinalSlideshow}
              castFinalSlideshow={castFinalSlideshow}
              selectedFinalChallenge={selectedFinalChallenge}
              playerById={playerById}
              evidenceUrl={evidenceUrl}
              castHostFinalVote={castHostFinalVote}
              finalTopVoteCount={finalTopVoteCount}
              finalWinningEvidenceIds={finalWinningEvidenceIds}
              rankedPlayers={rankedPlayers}
            />
          )}
          {secretReviewState?.is_open &&
            selectedSecretReviewAssignment &&
            selectedSecretReviewChallenge &&
            (activeTab === "host-controls" ||
              (!canParticipate && activeTab === "game")) && (
              <SessionReview
                title={selectedSecretReviewChallenge.title}
                description={selectedSecretReviewChallenge.description}
                owner={
                  playerById.get(selectedSecretReviewAssignment.player_id)
                    ?.name ?? "Player"
                }
                points={selectedSecretReviewChallenge.points}
                evidence={selectedSecretReviewEvidence.map((item) => ({
                  id: item.id,
                  url: evidenceUrl(item.storage_path),
                  mediaType: item.media_type,
                  description: `Evidence for ${selectedSecretReviewChallenge.title}`,
                }))}
                open={secretReviewState.voting_open}
                vote={hostSecretReviewVote?.vote}
                outcome={
                  secretReviewState.voting_open
                    ? null
                    : selectedSecretReview?.outcome
                }
                votesCast={currentSecretReviewVoteCount}
                successVotes={
                  secretReviewState.voting_open
                    ? null
                    : (selectedSecretReview?.success_votes ?? 0)
                }
                failVotes={
                  secretReviewState.voting_open
                    ? null
                    : (selectedSecretReview?.fail_votes ?? 0)
                }
                busy={busy}
                onVote={
                  canParticipate
                    ? (vote) => void castHostSecretReviewVote(vote)
                    : undefined
                }
                voters={
                  secretReviewState.voting_open
                    ? []
                    : secretReviewVotes
                        .filter(
                          (vote) =>
                            vote.assignment_id ===
                            selectedSecretReviewAssignmentId,
                        )
                        .map((vote) => ({
                          id: vote.player_id,
                          name:
                            playerById.get(vote.player_id)?.name ?? "Player",
                          vote: vote.vote,
                        }))
                }
                leaderboard={rankedPlayers.map((player) => ({
                  id: player.id,
                  name: player.name,
                  score: player.score,
                  avatarUrl: player.avatar_url,
                }))}
                viewerId={session.host_player_id}
              />
            )}
          <HostManagement>
            {activeTab === "host-controls" && (
              <>
                <section
                  className="cc-host-live-controls-card"
                  aria-label="Host controls"
                >
                  <h2>
                    <span aria-hidden="true">✦</span> HOST CONTROLS
                  </h2>
                  {session.status === "completed" ? (
                    <p className="cc-host-control-message">
                      Game complete. Your players can review the final scores.
                    </p>
                  ) : activeRewardRound ? (
                    <div className="cc-host-control-stage">
                      <p className="cc-host-control-message">
                        Reward points are in progress. Continue the review to
                        return everyone to the game.
                      </p>
                      <button
                        type="button"
                        className="cc-host-control-button cc-host-control-button--primary"
                        onClick={openPointReview}
                      >
                        <Icon name="trophy" className="icon--size-17" />{" "}
                        Continue reward flow
                      </button>
                    </div>
                  ) : hostBreakActive ? (
                    <div className="cc-host-control-stage">
                      <p className="cc-host-control-message">
                        {currentRoundPointsAwarded
                          ? "Points awarded! Move to the next round when you are ready."
                          : "Break in progress. The next round starts when the timer ends."}
                      </p>
                      <h3 className="cc-host-break-next-heading">
                        NEXT ROUND STARTS IN...
                      </h3>
                      <div className="cc-host-round-control-row cc-host-break-control-row">
                        <div className="cc-host-round-clock">
                          <span>TIME REMAINING</span>
                          <strong>{roundClockText}</strong>
                        </div>
                        <button
                          type="button"
                          className="cc-host-control-button cc-host-control-button--primary"
                          disabled={busy}
                          onClick={() =>
                            void moveToRound(
                              breakResumeRound ??
                                session.current_round_number + 1,
                            )
                          }
                        >
                          <Icon name="play" className="icon--size-16" /> Start
                          Now
                        </button>
                        <button
                          type="button"
                          className="cc-host-break-timer-menu"
                          aria-label="Edit break timer"
                          title="Edit break timer"
                          disabled={busy}
                          onClick={openBreakTimerEditor}
                        >
                          ⋮
                        </button>
                      </div>
                    </div>
                  ) : currentRoundPointsAwarded ? (
                    <div className="cc-host-control-stage">
                      <p className="cc-host-control-message">
                        Points awarded! Move to the next round when you are
                        ready.
                      </p>
                      <div className="cc-host-round-control-actions cc-host-round-control-actions--progress">
                        <button
                          type="button"
                          className="cc-host-control-button"
                          disabled={busy || session.current_round_number <= 1}
                          onClick={() =>
                            requestMoveToRound(session.current_round_number - 1)
                          }
                        >
                          <Icon name="arrow-left" className="icon--size-16" />{" "}
                          Previous Round
                        </button>
                        <button
                          type="button"
                          className="cc-host-control-button"
                          disabled={
                            busy ||
                            session.current_round_number >= mainRounds.length
                          }
                          onClick={requestStartBreak}
                        >
                          <span className="cc-host-pause-symbol">Ⅱ</span> Take a
                          Break
                        </button>
                        <button
                          type="button"
                          className="cc-host-control-button cc-host-control-button--primary cc-host-control-button--next"
                          disabled={
                            busy ||
                            session.current_round_number >= mainRounds.length
                          }
                          onClick={() =>
                            requestMoveToRound(session.current_round_number + 1)
                          }
                        >
                          Next Round{" "}
                          <Icon name="arrow-right" className="icon--size-16" />
                        </button>
                      </div>
                    </div>
                  ) : !roundTimerHydrated ? (
                    <p className="cc-host-control-message">
                      Preparing the round timer…
                    </p>
                  ) : roundClockSeconds === 0 && !roundClockRunning ? (
                    <div className="cc-host-control-stage">
                      <p className="cc-host-control-message">
                        Challenge complete! Review points when you are ready.
                      </p>
                      <div className="cc-host-round-control-row">
                        <div className="cc-host-round-clock">
                          <span>TIME REMAINING</span>
                          <strong>{roundClockText}</strong>
                        </div>
                        <button
                          type="button"
                          className="cc-host-control-button cc-host-control-button--replay"
                          aria-label="Play timer again"
                          title="Play timer again"
                          disabled={busy}
                          onClick={restartRoundTimer}
                        >
                          <Icon name="rotate-ccw" className="icon--size-20" />
                        </button>
                      </div>
                      <button
                        type="button"
                        className="cc-host-control-button cc-host-control-button--primary cc-host-review-button"
                        disabled={busy || enabledRewardMethods.length === 0}
                        onClick={openPointReview}
                      >
                        <Icon name="trophy" className="icon--size-17" /> Review
                        and award
                      </button>
                    </div>
                  ) : roundClockRunning ? (
                    <div className="cc-host-control-stage">
                      <div className="cc-host-round-control-row">
                        <div className="cc-host-round-clock">
                          <span>TIME REMAINING</span>
                          <strong>{roundClockText}</strong>
                        </div>
                        <button
                          type="button"
                          className="cc-host-control-button"
                          disabled={busy}
                          onClick={runStartRoundControl}
                        >
                          <Icon name="pause" className="icon--size-19" /> Pause
                        </button>
                        <button
                          type="button"
                          className="cc-host-control-button cc-host-control-button--replay"
                          aria-label="Redo timer"
                          title="Redo timer"
                          disabled={busy}
                          onClick={redoRoundTimer}
                        >
                          <Icon name="rotate-ccw" className="icon--size-20" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="cc-host-control-stage">
                      <p className="cc-host-control-message">
                        When you are ready to play, start the timer.
                      </p>
                      <div className="cc-host-round-control-row">
                        <div className="cc-host-round-clock">
                          <span>TIME REMAINING</span>
                          <strong>{roundClockText}</strong>
                        </div>
                        <button
                          type="button"
                          className="cc-host-control-button cc-host-control-button--primary"
                          disabled={busy}
                          onClick={runStartRoundControl}
                        >
                          <Icon name="play" className="icon--size-17" /> Start
                          Timer
                        </button>
                      </div>
                    </div>
                  )}
                  {session.status === "live" && (
                    <div
                      className="cc-host-fallback-controls"
                      aria-label="Fallback round controls"
                    >
                      <span>BACKUP FLOW CONTROLS</span>
                      <div className="cc-host-fallback-controls-row">
                        <button
                          type="button"
                          className="cc-host-fallback-button"
                          disabled={
                            busy ||
                            Boolean(activeRewardRound) ||
                            session.current_round_number <= 1
                          }
                          onClick={() =>
                            requestMoveToRound(session.current_round_number - 1)
                          }
                        >
                          <Icon name="arrow-left" className="icon--size-13" />{" "}
                          Back
                        </button>
                        <button
                          type="button"
                          className="cc-host-fallback-button cc-host-fallback-button--action"
                          disabled={
                            busy ||
                            (!activeRewardRound &&
                              (!roundTimerHydrated ||
                                hostBreakActive ||
                                currentRoundPointsAwarded ||
                                enabledRewardMethods.length === 0))
                          }
                          onClick={
                            activeRewardRound
                              ? openPointReview
                              : skipTimerAndReview
                          }
                        >
                          <Icon name="trophy" className="icon--size-13" />
                          {activeRewardRound
                            ? "Continue review"
                            : roundClockRunning
                              ? "Skip & review"
                              : "Review"}
                        </button>
                        <button
                          type="button"
                          className="cc-host-fallback-button"
                          disabled={
                            busy ||
                            Boolean(activeRewardRound) ||
                            session.current_round_number >= mainRounds.length
                          }
                          onClick={() =>
                            requestMoveToRound(session.current_round_number + 1)
                          }
                        >
                          Next{" "}
                          <Icon name="arrow-right" className="icon--size-13" />
                        </button>
                      </div>
                    </div>
                  )}
                </section>
                {session.status === "live" &&
                  mainRounds[session.current_round_number] && (
                    <article
                      className={`cc-host-next-challenge${upcomingBreakMinutes > 0 || hostBreakActive ? " is-break" : ""}`}
                    >
                      <span>
                        {hostBreakActive
                          ? "BREAK IN PROGRESS"
                          : upcomingBreakMinutes > 0
                            ? `▶ NEXT UP · BREAK · ${upcomingBreakMinutes} MIN`
                            : `▶ NEXT CHALLENGE · ROUND ${session.current_round_number + 1}`}
                      </span>
                      <div className="cc-host-next-challenge-heading">
                        <b aria-hidden="true">
                          {upcomingBreakMinutes > 0 || hostBreakActive
                            ? "☕"
                            : challengeIcon(
                                mainRounds[session.current_round_number].title,
                                mainRounds[session.current_round_number]
                                  .description,
                              )}
                        </b>
                        <strong>
                          {hostBreakActive
                            ? `Round ${breakResumeRound ?? session.current_round_number + 1} follows the break`
                            : upcomingBreakMinutes > 0
                              ? `Break · ${upcomingBreakMinutes} minutes`
                              : mainRounds[session.current_round_number].title}
                        </strong>
                      </div>
                      <small>
                        {hostBreakActive
                          ? "Players will be moved to the next challenge when the break ends."
                          : upcomingBreakMinutes > 0
                            ? `After the break: ${mainRounds[session.current_round_number].title}`
                            : mainRounds[session.current_round_number]
                                .description}
                      </small>
                      {!hostBreakActive && nextBreakChallenge && (
                        <button
                          type="button"
                          className="cc-host-break-edit"
                          disabled={busy}
                          onClick={() =>
                            openBreakChallengeEditor(nextBreakChallenge)
                          }
                        >
                          <Icon name="pencil" className="icon--size-14" /> Edit
                          next challenge
                        </button>
                      )}
                    </article>
                  )}
              </>
            )}
            {activeTab === "host-controls" && (
              <div className="cc-session-grid">
                <section className="cc-session-card cc-invite-card">
                  <div className="cc-section-kicker">INVITE PLAYERS</div>
                  <p>
                    Players can scan this QR code or enter the code shown in the
                    game header.
                  </p>
                  <div className="cc-qr-wrap">
                    <QRCodeSVG
                      value={joinUrl}
                      size={196}
                      level="M"
                      marginSize={4}
                    />
                  </div>
                  <div className="cc-invite-actions">
                    <button
                      type="button"
                      className="host-button host-button--secondary"
                      onClick={() => void copyCode()}
                    >
                      <Icon name="clipboard" className="icon--size-16" /> Copy
                      join code
                    </button>
                    <a
                      className="host-button host-button--ghost"
                      href={joinUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open join screen{" "}
                      <Icon name="arrow-right" className="icon--size-16" />
                    </a>
                  </div>
                  <div className="cc-player-count">
                    <Icon name="users" className="icon--size-17" />{" "}
                    {players.length} / {session.player_limit} players joined
                  </div>
                  {session.teams_enabled && (
                    <p className="cc-helper-text">
                      {session.host_chooses_teams
                        ? "You'll assign teams below."
                        : "Players can pick or create a team in the lobby."}
                    </p>
                  )}
                </section>

                <section
                  className="cc-session-card cc-live-controls"
                  data-tour="host-start-controls"
                >
                  <div className="cc-section-kicker">GAME CONTROL</div>
                  {session.status === "completed" ? (
                    <>
                      <h2>Game complete!</h2>
                      <p>
                        This session is saved separately from every other game.
                        You can still review the rounds and scores below.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="cc-round-kicker">CURRENT ROUND</div>
                      <div className="cc-round-number">
                        {session.current_round_number}
                        <span> / {mainRounds.length}</span>
                      </div>
                      <h2>{currentChallenge?.title ?? "Round not found"}</h2>
                      <p>
                        {currentChallenge?.description ??
                          "Check that the saved plan contains a main challenge for this round."}
                      </p>
                      <div className="cc-round-controls">
                        <button
                          type="button"
                          className="host-button host-button--secondary"
                          disabled={busy || session.current_round_number <= 1}
                          onClick={() =>
                            requestMoveToRound(session.current_round_number - 1)
                          }
                        >
                          <Icon name="rotate-ccw" className="icon--size-16" />{" "}
                          Previous round
                        </button>
                        <button
                          type="button"
                          className="host-button host-button--primary"
                          disabled={
                            busy ||
                            session.current_round_number >= mainRounds.length
                          }
                          onClick={() =>
                            requestMoveToRound(session.current_round_number + 1)
                          }
                        >
                          Next round{" "}
                          <Icon name="arrow-right" className="icon--size-16" />
                        </button>
                      </div>
                      <div className="cc-round-list" aria-label="Jump to round">
                        {mainRounds.map((round) => (
                          <button
                            type="button"
                            key={round.id}
                            className={`cc-round-chip${round.round_number === session.current_round_number ? " is-current" : ""}`}
                            disabled={
                              busy ||
                              round.round_number ===
                                session.current_round_number
                            }
                            onClick={() =>
                              requestMoveToRound(Number(round.round_number))
                            }
                          >
                            {round.round_number}. {round.title}
                          </button>
                        ))}
                      </div>
                      {session.status === "live" && (
                        <div
                          className="cc-host-fallback-controls"
                          aria-label="Quick game flow controls"
                        >
                          <span>FALLBACK CONTROLS</span>
                          <div className="cc-host-fallback-controls-row">
                            <button
                              type="button"
                              className="cc-host-fallback-button"
                              disabled={
                                busy ||
                                Boolean(activeRewardRound) ||
                                session.current_round_number <= 1
                              }
                              onClick={() =>
                                requestMoveToRound(
                                  session.current_round_number - 1,
                                )
                              }
                            >
                              <Icon
                                name="arrow-left"
                                className="icon--size-13"
                              />{" "}
                              Back
                            </button>
                            <button
                              type="button"
                              className="cc-host-fallback-button cc-host-fallback-button--action"
                              disabled={
                                busy ||
                                (!activeRewardRound &&
                                  (!roundTimerHydrated ||
                                    hostBreakActive ||
                                    currentRoundPointsAwarded ||
                                    enabledRewardMethods.length === 0))
                              }
                              onClick={
                                activeRewardRound
                                  ? openPointReview
                                  : skipTimerAndReview
                              }
                            >
                              <Icon name="trophy" className="icon--size-13" />
                              {activeRewardRound
                                ? "Continue review"
                                : roundClockRunning
                                  ? "Skip & review"
                                  : "Review"}
                            </button>
                            <button
                              type="button"
                              className="cc-host-fallback-button"
                              disabled={
                                busy ||
                                Boolean(activeRewardRound) ||
                                session.current_round_number >=
                                  mainRounds.length
                              }
                              onClick={() =>
                                requestMoveToRound(
                                  session.current_round_number + 1,
                                )
                              }
                            >
                              Next{" "}
                              <Icon
                                name="arrow-right"
                                className="icon--size-13"
                              />
                            </button>
                          </div>
                          {!activeRewardRound && (
                            <button
                              type="button"
                              className="cc-host-fallback-button cc-host-fallback-button--action cc-host-fallback-status"
                              disabled={
                                busy ||
                                !roundTimerHydrated ||
                                (hostBreakActive && !breakResumeRound) ||
                                (currentRoundPointsAwarded &&
                                  session.current_round_number >=
                                    mainRounds.length)
                              }
                              onClick={
                                hostBreakActive
                                  ? () =>
                                      requestMoveToRound(
                                        breakResumeRound ??
                                          session.current_round_number + 1,
                                      )
                                  : currentRoundPointsAwarded
                                    ? requestStartBreak
                                    : roundClockRunning
                                      ? runStartRoundControl
                                      : roundClockSeconds === 0
                                        ? restartRoundTimer
                                        : runStartRoundControl
                              }
                            >
                              {!roundTimerHydrated ? (
                                "Loading timer…"
                              ) : hostBreakActive ? (
                                "Start next round"
                              ) : currentRoundPointsAwarded ? (
                                <>
                                  <Icon
                                    name="coffee"
                                    className="icon--size-13"
                                  />{" "}
                                  Take a break
                                </>
                              ) : roundClockRunning ? (
                                <>
                                  <Icon
                                    name="pause"
                                    className="icon--size-13"
                                  />{" "}
                                  Pause timer
                                </>
                              ) : roundClockSeconds === 0 ? (
                                <>
                                  <Icon
                                    name="rotate-ccw"
                                    className="icon--size-13"
                                  />{" "}
                                  Restart timer
                                </>
                              ) : (
                                <>
                                  <Icon name="play" className="icon--size-13" />{" "}
                                  Start timer
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      )}
                      {nextBreakChallenge && (
                        <div className="cc-host-next-edit-card">
                          <span>
                            UP NEXT · ROUND {nextBreakChallenge.round_number}
                          </span>
                          <strong>{nextBreakChallenge.title}</strong>
                          <p>{nextBreakChallenge.description}</p>
                          <small>
                            {nextBreakChallenge.duration_minutes} min ·{" "}
                            {nextBreakChallenge.points} pts ·{" "}
                            {nextBreakChallenge.allow_photo_upload
                              ? "Photo evidence enabled"
                              : "No photo evidence"}
                          </small>
                          <button
                            type="button"
                            className="cc-host-break-edit"
                            disabled={busy}
                            onClick={() =>
                              openBreakChallengeEditor(nextBreakChallenge)
                            }
                          >
                            <Icon name="pencil" className="icon--size-14" />{" "}
                            Edit next challenge
                          </button>
                        </div>
                      )}
                      <button
                        type="button"
                        className="host-button host-button--ghost cc-finish-game"
                        disabled={busy}
                        onClick={() => void finishGame()}
                      >
                        <Icon name="flag" className="icon--size-16" /> Finish
                        game
                      </button>
                    </>
                  )}
                </section>
              </div>
            )}
            {(activeTab === "reward-round" || showRewardOverlay) && (
              <HostRewardRound
                canParticipate={canParticipate}
                showRewardOverlay={showRewardOverlay}
                enabledRewardMethods={enabledRewardMethods}
                setShowRewardOverlay={setShowRewardOverlay}
                activeRewardRound={activeRewardRound}
                session={session}
                showRewardSetup={showRewardSetup}
                busy={busy}
                setShowRewardSetup={setShowRewardSetup}
                startRewardRound={startRewardRound}
                rewardChallengeId={rewardChallengeId}
                setRewardChallengeId={setRewardChallengeId}
                challenges={challenges}
                setRewardPoints={setRewardPoints}
                rewardMethod={rewardMethod}
                setRewardMethod={setRewardMethod}
                rewardMethodLabel={rewardMethodLabel}
                rewardTargetKind={rewardTargetKind}
                setRewardTargetKind={setRewardTargetKind}
                setSelectedRewardWinnerIds={setSelectedRewardWinnerIds}
                teams={teams}
                rewardPoints={rewardPoints}
                activeRewardChallenge={activeRewardChallenge}
                activeRewardVotes={activeRewardVotes}
                rewardTargetRows={rewardTargetRows}
                hostRewardVoteTargetId={hostRewardVoteTargetId}
                castHostRewardVote={castHostRewardVote}
                cancelRewardRound={cancelRewardRound}
                completeRewardRound={completeRewardRound}
                rewardFinalPoints={rewardFinalPoints}
                setRewardFinalPoints={setRewardFinalPoints}
                selectedRewardWinnerIds={selectedRewardWinnerIds}
                toggleRewardWinner={toggleRewardWinner}
                activeRewardAwards={activeRewardAwards}
                playerById={playerById}
                teamById={teamById}
                players={players}
                returnFromRewardRound={returnFromRewardRound}
              />
            )}
            {activeTab === "host-controls" && (
              <>
                <section className="cc-session-card cc-session-section cc-secret-management">
                  <div className="cc-session-section-heading">
                    <div>
                      <div className="cc-section-kicker cc-section-kicker--icon">
                        <Icon name="shield" className="icon--size-14" /> PRIVATE
                        MISSIONS
                      </div>
                      <h2>Secret missions</h2>
                      <p>
                        Assign each mission to one player. Leave the delivery
                        time blank to send now, or schedule it for later in the
                        game.
                      </p>
                    </div>
                    <span className="cc-count-pill">
                      {
                        secretAssignments.filter(
                          (item) => item.status === "scheduled",
                        ).length
                      }{" "}
                      scheduled
                    </span>
                  </div>

                  {session.status !== "completed" && (
                    <>
                      <form
                        className="cc-secret-assign-form"
                        onSubmit={(event) => void assignSecretMission(event)}
                      >
                        <label>
                          <span>Send to one player</span>
                          <select
                            value={selectedSecretPlayerId}
                            onChange={(event) =>
                              setSelectedSecretPlayerId(event.target.value)
                            }
                            required
                            disabled={busy || players.length === 0}
                          >
                            <option value="">Choose player…</option>
                            {players.map((player) => (
                              <option key={player.id} value={player.id}>
                                {player.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          <span>Secret mission</span>
                          <select
                            value={selectedSecretChallengeId}
                            onChange={(event) =>
                              setSelectedSecretChallengeId(event.target.value)
                            }
                            required
                            disabled={busy || secretChallenges.length === 0}
                          >
                            <option value="">Choose mission…</option>
                            {secretChallenges.map((challenge) => (
                              <option key={challenge.id} value={challenge.id}>
                                {challenge.title} · {challenge.points} pts
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="cc-secret-time-field">
                          <span>
                            <Icon
                              name="calendar-clock"
                              className="icon--size-14"
                            />{" "}
                            Deliver at (optional)
                          </span>
                          <input
                            type="datetime-local"
                            value={secretScheduleAt}
                            onChange={(event) =>
                              setSecretScheduleAt(event.target.value)
                            }
                            disabled={busy}
                          />
                          <small>
                            Leave blank to send immediately, or queue until the
                            game goes live.
                          </small>
                        </label>
                        <button
                          type="submit"
                          className="host-button host-button--lime cc-secret-send-button"
                          disabled={
                            busy ||
                            !selectedSecretPlayerId ||
                            !selectedSecretChallengeId ||
                            players.length === 0 ||
                            secretChallenges.length === 0
                          }
                        >
                          {busy ? (
                            <Icon
                              name="loader-circle"
                              className="icon--size-16 cc-spin"
                            />
                          ) : (
                            <Icon name="send" className="icon--size-16" />
                          )}{" "}
                          Assign secret mission
                        </button>
                      </form>

                      <details className="cc-secret-create-details">
                        <summary>
                          Add a custom secret mission to this game
                        </summary>
                        <form
                          className="cc-secret-create-form"
                          onSubmit={(event) =>
                            void createSecretChallenge(event)
                          }
                        >
                          <label>
                            <span>Mission title</span>
                            <input
                              value={newSecretTitle}
                              onChange={(event) =>
                                setNewSecretTitle(event.target.value)
                              }
                              maxLength={100}
                              required
                              placeholder="e.g. Get someone to start a conga line"
                            />
                          </label>
                          <label>
                            <span>
                              Instructions (private to the assigned player)
                            </span>
                            <textarea
                              value={newSecretDescription}
                              onChange={(event) =>
                                setNewSecretDescription(event.target.value)
                              }
                              rows={3}
                              maxLength={1000}
                              placeholder="What should this one player do?"
                            />
                          </label>
                          <label>
                            <span>Points</span>
                            <input
                              type="number"
                              min={0}
                              max={10000}
                              value={newSecretPoints}
                              onChange={(event) =>
                                setNewSecretPoints(Number(event.target.value))
                              }
                            />
                          </label>
                          <label className="cc-secret-evidence-checkbox">
                            <span>
                              <input
                                type="checkbox"
                                checked={newSecretEvidenceRequired}
                                onChange={(event) =>
                                  setNewSecretEvidenceRequired(
                                    event.target.checked,
                                  )
                                }
                              />{" "}
                              Require photo/video evidence
                            </span>
                          </label>
                          <button
                            type="submit"
                            className="host-button host-button--secondary"
                            disabled={busy || !newSecretTitle.trim()}
                          >
                            <Icon name="check" className="icon--size-16" /> Add
                            mission
                          </button>
                        </form>
                      </details>
                    </>
                  )}

                  {secretAssignments.length > 0 ? (
                    <div className="cc-secret-assignment-list">
                      {secretAssignments.map((assignment) => {
                        const player = playerById.get(assignment.player_id);
                        const challenge = challengeById.get(
                          assignment.challenge_id,
                        );
                        const statusLabel =
                          assignment.status === "scheduled"
                            ? `Scheduled · ${new Date(assignment.scheduled_at).toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit" })}`
                            : assignment.status === "sent"
                              ? "Sent to player"
                              : assignment.status === "submitted"
                                ? "Needs review"
                                : assignment.final_review_outcome === "success"
                                  ? `Success · +${assignment.awarded_points} pts`
                                  : assignment.final_review_outcome === "fail"
                                    ? "Fail · final · no points"
                                    : assignment.status === "approved"
                                      ? `Approved · +${assignment.awarded_points} pts`
                                      : assignment.status === "rejected"
                                        ? "Rejected"
                                        : "Cancelled";
                        return (
                          <article
                            className="cc-secret-assignment-row"
                            key={assignment.id}
                          >
                            <div
                              className="cc-secret-assignment-icon"
                              aria-hidden="true"
                            >
                              {challengeIcon(
                                challenge?.title ?? "Secret mission",
                                challenge?.description ?? "",
                              )}
                            </div>
                            <div className="cc-secret-assignment-copy">
                              <strong>
                                {challenge?.title ?? "Secret mission"}
                              </strong>
                              <span>For {player?.name ?? "player"}</span>
                              <small>{statusLabel}</small>
                            </div>
                            {evidenceForAssignment(assignment.id).length >
                              0 && (
                              <div className="cc-session-evidence-gallery">
                                <div className="cc-session-evidence-grid">
                                  {evidenceForAssignment(assignment.id).map(
                                    (media) => (
                                      <div
                                        className="cc-session-evidence-item"
                                        key={media.id}
                                      >
                                        {media.media_type === "video" ? (
                                          <video
                                            src={evidenceUrl(
                                              media.storage_path,
                                            )}
                                            controls
                                            playsInline
                                            preload="metadata"
                                          />
                                        ) : (
                                          <img
                                            src={evidenceUrl(
                                              media.storage_path,
                                            )}
                                            alt={`Evidence for ${challenge?.title ?? "secret mission"}`}
                                            loading="lazy"
                                          />
                                        )}
                                        <div className="cc-session-evidence-meta">
                                          <small>
                                            {media.media_type === "video"
                                              ? "Video evidence"
                                              : "Photo evidence"}
                                          </small>
                                        </div>
                                      </div>
                                    ),
                                  )}
                                </div>
                              </div>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="cc-secret-empty">
                      <Icon name="shield" className="icon--size-21" />
                      <p>
                        {secretChallenges.length > 0
                          ? "No secret missions assigned yet. Pick one player and a mission above."
                          : "There are no secret missions in this plan yet. Add one here, or select secret missions in Explore before creating a new game."}
                      </p>
                    </div>
                  )}
                </section>
                <section className="cc-session-card cc-session-section cc-host-secret-review-card">
                  <div className="cc-session-section-heading">
                    <div>
                      <div className="cc-section-kicker">
                        SECRET MISSION VOTE
                      </div>
                      <h2>Review one mission at a time</h2>
                      <p>
                        A strict majority of Success awards the mission points.
                        Fail or a tie is final and awards zero.
                      </p>
                    </div>
                    <span className="cc-count-pill">
                      {secretReviewOptions.length} to review
                    </span>
                  </div>
                  {secretReviewOptions.length === 0 ? (
                    <p className="cc-helper-text">
                      Submitted secret missions will appear here when players
                      mark them complete.
                    </p>
                  ) : (
                    <>
                      <div className="cc-host-final-controls">
                        <span className="cc-host-final-controls-title">
                          {secretReviewState?.voting_open
                            ? "VOTING IS OPEN"
                            : selectedSecretReview?.status === "results"
                              ? "RESULTS SHARED"
                              : "READY FOR REVIEW"}
                        </span>
                        <label className="cc-host-final-challenge-picker">
                          Choose a secret mission
                          <select
                            value={selectedSecretReviewAssignmentId}
                            disabled={
                              busy || Boolean(secretReviewState?.voting_open)
                            }
                            onChange={(event) =>
                              void selectSecretReviewAssignment(
                                event.target.value,
                              )
                            }
                          >
                            {secretReviewOptions.map((assignment) => {
                              const mission = challenges.find(
                                (item) => item.id === assignment.challenge_id,
                              );
                              const review = secretReviewAssignments.find(
                                (item) => item.assignment_id === assignment.id,
                              );
                              const owner = players.find(
                                (item) => item.id === assignment.player_id,
                              );
                              return (
                                <option
                                  key={assignment.id}
                                  value={assignment.id}
                                >
                                  {mission?.title ?? "Secret mission"} ·{" "}
                                  {owner?.name ?? "Player"}
                                  {review?.status === "results"
                                    ? " · reviewed"
                                    : ""}
                                </option>
                              );
                            })}
                          </select>
                        </label>
                        {selectedSecretReviewChallenge &&
                          selectedSecretReviewAssignment && (
                            <div className="cc-secret-review-summary">
                              <strong>
                                {selectedSecretReviewChallenge.title}
                              </strong>
                              <span>
                                For{" "}
                                {players.find(
                                  (player) =>
                                    player.id ===
                                    selectedSecretReviewAssignment.player_id,
                                )?.name ?? "player"}{" "}
                                · {selectedSecretReviewChallenge.points} points
                                at stake
                              </span>
                              <p>{selectedSecretReviewChallenge.description}</p>
                            </div>
                          )}
                        {selectedSecretReview?.status === "results" ? (
                          <div className="cc-secret-review-result">
                            <strong>
                              {selectedSecretReview.outcome === "success"
                                ? "SUCCESS"
                                : "FAIL"}
                            </strong>
                            <span>
                              {selectedSecretReview.success_votes} Success ·{" "}
                              {selectedSecretReview.fail_votes} Fail ·{" "}
                              {selectedSecretReview.votes_cast} votes
                            </span>
                            <b>
                              {selectedSecretReview.outcome === "success"
                                ? `+${selectedSecretReview.points_awarded} points awarded`
                                : "No points awarded · final result"}
                            </b>
                            <div className="cc-secret-review-voters">
                              {secretReviewVotes
                                .filter(
                                  (vote) =>
                                    vote.assignment_id ===
                                    selectedSecretReviewAssignmentId,
                                )
                                .map((vote) => {
                                  const voter = players.find(
                                    (player) => player.id === vote.player_id,
                                  );
                                  return (
                                    <span key={vote.player_id}>
                                      {voter?.name ?? "Player"} · {vote.vote}
                                    </span>
                                  );
                                })}
                            </div>
                            <strong>Leaderboard changes</strong>
                            <div className="cc-secret-review-leaderboard">
                              {[...players]
                                .sort(
                                  (a, b) =>
                                    b.score - a.score ||
                                    a.name.localeCompare(b.name),
                                )
                                .slice(0, 8)
                                .map((player, index) => (
                                  <span key={player.id}>
                                    <b>
                                      {index + 1}. {player.name}
                                    </b>
                                    <small>{player.score} pts</small>
                                  </span>
                                ))}
                            </div>
                            <div className="cc-host-final-control-grid">
                              <button
                                type="button"
                                className="cc-host-final-control-button"
                                disabled={busy}
                                onClick={() =>
                                  void reopenSecretReviewVote(
                                    selectedSecretReviewAssignmentId,
                                  )
                                }
                              >
                                Reopen voting
                              </button>
                              <button
                                type="button"
                                className="cc-host-final-control-button is-wide is-primary"
                                disabled={busy}
                                onClick={() => void advanceSecretReview()}
                              >
                                {hasPendingSecretReviews
                                  ? "Next challenge"
                                  : "Return all players to the game"}
                              </button>
                            </div>
                          </div>
                        ) : secretReviewState?.voting_open &&
                          secretReviewState.current_assignment_id ===
                            selectedSecretReviewAssignmentId ? (
                          <>
                            <div className="cc-host-final-player-count">
                              <span>Votes cast</span>
                              <strong>
                                {currentSecretReviewVoteCount} /{" "}
                                {players.length}
                              </strong>
                            </div>
                            <div className="cc-host-final-control-grid">
                              <button
                                type="button"
                                className="cc-host-final-control-button is-wide is-primary"
                                disabled={busy}
                                onClick={() => void closeSecretReviewVote()}
                              >
                                Close voting and show results
                              </button>
                            </div>
                            {!session?.host_participates && (
                              <small className="cc-helper-text">
                                To vote as host, enable host participation in
                                Host Controls.
                              </small>
                            )}
                          </>
                        ) : (
                          <div className="cc-host-final-control-grid">
                            <button
                              type="button"
                              className="cc-host-final-control-button is-primary is-wide"
                              disabled={
                                busy || !selectedSecretReviewAssignmentId
                              }
                              onClick={() =>
                                void openSecretReviewVote(
                                  selectedSecretReviewAssignmentId,
                                )
                              }
                            >
                              Open voting for this mission
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </section>
              </>
            )}
            {activeTab === "host-controls" && (
              <section className="cc-session-card cc-session-section">
                <div className="cc-session-section-heading">
                  <div>
                    <div className="cc-section-kicker">ROUND PLAN</div>
                    <h2>Your challenges</h2>
                    <p>
                      Jump to a round at any time while the game is live,
                      including previous rounds.
                    </p>
                  </div>
                  <span className="cc-count-pill">
                    {mainRounds.length} rounds
                  </span>
                </div>
                <div className="cc-challenge-list">
                  {mainRounds.map((round) => (
                    <button
                      type="button"
                      key={round.id}
                      className={`cc-challenge-row${session.status === "live" && round.round_number === session.current_round_number ? " is-current" : ""}`}
                      onClick={() =>
                        session.status === "live" &&
                        requestMoveToRound(Number(round.round_number))
                      }
                      disabled={
                        session.status !== "live" ||
                        round.round_number === session.current_round_number ||
                        busy
                      }
                    >
                      <span className="cc-challenge-index">
                        {round.round_number}
                      </span>
                      <span className="cc-challenge-copy">
                        <strong>{round.title}</strong>
                        <small>{round.description}</small>
                      </span>
                      <span className="cc-challenge-points">
                        {round.points} pts
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}
            {activeTab === "host-controls" &&
              secretReviewState?.is_open &&
              secretReviewState.current_assignment_id ===
                selectedSecretReviewAssignmentId && (
                <section
                  className="cc-session-card cc-host-secret-tv-controls"
                  aria-label="Secret mission TV slideshow controls"
                >
                  {isSecretSlideshowConnected && (
                    <>
                      <button
                        type="button"
                        className="cc-host-final-control-button"
                        disabled={busy || currentSecretReviewEvidenceIndex <= 0}
                        onClick={() =>
                          void setSecretReviewEvidence(
                            selectedSecretReviewEvidence[
                              currentSecretReviewEvidenceIndex - 1
                            ]?.id ?? null,
                          )
                        }
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        className="cc-host-final-control-button"
                        disabled={
                          busy ||
                          currentSecretReviewEvidenceIndex < 0 ||
                          currentSecretReviewEvidenceIndex >=
                            selectedSecretReviewEvidence.length - 1
                        }
                        onClick={() =>
                          void setSecretReviewEvidence(
                            selectedSecretReviewEvidence[
                              currentSecretReviewEvidenceIndex + 1
                            ]?.id ?? null,
                          )
                        }
                      >
                        Next
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    className={`cc-host-final-control-button${isSecretSlideshowConnected ? " is-primary" : ""}`}
                    onClick={() =>
                      isSecretSlideshowConnected
                        ? disconnectSecretReviewSlideshow()
                        : void castSecretReviewSlideshow()
                    }
                  >
                    {isSecretSlideshowConnected ? "Disconnect" : "Cast"}
                  </button>
                </section>
              )}
            {activeTab === "host-controls" && (
              <section
                className="cc-session-card cc-session-section cc-host-main-review-card"
                data-tour="host-review"
              >
                <div className="cc-session-section-heading">
                  <div>
                    <div className="cc-section-kicker">HOST REVIEW</div>
                    <h2>Main challenge submissions</h2>
                    <p>
                      Review evidence from the main rounds and assign points
                      when approving.
                    </p>
                  </div>
                  <span className="cc-count-pill">
                    {
                      submissions.filter(
                        (item) =>
                          item.status === "submitted" &&
                          challengeById.get(item.challenge_id)?.kind === "main",
                      ).length
                    }{" "}
                    pending
                  </span>
                </div>
                {submissions.filter(
                  (item) =>
                    challengeById.get(item.challenge_id)?.kind === "main",
                ).length === 0 ? (
                  <p className="cc-helper-text">
                    Main challenge submissions will appear here as players
                    submit them.
                  </p>
                ) : (
                  <div className="cc-submission-list">
                    {submissions
                      .filter(
                        (item) =>
                          challengeById.get(item.challenge_id)?.kind === "main",
                      )
                      .map((submission) => {
                        const player = playerById.get(submission.player_id);
                        const challenge = challengeById.get(
                          submission.challenge_id,
                        );
                        const submissionMedia = evidenceForChallenge(
                          submission.player_id,
                          submission.challenge_id,
                        );
                        return (
                          <article
                            className="cc-submission-row"
                            key={submission.id}
                          >
                            <div className="cc-submission-info">
                              <strong>{player?.name ?? "Player"}</strong>
                              <span>
                                {challenge?.title ?? "Main challenge"}
                              </span>
                              <small>
                                {new Date(
                                  submission.submitted_at,
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </small>
                            </div>
                            <span
                              className={`cc-submission-status cc-submission-status--${submission.status}`}
                            >
                              {submission.status === "submitted"
                                ? "Needs review"
                                : submission.status === "approved"
                                  ? `+${submission.awarded_points} pts`
                                  : "Rejected"}
                            </span>
                            {submissionMedia.length > 0 && (
                              <div className="cc-session-evidence-gallery">
                                <strong>
                                  {submissionMedia.length} evidence file
                                  {submissionMedia.length === 1 ? "" : "s"}
                                </strong>
                                <div className="cc-session-evidence-grid">
                                  {submissionMedia.map((media) => (
                                    <div
                                      className="cc-session-evidence-item"
                                      key={media.id}
                                    >
                                      {media.media_type === "video" ? (
                                        <video
                                          src={evidenceUrl(media.storage_path)}
                                          controls
                                          playsInline
                                          preload="metadata"
                                        />
                                      ) : (
                                        <img
                                          src={evidenceUrl(media.storage_path)}
                                          alt={`Evidence for ${challenge?.title ?? "challenge"}`}
                                          loading="lazy"
                                        />
                                      )}
                                      <div className="cc-session-evidence-meta">
                                        <small>
                                          {media.media_type === "video"
                                            ? "Video evidence"
                                            : "Photo evidence"}
                                        </small>
                                        <small>
                                          Main-round media isn't included in the
                                          final vote.
                                        </small>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {submission.status === "submitted" && (
                              <div className="cc-submission-actions">
                                <button
                                  type="button"
                                  className="host-button host-button--lime"
                                  disabled={busy}
                                  onClick={() =>
                                    void reviewSubmission(submission, true)
                                  }
                                >
                                  <Icon
                                    name="check"
                                    className="icon--size-15"
                                  />{" "}
                                  Approve & award points
                                </button>
                                <button
                                  type="button"
                                  className="host-button host-button--ghost"
                                  disabled={busy}
                                  onClick={() =>
                                    void reviewSubmission(submission, false)
                                  }
                                >
                                  <Icon name="x" className="icon--size-15" />{" "}
                                  Reject
                                </button>
                              </div>
                            )}
                          </article>
                        );
                      })}
                  </div>
                )}
              </section>
            )}
            {activeTab === "host-controls" && (
              <section
                className="cc-session-card cc-session-section cc-host-side-review-card"
                data-tour="host-side-review"
              >
                <div className="cc-session-section-heading">
                  <div>
                    <div className="cc-section-kicker">
                      SIDE CHALLENGE SUBMISSIONS
                    </div>
                    <h2>Player submissions</h2>
                    <p>
                      Every submission is automatically approved for 5 points.
                      Tied top submissions also receive the challenge bonus.
                    </p>
                  </div>
                  <span className="cc-count-pill">
                    {sideSubmissions.length} submissions
                  </span>
                </div>
                {sideSubmissions.length === 0 ? (
                  <p className="cc-helper-text">
                    Side-challenge submissions will appear here automatically
                    after players submit evidence.
                  </p>
                ) : (
                  <div className="cc-submission-list">
                    {sideSubmissions.map((submission) => {
                      const player = playerById.get(submission.player_id);
                      const challenge = challengeById.get(
                        submission.challenge_id,
                      );
                      const submissionMedia = evidenceForChallenge(
                        submission.player_id,
                        submission.challenge_id,
                      );
                      return (
                        <article
                          className="cc-submission-row"
                          key={submission.id}
                        >
                          <div className="cc-submission-info">
                            <strong>{player?.name ?? "Player"}</strong>
                            <span>{challenge?.title ?? "Side challenge"}</span>
                            <small>
                              {new Date(
                                submission.submitted_at,
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </small>
                          </div>
                          <span
                            className={`cc-submission-status cc-submission-status--${submission.status}`}
                          >
                            {submission.status === "approved"
                              ? `Auto-approved · +${submission.awarded_points} pts`
                              : submission.status === "submitted"
                                ? "Awaiting automatic approval"
                                : "Rejected"}
                          </span>
                          {submissionMedia.length > 0 && (
                            <div className="cc-session-evidence-gallery">
                              <strong>
                                {submissionMedia.length} evidence file
                                {submissionMedia.length === 1 ? "" : "s"}
                              </strong>
                              <div className="cc-session-evidence-grid">
                                {submissionMedia.map((media) => (
                                  <div
                                    className="cc-session-evidence-item"
                                    key={media.id}
                                  >
                                    {media.media_type === "video" ? (
                                      <video
                                        src={evidenceUrl(media.storage_path)}
                                        controls
                                        playsInline
                                        preload="metadata"
                                      />
                                    ) : (
                                      <img
                                        src={evidenceUrl(media.storage_path)}
                                        alt={`Evidence for ${challenge?.title ?? "side challenge"}`}
                                        loading="lazy"
                                      />
                                    )}
                                    <div className="cc-session-evidence-meta">
                                      <small>
                                        {media.media_type === "video"
                                          ? "Video evidence · included in final vote"
                                          : "Photo evidence · included in final vote"}
                                      </small>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            )}
          </HostManagement>
        </>
      )}
    </SessionPage>
  );
}
