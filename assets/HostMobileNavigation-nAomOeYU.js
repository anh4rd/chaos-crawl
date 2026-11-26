var e=`import { interceptHostNavigation } from "./navigation";
import { NavLink } from "react-router-dom";
import Icon from "../ui/Icon";
export default function HostMobileNavigation({
  onNavigate,
}: {
  onNavigate?: (href: string) => void;
}) {
  return (
    <nav className="mobile-navigation" aria-label="Host navigation">
      <NavLink
        onClick={(event) => interceptHostNavigation(event, onNavigate)}
        to="/host"
        end
      >
        <Icon name="home" className="icon--size-18" />
        <span>Home</span>
      </NavLink>
      <NavLink
        onClick={(event) => interceptHostNavigation(event, onNavigate)}
        to="/host/games"
      >
        <Icon name="gamepad2" className="icon--size-18" />
        <span>Games</span>
      </NavLink>
      <NavLink
        onClick={(event) => interceptHostNavigation(event, onNavigate)}
        to="/host/explore"
      >
        <Icon name="compass" className="icon--size-18" />
        <span>Explore</span>
      </NavLink>
      <NavLink
        onClick={(event) => interceptHostNavigation(event, onNavigate)}
        to="/host/saved"
      >
        <Icon name="heart" className="icon--size-18" />
        <span>Saved</span>
      </NavLink>
    </nav>
  );
}
`;export{e as default};