import Icon from "../../components/ui/Icon";
import { useClipboard } from "../../components/ui/useClipboard";

import { useState, type ReactNode } from "react";

export function Example({
  title,
  source,
  code,
  children,
  className = "",
}: {
  title: string;
  source: string;
  code: string;
  children: ReactNode;
  className?: string;
}) {
  const [copyStatus, setCopyStatus] = useState("");
  const { copied, copy: copyText } = useClipboard({
    text: code,
    resetAfterMs: 1800,
  });
  async function copy() {
    const result = await copyText();
    if (result === "copied") setCopyStatus("");
    if (result === "failed") setCopyStatus("Select the code to copy manually.");
  }
  return (
    <article className={`component-example ${className}`.trim()}>
      <header className="component-example__header">
        <h3 className="component-example__title">{title}</h3>
        <code className="component-example__source">{source}</code>
      </header>
      <div className="component-example__preview">{children}</div>
      <details className="component-example__usage">
        <summary className="component-example__summary">Usage example</summary>
        <div className="component-example__toolbar">
          <button
            className="component-example__copy-button"
            type="button"
            onClick={() => void copy()}
            aria-label={copied ? "Code copied" : "Copy code"}
          >
            <Icon name={copied ? "check" : "copy"} className="icon--size-14" />{" "}
            Copy code
          </button>
          <span role="status">{copyStatus}</span>
        </div>
        <pre className="component-example__code">
          <code>{code}</code>
        </pre>
      </details>
    </article>
  );
}
