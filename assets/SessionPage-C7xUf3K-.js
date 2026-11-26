var e=`import type { ReactNode } from "react";
import { SessionGameTitlebar } from "./SessionGameTitlebar";
import { SessionPlayerProfile } from "./SessionPlayerProfile";
import type { SessionGame, SessionProfile, SessionRole } from "./types";

export default function SessionPage({
  as: Container = "main",
  viewerRole,
  profile,
  game,
  afterGame,
  contentTourTarget,
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
  afterGame?: ReactNode;
  contentTourTarget?: string;
  toolbar?: ReactNode;
  navigation?: ReactNode;
  feedback?: ReactNode;
  overlays?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Container
      className={\`session-page\${Container === "section" ? " session-page--preview" : ""}\`}
      data-session-role={viewerRole}
    >
      {profile && <SessionPlayerProfile viewerRole={viewerRole} {...profile} />}
      <div className="session-page__content" data-tour={contentTourTarget}>
        {game && <SessionGameTitlebar {...game} />}
        {afterGame}
        {toolbar && <div className="session-page__toolbar">{toolbar}</div>}
        {feedback}
        {children}
      </div>
      {navigation}
      {overlays}
    </Container>
  );
}
`;export{e as default};