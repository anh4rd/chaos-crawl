import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";

const Join = lazy(() => import("./pages/Join"));
const Game = lazy(() => import("./pages/Game"));
const Admin = lazy(() => import("./pages/Admin"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Vote = lazy(() => import("./pages/Vote"));
const Slideshow = lazy(() => import("./pages/Slideshow"));
const VoteResults = lazy(() => import("./pages/VoteResults"));
const SessionPlayerGame = lazy(() => import("./pages/SessionPlayerGame"));
const HostLiveSession = lazy(() => import("./pages/HostLiveSession"));

const HostLogin = lazy(() => import("./pages/HostLogin"));
const HostHub = lazy(() => import("./pages/HostHub"));
const HostPlanSetup = lazy(() => import("./pages/HostPlanSetup"));
const HostSaved = lazy(() => import("./pages/HostSaved"));
const HostExplore = lazy(() => import("./pages/HostExplore"));
const HostGuard = lazy(() => import("./components/host/HostGuard"));

export default function App() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center p-6">
          <p>Loading chaos...</p>
        </main>
      }
    >
      <Routes>
        {/* Existing player and live-game routes remain unchanged. */}
        <Route path="/" element={<Join />} />
        <Route path="/join" element={<Join />} />
        <Route path="/game" element={<Game />} />
        <Route path="/play/:joinCode" element={<SessionPlayerGame />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/vote" element={<Vote />} />
        <Route path="/slideshow" element={<Slideshow />} />
        <Route path="/vote-results" element={<VoteResults />} />

        {/* Host authentication is separate from the player join flow. */}
        <Route path="/host/login" element={<HostLogin />} />
        <Route element={<HostGuard />}>
          <Route path="/admin" element={<Admin />} />
          <Route path="/host/live/:sessionId" element={<HostLiveSession />} />
          <Route path="/host" element={<HostHub />} />
          <Route path="/host/games/new" element={<HostPlanSetup />} />
          <Route path="/host/games/:id/edit" element={<HostPlanSetup />} />
          <Route path="/host/saved" element={<HostSaved />} />
          <Route path="/host/explore" element={<HostExplore />} />
          <Route path="/host/games" element={<HostHub />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
