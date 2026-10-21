import { useCallback, useEffect, useState } from "react";
import { Heart, MapPin, Trash2, ClipboardList, Compass } from "lucide-react";
import { supabase } from "../lib/supabase";
import HostShell from "../components/host/HostShell";
import "../styles/HostPortal.css";

interface HostFavourite {
  id: string;
  item_type: "task" | "venue" | "route";
  item_id: string;
  item_data: { title?: string; name?: string; description?: string; points?: number; venueType?: string; stops?: string[] };
}

export default function HostSaved() {
  const [items, setItems] = useState<HostFavourite[]>([]);
  const [filter, setFilter] = useState<"all" | "task" | "venue" | "route">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setError("Please log in again.");
      setLoading(false);
      return;
    }
    const { data, error: queryError } = await supabase.from("host_favourites").select("*").eq("host_id", userData.user.id).order("created_at", { ascending: false });
    setLoading(false);
    if (queryError) {
      setError("Couldn't load saved items. Check that the host planning migration has been run.");
      return;
    }
    setItems((data ?? []) as HostFavourite[]);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function remove(item: HostFavourite) {
    const { error: deleteError } = await supabase.from("host_favourites").delete().eq("id", item.id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setItems((current) => current.filter((entry) => entry.id !== item.id));
  }

  const visible = items.filter((item) => filter === "all" || item.item_type === filter);

  return (
    <HostShell title="Your saved stuff" subtitle="Keep challenges, location ideas and route templates close for next time." showCreate>
      {error && <div className="host-alert host-alert--error">{error}</div>}
      <div className="host-tabs" role="tablist" aria-label="Saved items filter">
        <button type="button" className={filter === "all" ? "is-active" : ""} aria-selected={filter === "all"} onClick={() => setFilter("all")}>Everything <span className="host-tab-count">{items.length}</span></button>
        <button type="button" className={filter === "task" ? "is-active" : ""} aria-selected={filter === "task"} onClick={() => setFilter("task")}><ClipboardList size={15}/> Tasks</button>
        <button type="button" className={filter === "venue" ? "is-active" : ""} aria-selected={filter === "venue"} onClick={() => setFilter("venue")}><MapPin size={15}/> Locations</button>
        <button type="button" className={filter === "route" ? "is-active" : ""} aria-selected={filter === "route"} onClick={() => setFilter("route")}><Compass size={15}/> Routes</button>
      </div>
      {loading ? <div className="host-empty-state">Loading saved items…</div> : visible.length ? (
        <div className="host-saved-grid">{visible.map((item) => {
          const title = item.item_data.title ?? item.item_data.name ?? "Saved idea";
          return <article className="host-saved-card" key={item.id}>
            <div className="host-saved-icon">{item.item_type === "task" ? <ClipboardList size={21}/> : item.item_type === "route" ? <Compass size={21}/> : <MapPin size={21}/>}</div>
            <div className="host-saved-copy"><span className="host-eyebrow">{item.item_type === "task" ? "CHALLENGE" : item.item_type === "route" ? "ROUTE TEMPLATE" : "LOCATION IDEA"}</span><h3>{title}</h3>{item.item_data.description && <p>{item.item_data.description}</p>}{Array.isArray(item.item_data.stops) && <p>{(item.item_data.stops as string[]).join(" → ")}</p>}{typeof item.item_data.points === "number" && <span className="host-tag">★ {item.item_data.points} points</span>}</div>
            <button type="button" className="host-icon-button host-icon-button--danger" aria-label={`Remove ${title} from saved items`} onClick={() => void remove(item)}><Trash2 size={17}/></button>
          </article>;
        })}</div>
      ) : <div className="host-empty-state"><Heart size={24}/><h3>Nothing saved yet</h3><p>Save a challenge, venue idea or route template as you browse the library.</p></div>}
    </HostShell>
  );
}
