var e=`import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import DisplayHeading from "../../components/ui/DisplayHeading";
import Icon from "../../components/ui/Icon";
import type { InviteData } from "./types";

export default function InvitationHero({
  invite,
  onJoin,
}: {
  invite: InviteData;
  onJoin: () => void;
}) {
  const date = invite.event_date
    ? new Date(\`\${invite.event_date}T12:00:00\`).toLocaleDateString(undefined, {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : "Date to be confirmed";
  return (
    <Card as="section" variant="poster" className="invitation-hero">
      {invite.game_photo_url && (
        <img
          className="invitation-hero__cover"
          src={invite.game_photo_url}
          alt=""
        />
      )}
      <Badge>YOUR NEXT ADVENTURE</Badge>
      <DisplayHeading as="h1" hero>
        {invite.game_name}
      </DisplayHeading>
      <p className="invitation-hero__intro">
        Big ideas. Questionable decisions. Excellent stories. Get ready to play.
      </p>
      <div className="invitation-hero__meta">
        <Badge variant="metadata" icon="calendar-days">
          {date}
        </Badge>
        {invite.start_time && (
          <Badge variant="metadata" icon="clock3">
            {invite.start_time.slice(0, 5)}
          </Badge>
        )}
        {invite.venue_name && (
          <Badge variant="metadata" icon="map-pin">
            {invite.venue_name}
          </Badge>
        )}
        <Badge variant="metadata" icon="users">
          {invite.joined_players} / {invite.player_limit} joined
        </Badge>
      </div>
      <Button variant="poster-primary" fullWidth={false} onClick={onJoin}>
        Join the chaos <Icon name="arrow-right" className="icon--size-18" />
      </Button>
      <small className="invitation-hero__hint">
        You'll choose your name and avatar when you join.
      </small>
    </Card>
  );
}
`;export{e as default};