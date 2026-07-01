import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home.tsx";
import Join from "./pages/Join.tsx";
import Game from "./pages/Game.tsx";
import Leaderboard from "./pages/Leaderboard.tsx";
import Admin from "./pages/Admin.tsx";
import Presentation from "./pages/Presentation.tsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/join" element={<Join />} />
      <Route path="/game" element={<Game />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/presentation" element={<Presentation />} />
    </Routes>
  );
}