var e=`import Icon from "../../components/ui/Icon";
import Dialog from "../../components/ui/Dialog";
import DialogPanel from "../../components/ui/DialogPanel";
import PanelHeading from "../../components/ui/PanelHeading";
import Badge from "../../components/ui/Badge";
import IconBadge from "../../components/ui/IconBadge";
import Overline from "../../components/ui/Overline";
import Button from "../../components/ui/Button";
import { challengeIcon } from "../../lib/challengeVisuals";
import type { SecretMission } from "./types";

interface Props {
  activeSecretMission: SecretMission;
  playSecretMission: (mission: SecretMission) => void;
}
export default function PrivateMissionDialog({
  activeSecretMission,
  playSecretMission,
}: Props) {
  return (
    <Dialog
      variant="reveal"
      label={activeSecretMission.title}
      labelledBy="cc-player-secret-modal-title"
      describedBy="cc-player-secret-modal-description"
      dismissDisabled
      onClose={() => undefined}
    >
      <DialogPanel variant="reveal">
        <PanelHeading variant="reveal">
          <Badge variant="reveal">
            SECRET
            <br />
            MISSION
          </Badge>
          <IconBadge variant="reveal" aria-hidden="true">
            {challengeIcon(
              activeSecretMission.title,
              activeSecretMission.description,
            )}
          </IconBadge>
        </PanelHeading>
        <h2 id="cc-player-secret-modal-title">{activeSecretMission.title}</h2>
        <p id="cc-player-secret-modal-description">
          {activeSecretMission.description}
        </p>
        <Overline variant="reveal" as="div">
          +{activeSecretMission.points} points
        </Overline>
        <Button
          type="button"
          variant="reveal"
          onClick={() => playSecretMission(activeSecretMission)}
        >
          Play <Icon name="check" className="icon--size-17" />
        </Button>
      </DialogPanel>
    </Dialog>
  );
}
`;export{e as default};