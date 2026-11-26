var e=`import Icon from "../ui/Icon";
export default function SessionFeedback({
  message,
  kind = "error",
  onDismiss,
}: {
  message: string;
  kind?: "error" | "success";
  onDismiss?: () => void;
}) {
  return (
    <div
      className={\`session-feedback session-feedback--\${kind}\`}
      role={kind === "error" ? "alert" : "status"}
    >
      <span>{message}</span>
      {onDismiss && (
        <button
          type="button"
          aria-label={\`Dismiss \${kind === "error" ? "error" : "notice"}\`}
          onClick={onDismiss}
        >
          <Icon name="x" className="icon--size-16" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
`;export{e as default};