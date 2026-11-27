import { useState } from "react";
import InstallPrompt from "../install/InstallPrompt";
import { Example } from "./Example";

export default function InstallPromptExample() {
  const [mode, setMode] = useState<
    "ios" | "android" | "browser" | "notifications"
  >("ios");
  const [message, setMessage] = useState("");
  return (
    <Example
      title="Install and notification prompts"
      source="src/features/install/InstallPrompt.tsx"
      code={'<InstallPrompt mode="ios" {...callbacks} />'}
    >
      <label>
        Preview prompt
        <select
          value={mode}
          onChange={(event) => {
            const value = event.target.value;
            if (
              value === "ios" ||
              value === "android" ||
              value === "browser" ||
              value === "notifications"
            )
              setMode(value);
          }}
        >
          <option value="ios">iOS instructions</option>
          <option value="android">Android instructions</option>
          <option value="browser">Browser install</option>
          <option value="notifications">Notification permission</option>
        </select>
      </label>
      <InstallPrompt
        mode={mode}
        onInstall={() => setMessage("Sample install selected.")}
        onEnableNotifications={() =>
          setMessage("Sample notification permission selected.")
        }
        onDismiss={() => setMessage("Sample prompt dismissed.")}
      />
      <output>{message}</output>
    </Example>
  );
}
