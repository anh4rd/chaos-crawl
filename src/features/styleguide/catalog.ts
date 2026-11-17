/** Notes describe the existing contracts; components stay owned by their features. */
const notes: Record<string, { usage: string; dependencies: string }> = {
  Button: {
    usage:
      'Primary action. fullWidth defaults to true; accepts native button props and className. Set type="button" outside form submission.',
    dependencies: "None. Import from src/components/ui/Button.",
  },
  Card: {
    usage:
      "White rounded surface. Compose content through children; extend with className.",
    dependencies: "None. Import from src/components/ui/Card.",
  },
  Input: {
    usage:
      "Text, email and number fields. Accepts native input props; provide a visible label with htmlFor.",
    dependencies: "None. Import from src/components/ui/Input.",
  },
  DataError: {
    usage:
      'Full-page error and retry. Pass error: Error and retry: () => Promise<void>. Defaults to a main landmark; use as="div" when embedded in another page.',
    dependencies: "None; retry is supplied by the caller.",
  },
  HostGuard: {
    usage:
      "Authentication route boundary. Nest protected routes inside this component; it renders an Outlet.",
    dependencies: "Router and Supabase authentication.",
  },
  HostShell: {
    usage:
      "Host layout with title, subtitle, sidebar, contextPanel and children. showCreate controls the create action.",
    dependencies:
      "Router, Supabase auth, HostPortal.css and HostTheme.css. Even previewUser mode reads auth.",
  },
  SessionGameChrome: {
    usage:
      "Named exports: SessionPlayerProfile (viewerRole, name, subtitle, score, rank, optional avatarUrl/badge) and SessionGameTitlebar (name, code, onCopy, optional photoUrl/copied).",
    dependencies:
      "PlayerGame.css; profile host link needs a Router. Both have live examples above.",
  },
  SessionMainChallengeCard: {
    usage:
      "Shared host/player challenge. Supply viewerRole, title, description, points, round, roundCount, durationMinutes, timerLabel and timerCaption. Compose buttons through action.",
    dependencies:
      "PlayerGame.css. No data hooks; timer text is supplied by the caller.",
  },
  GuidedTour: {
    usage:
      "Pass steps with CSS target, title and body, plus onClose. Optional page/onNavigate supports multi-page tours.",
    dependencies:
      "Mounted DOM targets. Imports GuidedTour.css; renders a portal into document.body.",
  },
  ScheduledCountdown: {
    usage:
      "Pass targetTime as an ISO date string. Updates every second; missing time renders nothing; expired time shows 00:00.",
    dependencies: "Browser timer only. Live example above.",
  },
  QueryPanel: {
    usage:
      "Wrap query content with queries: { loading, error, reload }[], loadingText and children. Keeps a previously loaded snapshot visible during refresh.",
    dependencies:
      "Caller-supplied query state; no internal backend access. Live states above.",
  },
  ChallengeActions: {
    usage:
      "Completion/upload buttons. Pass challenge: { id, title, points, type }, allowMedia and participation.",
    dependencies:
      "useChallengeParticipation contract; use a local adapter in demos. Live example above.",
  },
  LiveTask: {
    usage:
      "Legacy main challenge card. Pass challenge, game and participation; handles waiting and completed states.",
    dependencies:
      "GameState and Challenge types; caller-supplied participation. Live example above.",
  },
  SideChallenges: {
    usage:
      "Legacy Chaos Bingo list. Pass challenges and participation; completed challenges are filtered out.",
    dependencies: "SideChallenge[] and useChallengeParticipation contract.",
  },
  HostChallengeCard: {
    usage:
      "Host bingo card with completion badges and review navigation. Pass challenge, completedBy and participation.",
    dependencies: "Router, SideChallenge, Player[] and participation contract.",
  },
  Ballot: {
    usage:
      "Player/team voting workflow. Pass playerId, challenge, target, players, teams and fromAdmin.",
    dependencies:
      "Router, saved player session and useBallot backend reads/writes.",
  },
  ChallengeReviewContent: {
    usage:
      "Submission review list. Pass challengeType, challengeId and challengeTitle; handles loading, error and empty states.",
    dependencies: "usePlayers and useChallengeReview live queries.",
  },
  SubmissionCard: {
    usage:
      "Submission media and point award form. Pass completion, player, media, challengeType, challengeId and challengeTitle.",
    dependencies:
      "useSubmissionAward writes score events. Use inside an authenticated review workflow.",
  },
  MediaSlide: {
    usage:
      "Single full-screen image/video. Pass media, paused and next; handles load failure and blocked playback.",
    dependencies: "Media type and accessible media URL; sized to the viewport.",
  },
  SlideshowPlayer: {
    usage:
      "Full-screen media sequence with host playback controls. Pass media, isHost, ending, end and reload.",
    dependencies:
      "Media[], useSlideshowPlayback and caller-supplied lifecycle callbacks. Owns a main landmark.",
  },
  PlayerNameEditor: {
    usage: "Editable player name form. Pass playerId, name and async reload.",
    dependencies: "renamePlayer backend mutation; render within host controls.",
  },
  PlayersTab: {
    usage:
      "Player administration with renaming, manual score changes and deletion. No props.",
    dependencies: "Live player/score queries and backend mutations.",
  },
  TeamsTab: {
    usage: "Team creation and player assignment. No props.",
    dependencies: "Live player/team queries and useTeamManagement mutations.",
  },
  ParticipationTab: {
    usage:
      "Host participation as a selected player, including bingo completions. No props.",
    dependencies: "Live game/player/challenge/completion queries and uploads.",
  },
  CompletionReviewTab: {
    usage:
      "Read-only list of challenge completions, players, points and media indicators. No props.",
    dependencies: "Live player, challenge and completion queries.",
  },
  VotingTab: {
    usage: "Host voting controls and results. No props.",
    dependencies:
      "Router, live votes/game/player/team queries and voting mutations.",
  },
  GameControlTabs: {
    usage: "Host game controls. activeTab is live, tonight or screens.",
    dependencies:
      "useGameControls live queries and mutations; composes the control panels below.",
  },
  LiveGameSelection: {
    usage:
      "Select a pub/challenge and launch it. Pass game, pubs, sortedPubs, challenges, availableChallenges, selectedPub/selectedChallenge with setters, goLive and navigate.",
    dependencies:
      "Caller-supplied GameState and callbacks. goLive changes the current game.",
  },
  RoundChallenges: {
    usage:
      "Challenge sequence with LIVE, DONE and NEXT states. Pass game, currentRoundChallenges, currentChallengeIndex, nextRoundChallenge and revealRoundChallenge.",
    dependencies: "Caller-supplied data and reveal callback.",
  },
  ScreenControls: {
    usage:
      "Leaderboard/slideshow controls. Pass game, navigate, startSlideshow and stopSlideshow.",
    dependencies: "Caller-supplied screen lifecycle callbacks.",
  },
  TonightControls: {
    usage:
      "Round progression, timed reveals, voting and slideshow panel. See TonightControlsProps for the complete callback contract.",
    dependencies:
      "GameState, challenge/pub data, callbacks and direct voting mutations.",
  },
};

// Discover modules without importing them or starting their live data hooks.
const modules = import.meta.glob([
  "/src/components/**/*.tsx",
  "/src/features/**/*.tsx",
  "!/src/**/*.test.tsx",
  "!/src/features/styleguide/**",
]);

export const componentCatalog = Object.keys(modules)
  .sort()
  .map((path) => {
    const name = path.split("/").at(-1)!.replace(".tsx", "");
    return {
      name,
      path: path.slice(1),
      group: path.includes("/components/ui/")
        ? "Primitives"
        : path.includes("/components/")
          ? "Shared components"
          : "Features",
      ...(notes[name] ?? {
        usage: "See the source module for its props and usage.",
        dependencies: "Check the source before integrating.",
      }),
    };
  });
