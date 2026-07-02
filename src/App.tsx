import { Routes, Route } from "react-router-dom";

import Join from "./pages/Join";
import Game from "./pages/Game";

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Join />}
      />
      <Route
        path="/game"
        element={<Game />}
      />
    </Routes>
  );
}