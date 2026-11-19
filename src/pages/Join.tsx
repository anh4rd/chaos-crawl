import { useNavigate, useSearchParams } from "react-router-dom";
import PlayerAccess from "../features/player-access/PlayerAccess";

export default function Join() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const codeFromUrl = (searchParams.get("code") ?? "")
    .replace(/\D/g, "")
    .slice(0, 6);
  return (
    <PlayerAccess
      codeFromUrl={codeFromUrl}
      initialMode={searchParams.get("returning") === "1" ? "rejoin" : "join"}
      onJoined={(result) =>
        navigate(`/play/${result.join_code}`, {
          replace: true,
          state: { welcomeBack: result.resumed },
        })
      }
    />
  );
}
