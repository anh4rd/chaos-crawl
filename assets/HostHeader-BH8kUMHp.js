var e=`import IconButton from "../ui/IconButton";
import { interceptHostNavigation } from "./navigation";
import BrandLink from "../ui/BrandLink";
import AccountChip from "../ui/AccountChip";
import Icon from "../ui/Icon";
import HostNavigation from "./HostNavigation";
export default function HostHeader({
  homeHref,
  displayName,
  readOnlyPreview = false,
  onSignOut,
  onNavigate,
}: {
  homeHref: string;
  displayName: string;
  readOnlyPreview?: boolean;
  onSignOut: () => void;
  onNavigate?: (href: string) => void;
}) {
  return (
    <header className="host-header">
      <BrandLink
        variant="host"
        to={homeHref}
        onClick={(event) => interceptHostNavigation(event, onNavigate)}
      />
      <HostNavigation onNavigate={onNavigate} />
      <div className="host-header__actions">
        <Icon name="circle-help" className="icon--size-21 host-header__help" />
        <AccountChip name={displayName} preview={readOnlyPreview} />
        {!readOnlyPreview && (
          <IconButton
            type="button"
            title="Sign out"
            onClick={onSignOut}
            icon="log-out"
            label="Sign out"
            iconClassName="icon--size-18"
          />
        )}
      </div>
    </header>
  );
}
`;export{e as default};