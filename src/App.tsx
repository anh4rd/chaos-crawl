import { Routes, Route } from "react-router-dom";

import Join from "./pages/Join";
import Game from "./pages/Game";
import Leaderboard from "./pages/Leaderboard";
import Admin from "./pages/Admin";
import Slideshow from "./pages/Slideshow";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Join />} />
      <Route path="/game" element={<Game />} />
      <Route
        path="/leaderboard"
        element={<Leaderboard />}
      />
      <Route
        path="/admin"
        element={<Admin />}
      />
      <Route
    path="/slideshow"
    element={<Slideshow />}
/>
    </Routes>
  );
}