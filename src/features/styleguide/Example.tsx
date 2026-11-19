import Icon from "../../components/ui/Icon";

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
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopyStatus("Copied");
    } catch {
      setCopyStatus("Select the code to copy manually.");
    }
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
          >
            <Icon name="copy" className="icon--size-14" /> Copy code
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
