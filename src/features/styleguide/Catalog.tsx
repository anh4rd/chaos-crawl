import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import Icon from "../../components/ui/Icon";
import Note from "../../components/ui/Note";

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
      <label className="component-catalog__search">
        <Icon name="search" className="icon--size-19" />
        <span className="u-visually-hidden">Search component catalog</span>
        <input
          className="component-catalog__input"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search components, props or source paths…"
          type="search"
        />
      </label>
      <Note role="status">
        {entries.length} of {componentCatalog.length} component modules
      </Note>
      <div className="component-catalog">
        {entries.map((entry) => (
          <article className="component-catalog__item" key={entry.path}>
            <div>
              <Badge variant="subtle">{entry.group}</Badge>
              <h3 className="component-catalog__title">{entry.name}</h3>
              <code className="component-catalog__source">{entry.path}</code>
            </div>
            <div>
              <p className="component-catalog__usage">{entry.usage}</p>
              <Note compact>{entry.dependencies}</Note>
            </div>
          </article>
        ))}
      </div>
      {entries.length === 0 && (
        <EmptyState
          icon="search"
          action={
            <Button
              variant="text"
              fullWidth={false}
              type="button"
              onClick={() => setSearch("")}
            >
              Clear search
            </Button>
          }
        >
          No components match “{search}”.
        </EmptyState>
      )}
    </>
  );
}
