import { useId, useState } from "react";
import HostWorkspaceNavigation from "../../components/session/HostWorkspaceNavigation";
import { Example } from "./Example";

const items = [
  { id: "controls", label: "Controls", icon: "gamepad2" },
  { id: "review", label: "Review", icon: "trophy" },
  { id: "teams", label: "Teams", icon: "users" },
  { id: "schedule", label: "Schedule", icon: "calendar-days" },
  { id: "settings", label: "Settings", icon: "settings" },
] as const;

export default function HostWorkspaceNavigationExample() {
  const id = useId();
  const [active, setActive] = useState<string>("controls");
  return (
    <Example
      title="Host workspace navigation"
      source="src/components/session/HostWorkspaceNavigation.tsx"
      code={
        "<HostWorkspaceNavigation items={items} active={active} idPrefix={id} onSelect={setActive} />"
      }
    >
      <HostWorkspaceNavigation
        items={items}
        active={active}
        idPrefix={id}
        onSelect={setActive}
      />
      <div
        role="tabpanel"
        id={`${id}-panel-${active}`}
        aria-labelledby={`${id}-tab-${active}`}
      >
        Local panel for {active}.
      </div>
    </Example>
  );
}
