import Icon from "../../components/ui/Icon";

import { useState, type ReactNode } from "react";

export function Example({
  title,
  source,
  code,
  children,
}: {
  title: string;
  source: string;
  code: string;
  children: ReactNode;
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
    <article className="sg-example">
      <header>
        <h3>{title}</h3>
        <code>{source}</code>
      </header>
      <div className="sg-preview">{children}</div>
      <details>
        <summary>Usage example</summary>
        <div className="sg-code-toolbar">
          <button type="button" onClick={() => void copy()}>
            <Icon name="copy" className="icon--size-14" /> Copy code
          </button>
          <span role="status">{copyStatus}</span>
        </div>
        <pre>
          <code>{code}</code>
        </pre>
      </details>
    </article>
  );
}
