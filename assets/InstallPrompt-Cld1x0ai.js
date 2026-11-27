var e=`import Button from "../../components/ui/Button";

export type InstallPromptMode =
  | "ios"
  | "android"
  | "browser"
  | "unavailable"
  | "notifications"
  | "notification-error";

export default function InstallPrompt({
  mode,
  onInstall,
  onEnableNotifications,
  onDismiss,
}: {
  mode: InstallPromptMode;
  onInstall: () => void;
  onEnableNotifications: () => void;
  onDismiss: () => void;
}) {
  const descriptions: Record<InstallPromptMode, string> = {
    ios: "Tap Share, then Add to Home Screen. Open the installed app to enable notifications. If you don't see the option, open this page in Safari.",
    android:
      "Open your browser's menu and choose Install app or Add to Home Screen.",
    browser: "Install the app for quick access from your home screen.",
    unavailable:
      "Installation could not be started. Use your browser's menu to add Chaos Crawl to your home screen.",
    notifications:
      "Allow notifications for future game updates. You can change this later in your device settings.",
    "notification-error":
      "Could not request notification permission. Check your device settings and try again later.",
  };
  return (
    <section
      className="install-prompt"
      aria-label="Install Chaos Crawl"
      aria-live="polite"
    >
      <div className="install-prompt__copy">
        <strong>
          {mode === "notifications" || mode === "notification-error"
            ? "Enable notifications"
            : "Take Chaos Crawl with you"}
        </strong>
        <p>{descriptions[mode]}</p>
      </div>
      <div className="install-prompt__actions">
        {mode === "browser" && (
          <Button
            type="button"
            variant="comic-primary"
            fullWidth={false}
            onClick={onInstall}
          >
            Install app
          </Button>
        )}
        {mode === "notifications" && (
          <Button
            type="button"
            variant="comic-primary"
            fullWidth={false}
            onClick={onEnableNotifications}
          >
            Allow notifications
          </Button>
        )}
        <Button
          type="button"
          variant="comic-secondary"
          fullWidth={false}
          onClick={onDismiss}
        >
          Not now
        </Button>
      </div>
    </section>
  );
}
`;export{e as default};