import DialogPanel from "../../components/ui/DialogPanel";
import PanelHeading from "../../components/ui/PanelHeading";
import Overline from "../../components/ui/Overline";
import type { ReactNode } from "react";
import IconButton from "../../components/ui/IconButton";

export default function ChallengeContributionDialog({
  editing,
  onClose,
  onBackdropDismiss,
  children,
}: {
  editing: boolean;
  onClose: () => void;
  onBackdropDismiss: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="host-community-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onBackdropDismiss();
      }}
    >
      <DialogPanel
        variant="contribution"
        role="dialog"
        aria-modal="true"
        aria-labelledby="host-create-challenge-title"
      >
        <PanelHeading variant="contribution">
          <div>
            <Overline variant="moderation">
              {editing ? "PLATFORM ADMIN" : "COMMUNITY CONTRIBUTION"}
            </Overline>
            <h2 id="host-create-challenge-title">
              {editing ? "Edit challenge" : "Create a challenge"}
            </h2>
            <p>
              {editing
                ? "Update this approved challenge in the shared Explore library."
                : "Share an original idea. It will be checked before appearing in Explore for other hosts."}
            </p>
          </div>
          <IconButton
            type="button"
            variant="idea-close"
            icon="x"
            onClick={onClose}
            label="Close"
          />
        </PanelHeading>
        {children}
      </DialogPanel>
    </div>
  );
}
