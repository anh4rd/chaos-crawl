import Icon from "../../components/ui/Icon";

import { useState } from "react";
import { componentCatalog } from "./catalog";

export function Catalog() {
  const [search, setSearch] = useState("");
  const entries = componentCatalog.filter((entry) =>
    `${entry.name} ${entry.path} ${entry.group} ${entry.usage} ${entry.dependencies}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );
  return (
    <>
      <label className="sg-search">
        <Icon name="search" className="icon--size-19" />
        <span className="sg-sr-only">Search component catalog</span>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search components, props or source paths…"
          type="search"
        />
      </label>
      <p className="sg-note" role="status">
        {entries.length} of {componentCatalog.length} component modules
      </p>
      <div className="sg-catalog">
        {entries.map((entry) => (
          <article key={entry.path}>
            <div>
              <span className="sg-tag">{entry.group}</span>
              <h3>{entry.name}</h3>
              <code>{entry.path}</code>
            </div>
            <div>
              <p>{entry.usage}</p>
              <p className="sg-note">{entry.dependencies}</p>
            </div>
          </article>
        ))}
      </div>
      {entries.length === 0 && (
        <div className="sg-empty">
          <Icon name="search" className="icon--size-28" />
          <p>No components match “{search}”.</p>
          <button
            className="sg-text-button"
            type="button"
            onClick={() => setSearch("")}
          >
            Clear search
          </button>
        </div>
      )}
    </>
  );
}
