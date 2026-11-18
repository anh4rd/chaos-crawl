import { useLocation, useSearchParams } from "react-router-dom";
import HostDashboard from "../features/host-hub/HostDashboard";
export default function HostHub() {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  return (
    <HostDashboard
      view={pathname === "/host/games" ? "games" : "home"}
      viewAsHostId={searchParams.get("viewAs")}
      created={searchParams.get("created") === "1"}
    />
  );
}
