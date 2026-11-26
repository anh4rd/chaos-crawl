var e=`import Dialog from "../../components/ui/Dialog";
import DialogPanel from "../../components/ui/DialogPanel";
import PanelHeading from "../../components/ui/PanelHeading";
import Overline from "../../components/ui/Overline";
import type { ReactNode } from "react";
import IconButton from "../../components/ui/IconButton";

export default function ChallengeContributionDialog({
  editing,
  onClose,
  feedback,
  children,
}: {
  editing: boolean;
  onClose: () => void;
  feedback?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Dialog
      variant="contribution"
      label={editing ? "Edit challenge" : "Create a challenge"}
      labelledBy="host-create-challenge-title"
      describedBy="host-create-challenge-description"
      onClose={onClose}
    >
      <DialogPanel variant="contribution">
        <PanelHeading variant="contribution">
          <div>
            <Overline variant="moderation">
              {editing ? "PLATFORM ADMIN" : "COMMUNITY CONTRIBUTION"}
            </Overline>
            <h2 id="host-create-challenge-title">
              {editing ? "Edit challenge" : "Create a challenge"}
            </h2>
            <p id="host-create-challenge-description">
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
        {feedback}
        {children}
      </DialogPanel>
    </Dialog>
  );
}
`;export{e as default};