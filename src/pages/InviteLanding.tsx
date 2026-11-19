import PosterCopy from "../components/ui/PosterCopy";
import { useNavigate, useParams } from "react-router-dom";
import Badge from "../components/ui/Badge";
import BrandLink from "../components/ui/BrandLink";
import ButtonLink from "../components/ui/ButtonLink";
import Card from "../components/ui/Card";
import InvitationHero from "../features/invitation/InvitationHero";
import InvitationInstructions from "../features/invitation/InvitationInstructions";
import InvitationPreparation from "../features/invitation/InvitationPreparation";
import InvitationRules from "../features/invitation/InvitationRules";
import InvitationTask from "../features/invitation/InvitationTask";
import { useInvitationData } from "../features/invitation/useInvitationData";

export default function InviteLanding() {
  const { joinCode = "" } = useParams();
  const navigate = useNavigate();
  const { invite, loading, error } = useInvitationData(joinCode);
  if (loading)
    return (
      <main className="invitation">
        <div className="invitation__shell">Loading your invitation…</div>
      </main>
    );
  if (error || !invite)
    return (
      <main className="invitation">
        <div className="invitation__shell">
          <BrandLink />
          <Card as="section" variant="poster">
            <h1>Invitation unavailable</h1>
            <PosterCopy>{error || "Something went wrong."}</PosterCopy>
            <ButtonLink variant="poster-primary" fullWidth={false} to="/">
              Back to Chaos Crawl
            </ButtonLink>
          </Card>
        </div>
      </main>
    );
  return (
    <main className="invitation">
      <div className="invitation__shell">
        <header className="invitation__header">
          <BrandLink>
            CHAOS
            <br />
            CRAWL
          </BrandLink>
          <Badge variant="sticker">YOU'RE INVITED!</Badge>
        </header>
        <InvitationHero
          invite={invite}
          onJoin={() => navigate(`/join?code=${encodeURIComponent(joinCode)}`)}
        />
        <InvitationInstructions
          demoEnabled={invite.demo_enabled}
          onDemo={() => navigate("/demo/player")}
        />
        {invite.pre_game_enabled && invite.pre_game_task && (
          <InvitationTask {...invite.pre_game_task} />
        )}
        {!!invite.preparation?.length && (
          <InvitationPreparation items={invite.preparation} />
        )}
        {invite.rules && <InvitationRules rules={invite.rules} />}
        <footer className="invitation__footer">
          Made for memorable levels of chaos.
        </footer>
      </div>
    </main>
  );
}
