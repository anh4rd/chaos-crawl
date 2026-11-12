import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, RefreshCw, Search, ShieldCheck, Users, Gamepad2, CalendarDays, X } from "lucide-react";
import { supabase } from "../lib/supabase";
import HostShell from "../components/host/HostShell";
import "../styles/HostPortal.css";
import "../styles/HostPlanning.css";

interface AdminGame {
  game_id: string; name: string; host_email: string | null; status: string;
  event_date: string | null; created_at: string; player_count: number;
  session_count: number; live_sessions: number;
}
interface GameDetail {
  game: Record<string, unknown>;
  sessions: Array<{ id: string; name: string; join_code: string; status: string; created_at: string; players: Array<{ name: string; score: number; team_name: string | null }> }>;
}

export default function SuperAdmin() {
  const [games,setGames]=useState<AdminGame[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [query,setQuery]=useState("");
  const [status,setStatus]=useState("all");
  const [selected,setSelected]=useState<GameDetail|null>(null);
  const [detailLoading,setDetailLoading]=useState(false);
  const [denied,setDenied]=useState(false);

  const load=useCallback(async()=>{
    setLoading(true);setError("");setDenied(false);
    const {data,error:rpcError}=await supabase.rpc("cc_super_admin_list_games");
    if(rpcError){setError(rpcError.message);setDenied(rpcError.message.toLowerCase().includes("not authorised")||rpcError.message.toLowerCase().includes("not authorized"));setLoading(false);return;}
    setGames((data??[]) as AdminGame[]);setLoading(false);
  },[]);
  useEffect(()=>{void load();},[load]);
  const filtered=useMemo(()=>games.filter(g=>(status==="all"||g.status===status)&&`${g.name} ${g.host_email??""}`.toLowerCase().includes(query.toLowerCase())),[games,status,query]);

  async function openGame(id:string){
    setDetailLoading(true);setError("");
    const {data,error:rpcError}=await supabase.rpc("cc_super_admin_game_detail",{p_game_id:id});
    setDetailLoading(false);
    if(rpcError){setError(rpcError.message);return;}
    setSelected(data as GameDetail);
  }

  return <HostShell title="Super Admin" subtitle="Platform-wide game oversight.">
    <div className="sa-header"><div><span className="sa-kicker"><ShieldCheck size={15}/> PLATFORM OWNER</span><h2>All games</h2><p>View games created by every host account.</p></div><button className="host-button host-button--secondary" onClick={()=>void load()}><RefreshCw size={16}/> Refresh</button></div>
    {error&&<div className="host-alert host-alert--error">{error}</div>}
    {denied&&<div className="sa-denied">This account isn't provisioned as a Super Admin. Run the supplied migration while signed in with the designated account, then refresh.</div>}
    <div className="sa-stats"><article><Gamepad2/><strong>{games.length}</strong><span>Total games</span></article><article><Users/><strong>{games.reduce((n,g)=>n+Number(g.player_count||0),0)}</strong><span>Players across sessions</span></article><article><CalendarDays/><strong>{games.filter(g=>g.status==="live"||g.live_sessions>0).length}</strong><span>Live games</span></article></div>
    <section className="sa-panel"><div className="sa-toolbar"><label><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search game or host email"/></label><select value={status} onChange={e=>setStatus(e.target.value)}><option value="all">All statuses</option><option value="draft">Draft</option><option value="planned">Planned</option><option value="live">Live</option><option value="completed">Completed</option></select></div>
      {loading?<p className="sa-muted">Loading platform games…</p>:filtered.length?<div className="sa-table-wrap"><table className="sa-table"><thead><tr><th>Game</th><th>Host</th><th>Status</th><th>Players</th><th>Sessions</th><th>Date</th><th/></tr></thead><tbody>{filtered.map(g=><tr key={g.game_id}><td><strong>{g.name}</strong></td><td>{g.host_email||"—"}</td><td><span className={`sa-status sa-status--${g.status}`}>{g.status}</span></td><td>{g.player_count}</td><td>{g.session_count}</td><td>{g.event_date||"—"}</td><td><button className="sa-view" onClick={()=>void openGame(g.game_id)}>Inspect</button></td></tr>)}</tbody></table></div>:<p className="sa-muted">No games match this search.</p>}
    </section>
    <Link className="sa-back" to="/host"><ArrowLeft size={15}/> Back to Host Hub</Link>
    {(selected||detailLoading)&&<div className="sa-modal-backdrop" onClick={()=>setSelected(null)}><section className="sa-modal" onClick={e=>e.stopPropagation()}><button className="sa-close" onClick={()=>setSelected(null)}><X/></button>{detailLoading?<p>Loading game details…</p>:selected&&<><span className="sa-kicker">GAME INSPECTOR</span><h2>{String(selected.game.name??"Game")}</h2><p className="sa-muted">Host: {String(selected.game.host_email??"Unknown")}</p><h3>Sessions and players</h3>{selected.sessions.map(s=><article className="sa-session" key={s.id}><div><strong>{s.name}</strong><span>{s.status} · Code {s.join_code}</span></div>{s.players.map(p=><div className="sa-player" key={p.name}><span>{p.name}{p.team_name?` · ${p.team_name}`:""}</span><b>{p.score} pts</b></div>)}</article>)}</>}</section></div>}
  </HostShell>;
}
