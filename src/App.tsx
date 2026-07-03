import {
  lazy,
  Suspense,
} from "react";

import {
  Routes,
  Route,
} from "react-router-dom";

const Join = lazy(
  () => import("./pages/Join")
);

const Game = lazy(
  () => import("./pages/Game")
);

const Admin = lazy(
  () => import("./pages/Admin")
);

const Leaderboard = lazy(
  () => import("./pages/Leaderboard")
);

const Vote = lazy(
  () => import("./pages/Vote")
);

const Slideshow = lazy(
  () => import("./pages/Slideshow")
);

const VoteResults = lazy(
  () => import("./pages/VoteResults")
);

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
        <Route
          path="/"
          element={<Join />}
        />

        <Route
          path="/game"
          element={<Game />}
        />

        <Route
          path="/admin"
          element={<Admin />}
        />

        <Route
          path="/leaderboard"
          element={<Leaderboard />}
        />

        <Route
          path="/vote"
          element={<Vote />}
        />

        <Route
          path="/slideshow"
          element={<Slideshow />}
        />
      </Routes>
      <Route
  path="/vote-results"
  element={<VoteResults />}
/>
    </Suspense>
  );
}