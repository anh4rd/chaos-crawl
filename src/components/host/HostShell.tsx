import PageHeading from "../ui/PageHeading";
import WorkspaceSidebar from "../ui/WorkspaceSidebar";
import Button from "../ui/Button";
import type { HostShellProps } from "./types";
import HostHeader from "./HostHeader";
import HostMobileNavigation from "./HostMobileNavigation";
import Icon from "../ui/Icon";
export default function HostShell({
  children,
  title,
  subtitle,
  showCreate = true,
  readOnlyPreview = false,
  contextPanel,
  sidebar,
  homeHref,
  displayName,
  onSignOut,
  onCreate,
  onNavigate,
  contentAs: Content = "main",
}: HostShellProps) {
  return (
    <div className="host-portal host-portal--app host-shell">
      <HostHeader
        homeHref={homeHref}
        displayName={displayName}
        readOnlyPreview={readOnlyPreview}
        onSignOut={onSignOut}
        onNavigate={onNavigate}
      />

      <div
        className={`host-shell__layout${sidebar ? " host-shell__layout--setup-sidebar" : " host-shell__layout--no-sidebar"}${contextPanel ? "" : " host-shell__layout--no-context"}`}
      >
        <img
          className="host-shell__mascot"
          src={`${import.meta.env.BASE_URL}${encodeURIComponent("Mischievous Chaos Monster Logo.png")}`}
          alt=""
          aria-hidden="true"
        />
        {sidebar && (
          <WorkspaceSidebar variant="setup">{sidebar}</WorkspaceSidebar>
        )}

        <Content className="host-shell__content">
          <PageHeading
            title={title}
            subtitle={subtitle}
            action={
              showCreate ? (
                <Button
                  variant="comic-primary"
                  fullWidth={false}
                  onClick={onCreate}
                  type="button"
                >
                  <Icon name="plus" className="icon--size-18" /> Create new game
                </Button>
              ) : undefined
            }
          />
          {children}
        </Content>
        {contextPanel && (
          <aside className="host-shell__context">{contextPanel}</aside>
        )}
      </div>

      {!readOnlyPreview && <HostMobileNavigation onNavigate={onNavigate} />}
    </div>
  );
}
