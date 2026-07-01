import { useNavigate } from "react-router-dom";

import Page from "../components/layout/Page.tsx";
import Button from "../components/ui/Button.tsx";

export default function Home() {
  const navigate = useNavigate();

  return (
    <Page title="🎉 London Games">

      <p
        style={{
          opacity: .75,
          marginBottom: 40,
          lineHeight: 1.6
        }}
      >
        Welcome to tonight's game.
      </p>

      <Button onClick={() => navigate("/join")}>
        Join Game
      </Button>

      <Button onClick={() => navigate("/leaderboard")}>
        Leaderboard
      </Button>

      <Button onClick={() => navigate("/admin")}>
        Admin
      </Button>

    </Page>
  );
}