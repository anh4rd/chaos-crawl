import PageFrame from "./components/ui/PageFrame";
import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";

const Join = lazy(() => import("./pages/Join"));
const Game = lazy(() => import("./pages/Game"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Vote = lazy(() => import("./pages/Vote"));
const SessionFinalSlideshow = lazy(
  () => import("./pages/SessionFinalSlideshow"),
);
const SessionSecretSlideshow = lazy(
  () => import("./pages/SessionSecretSlideshow"),
);
const VoteResults = lazy(() => import("./pages/VoteResults"));
const SessionPlayerGame = lazy(() => import("./pages/SessionPlayerGame"));
const HostLiveSession = lazy(() => import("./pages/HostLiveSession"));

const HostLogin = lazy(() => import("./pages/HostLogin"));
const InviteLanding = lazy(() => import("./pages/InviteLanding"));
const PlayerDemo = lazy(() => import("./pages/PlayerDemo"));
const Styleguide = lazy(() => import("./pages/Styleguide"));
const SuperAdmin = lazy(() => import("./pages/SuperAdmin"));
const HostHub = lazy(() => import("./pages/HostHub"));
const HostPlanSetup = lazy(() => import("./pages/HostPlanSetup"));
const HostSaved = lazy(() => import("./pages/HostSaved"));
const HostExplore = lazy(() => import("./pages/HostExplore"));
const HostGuard = lazy(() => import("./components/host/HostGuard"));
const ChallengeReview = lazy(() => import("./pages/ChallengeReview"));

export default function App() {
  return (
    <Suspense
      fallback={
        <PageFrame variant="suspense">
          <p>Loading chaos...</p>
        </PageFrame>
      }
    >
      <Routes>
        {/* Existing player and live-game routes remain unchanged. */}
        <Route path="/" element={<Join />} />
        <Route path="/join" element={<Join />} />
        <Route path="/invite/:joinCode" element={<InviteLanding />} />
        <Route path="/demo/player" element={<PlayerDemo />} />
        <Route path="/styleguide" element={<Styleguide />} />
        <Route path="/component-test" element={<Styleguide />} />
        <Route path="/game" element={<Game />} />
        <Route path="/play/:joinCode" element={<SessionPlayerGame />} />
        <Route path="/play/:joinCode/:page" element={<SessionPlayerGame />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/vote" element={<Vote />} />
        <Route
          path="/final-slideshow/:sessionId"
          element={<SessionFinalSlideshow />}
        />
        <Route
          path="/secret-slideshow/:sessionId"
          element={<SessionSecretSlideshow />}
        />
        <Route path="/vote-results" element={<VoteResults />} />

        {/* Host authentication is separate from the player join flow. */}
        <Route path="/host/login" element={<HostLogin />} />
        <Route element={<HostGuard />}>
          <Route path="/challenge-review" element={<ChallengeReview />} />
          <Route path="/host/live/:sessionId" element={<HostLiveSession />} />
          <Route path="/host" element={<HostHub />} />
          <Route path="/host/games/new" element={<HostPlanSetup />} />
          <Route path="/host/games/:id/edit" element={<HostPlanSetup />} />
          <Route path="/host/saved" element={<HostSaved />} />
          <Route path="/host/explore" element={<HostExplore />} />
          <Route path="/host/super-admin" element={<SuperAdmin />} />
          <Route path="/host/games" element={<HostHub />} />
        </Route>
        <Route path="*" element={<Join />} />
      </Routes>
    </Suspense>
  );
}
