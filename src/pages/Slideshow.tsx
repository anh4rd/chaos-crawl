import { useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import LegacySlideshow from "../features/slideshow/LegacySlideshow";

export default function Slideshow() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const onReturn = useCallback(
    (host: boolean) => navigate(host ? "/admin" : "/game", { replace: true }),
    [navigate],
  );
  return (
    <LegacySlideshow
      isHost={searchParams.get("host") === "true"}
      onReturn={onReturn}
    />
  );
}
