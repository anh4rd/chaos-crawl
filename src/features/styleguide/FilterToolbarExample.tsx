import { useState } from "react";
import ControlRow from "../../components/ui/ControlRow";
import FormLabel from "../../components/ui/FormLabel";
import Icon from "../../components/ui/Icon";
import HostPatternPreview from "./HostPatternPreview";
import { Example } from "./Example";

const items = [
  { name: "Garden chaos", status: "planned" },
  { name: "Night crawl", status: "live" },
  { name: "Finished party", status: "completed" },
];

export default function FilterToolbarExample() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [disabled, setDisabled] = useState(false);
  const visible = items.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) &&
      (status === "all" || item.status === status),
  );
  return (
    <Example
      title="Shared filter toolbar"
      source="components/ui/ControlRow.tsx, components/ui/FormLabel.tsx"
      code={
        '<ControlRow variant="filters"><FormLabel variant="filter"><span>Search games</span><input value={search} onChange={onSearchChange} /></FormLabel></ControlRow>'
      }
    >
      <HostPatternPreview>
        <ControlRow variant="filters">
          <FormLabel variant="filter">
            <span>Search games</span>
            <Icon name="search" className="icon--size-17" />
            <input
              placeholder="Search game or host email"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              disabled={disabled}
            />
          </FormLabel>
          <FormLabel variant="filter">
            <span>Status</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              disabled={disabled}
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="planned">Planned</option>
              <option value="live">Live</option>
              <option value="completed">Completed</option>
            </select>
          </FormLabel>
        </ControlRow>
        <label>
          <input
            type="checkbox"
            checked={disabled}
            onChange={(event) => setDisabled(event.target.checked)}
          />{" "}
          Disable filters
        </label>
        <p>
          <output>
            {visible.length} {visible.length === 1 ? "result" : "results"}
          </output>
        </p>
        <ul>
          {visible.map((item) => (
            <li key={item.name}>{item.name}</li>
          ))}
        </ul>
      </HostPatternPreview>
    </Example>
  );
}
