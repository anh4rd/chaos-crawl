import { interceptHostNavigation } from "./navigation";
import { NavLink } from "react-router-dom";
import Icon from "../ui/Icon";
export default function HostNavigation({
  onNavigate,
}: {
  onNavigate?: (href: string) => void;
}) {
  return (
    <nav className="host-navigation" aria-label="Main navigation">
      <NavLink
        onClick={(event) => interceptHostNavigation(event, onNavigate)}
        to="/host/games/new"
        className={({ isActive }) =>
          `host-navigation__link${isActive ? " host-navigation__link--active" : ""}`
        }
      >
        <Icon name="plus" className="icon--size-17" /> Plan game
      </NavLink>
      <NavLink
        onClick={(event) => interceptHostNavigation(event, onNavigate)}
        to="/host/games"
        className={({ isActive }) =>
          `host-navigation__link${isActive ? " host-navigation__link--active" : ""}`
        }
      >
        <Icon name="gamepad2" className="icon--size-17" /> My games
      </NavLink>
      <NavLink
        onClick={(event) => interceptHostNavigation(event, onNavigate)}
        to="/host/explore"
        className={({ isActive }) =>
          `host-navigation__link${isActive ? " host-navigation__link--active" : ""}`
        }
      >
        <Icon name="compass" className="icon--size-17" /> Explore
      </NavLink>
      <NavLink
        onClick={(event) => interceptHostNavigation(event, onNavigate)}
        to="/host/saved"
        className={({ isActive }) =>
          `host-navigation__link${isActive ? " host-navigation__link--active" : ""}`
        }
      >
        <Icon name="heart" className="icon--size-17" /> Saved
      </NavLink>
    </nav>
  );
}
