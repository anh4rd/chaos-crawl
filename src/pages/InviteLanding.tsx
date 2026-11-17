import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Gamepad2,
  MapPin,
  Play,
  Users,
} from "lucide-react";
import { supabase } from "../lib/sessionSupabase";
import "../styles/PreGameInvite.css";

interface InviteData {
  enabled: boolean;
  game_name: string;
  event_date: string | null;
  start_time: string | null;
  venue_name: string | null;
  venue_address: string | null;
  game_photo_url: string | null;
  player_limit: number;
  joined_players: number;
  rules: string | null;
  demo_enabled: boolean;
  pre_game_enabled: boolean;
  pre_game_task: { title: string; description: string } | null;
  preparation: Array<{ title: string; prep: string }>;
}

export default function InviteLanding() {
  const { joinCode = "" } = useParams();
  const navigate = useNavigate();
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void supabase
      .rpc("cc_get_public_game_invite", {
        p_join_code: joinCode.replace(/\D/g, "").slice(0, 6),
      })
      .then(({ data, error: rpcError }) => {
        if (!active) return;
        if (rpcError) setError(rpcError.message);
        else if (!data)
          setError(
            "This invitation couldn't be found. Ask your host for a fresh link.",
          );
        else if (!(data as InviteData).enabled)
          setError("This host hasn't opened pre-game invitations yet.");
        else setInvite(data as InviteData);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [joinCode]);

  if (loading)
    return (
      <main className="pregame-page">
        <div className="pregame-shell">Loading your invitation…</div>
      </main>
    );
  if (error || !invite)
    return (
      <main className="pregame-page">
        <div className="pregame-shell">
          <Link to="/" className="pregame-brand">
            CHAOS CRAWL
          </Link>
          <section className="pregame-card">
            <h1>Invitation unavailable</h1>
            <p>{error || "Something went wrong."}</p>
            <Link className="pregame-primary" to="/">
              Back to Chaos Crawl
            </Link>
          </section>
        </div>
      </main>
    );

  const date = invite.event_date
    ? new Date(`${invite.event_date}T12:00:00`).toLocaleDateString(undefined, {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : "Date to be confirmed";
  return (
    <main className="pregame-page">
      <div className="pregame-shell">
        <header className="pregame-header">
          <Link to="/" className="pregame-brand">
            CHAOS
            <br />
            CRAWL
          </Link>
          <span className="pregame-sticker">YOU'RE INVITED!</span>
        </header>
        <section className="pregame-hero">
          {invite.game_photo_url && (
            <img className="pregame-cover" src={invite.game_photo_url} alt="" />
          )}
          <span className="pregame-eyebrow">YOUR NEXT ADVENTURE</span>
          <h1>{invite.game_name}</h1>
          <p>
            Big ideas. Questionable decisions. Excellent stories. Get ready to
            play.
          </p>
          <div className="pregame-meta">
            <span>
              <CalendarDays size={17} />
              {date}
            </span>
            {invite.start_time && (
              <span>
                <Clock3 size={17} />
                {invite.start_time.slice(0, 5)}
              </span>
            )}
            {invite.venue_name && (
              <span>
                <MapPin size={17} />
                {invite.venue_name}
              </span>
            )}
            <span>
              <Users size={17} />
              {invite.joined_players} / {invite.player_limit} joined
            </span>
          </div>
          <button
            className="pregame-primary"
            onClick={() =>
              navigate(`/join?code=${encodeURIComponent(joinCode)}`)
            }
          >
            Join the chaos <ArrowRight size={18} />
          </button>
          <small>You'll choose your name and avatar when you join.</small>
        </section>
        <section className="pregame-card">
          <div className="pregame-section-title">
            <Gamepad2 />
            <h2>How to play</h2>
          </div>
          <div className="pregame-steps">
            <article>
              <b>01</b>
              <strong>Join your team</strong>
              <p>Use your invite link, choose a name and get ready.</p>
            </article>
            <article>
              <b>02</b>
              <strong>Take on challenges</strong>
              <p>
                Complete silly tasks, upload evidence when asked and collect
                points.
              </p>
            </article>
            <article>
              <b>03</b>
              <strong>Vote and win</strong>
              <p>Take part in reward rounds and help decide the favourites.</p>
            </article>
          </div>
          {invite.demo_enabled && (
            <button
              className="pregame-secondary"
              onClick={() => navigate("/demo/player")}
            >
              <Play size={17} /> Take the interactive game tour
            </button>
          )}
        </section>
        {invite.pre_game_enabled && invite.pre_game_task && (
          <section className="pregame-card pregame-task">
            <span className="pregame-eyebrow">BEFORE THE EVENT</span>
            <h2>{invite.pre_game_task.title}</h2>
            <p>{invite.pre_game_task.description}</p>
            <small>
              Your host may ask you to complete this before the event.
            </small>
          </section>
        )}
        {!!invite.preparation?.length && (
          <section className="pregame-card">
            <h2>What to prepare</h2>
            {invite.preparation.map((item, i) => (
              <div className="pregame-prep" key={`${item.title}-${i}`}>
                <strong>{item.title}</strong>
                <p>{item.prep}</p>
              </div>
            ))}
          </section>
        )}
        {invite.rules && (
          <section className="pregame-card">
            <h2>The rules</h2>
            <p className="pregame-rules">{invite.rules}</p>
          </section>
        )}
        <footer className="pregame-footer">
          Made for memorable levels of chaos.
        </footer>
      </div>
    </main>
  );
}
