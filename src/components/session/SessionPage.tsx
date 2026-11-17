import type { ReactNode } from "react";
import { SessionGameTitlebar } from "./SessionGameTitlebar";
import { SessionPlayerProfile } from "./SessionPlayerProfile";
import type { SessionGame, SessionProfile, SessionRole } from "./types";

export default function SessionPage({
  as: Container = "main",
  viewerRole,
  profile,
  game,
  toolbar,
  navigation,
  feedback,
  overlays,
  children,
}: {
  as?: "main" | "section";
  viewerRole: SessionRole;
  profile?: SessionProfile | null;
  game?: SessionGame | null;
  toolbar?: ReactNode;
  navigation?: ReactNode;
  feedback?: ReactNode;
  overlays?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Container
      className={`session-page${Container === "section" ? " session-page--preview" : ""}`}
      data-session-role={viewerRole}
    >
      {toolbar && <div className="session-page__toolbar">{toolbar}</div>}
      {profile && <SessionPlayerProfile viewerRole={viewerRole} {...profile} />}
      <div className="session-page__content">
        {game && <SessionGameTitlebar {...game} />}
        {feedback}
        {children}
      </div>
      {navigation}
      {overlays}
    </Container>
  );
}
