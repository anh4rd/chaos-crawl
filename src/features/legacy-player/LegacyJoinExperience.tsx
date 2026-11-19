import { useNavigate } from "react-router-dom";
import LegacyJoinView from "./LegacyJoinView";
import { useLegacyJoin } from "./useLegacyJoin";

export default function LegacyJoinExperience() {
  const navigate = useNavigate();
  const join = useLegacyJoin(() => navigate("/game"));
  return <LegacyJoinView {...join} />;
}
