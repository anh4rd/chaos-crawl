var e=`import { useEffect, useRef, useState } from "react";
import InstallPrompt from "./InstallPrompt";
import type { InstallPromptMode } from "./InstallPrompt";

interface BrowserInstallEvent extends Event {
  prompt: () => Promise<unknown>;
}

function isInstalled() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && navigator.standalone === true)
  );
}

function isIos() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function canRequestNotifications() {
  return "Notification" in window && Notification.permission === "default";
}

function isBrowserInstallEvent(event: Event): event is BrowserInstallEvent {
  return "prompt" in event && typeof event.prompt === "function";
}

export default function InstallPromptController() {
  const [mode, setMode] = useState<InstallPromptMode | null>(null);
  const installEvent = useRef<BrowserInstallEvent | null>(null);
  const generation = useRef(0);
  const dismissed = useRef(false);

  useEffect(() => {
    if (isInstalled() && canRequestNotifications()) setMode("notifications");
    else if (!isInstalled() && isIos()) setMode("ios");
    else if (!isInstalled() && /Android/.test(navigator.userAgent))
      setMode("android");
    function onBeforeInstall(event: Event) {
      if (!isBrowserInstallEvent(event)) return;
      event.preventDefault();
      if (isInstalled() || dismissed.current) return;
      installEvent.current = event;
      setMode("browser");
    }
    function onInstalled() {
      generation.current += 1;
      installEvent.current = null;
      setMode(canRequestNotifications() ? "notifications" : null);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      generation.current += 1;
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function dismiss() {
    generation.current += 1;
    dismissed.current = true;
    installEvent.current = null;
    setMode(null);
  }

  async function install() {
    const event = installEvent.current;
    if (!event) return;
    installEvent.current = null;
    const currentGeneration = ++generation.current;
    setMode(null);
    try {
      await event.prompt();
    } catch (error) {
      console.error("Could not start app installation.", error);
      if (generation.current === currentGeneration) setMode("unavailable");
    }
  }

  async function enableNotifications() {
    const currentGeneration = ++generation.current;
    setMode(null);
    try {
      await Notification.requestPermission();
    } catch (error) {
      console.error("Could not request notification permission.", error);
      if (generation.current === currentGeneration)
        setMode("notification-error");
    }
  }

  if (!mode) return null;
  return (
    <InstallPrompt
      mode={mode}
      onInstall={() => void install()}
      onEnableNotifications={() => void enableNotifications()}
      onDismiss={dismiss}
    />
  );
}
`;export{e as default};