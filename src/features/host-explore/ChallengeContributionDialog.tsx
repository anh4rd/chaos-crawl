import type { ReactNode } from "react";
import Icon from "../../components/ui/Icon";

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
      <section
        className="host-community-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="host-create-challenge-title"
      >
        <div className="host-community-modal-heading">
          <div>
            <span className="host-community-kicker">
              {editing ? "PLATFORM ADMIN" : "COMMUNITY CONTRIBUTION"}
            </span>
            <h2 id="host-create-challenge-title">
              {editing ? "Edit challenge" : "Create a challenge"}
            </h2>
            <p>
              {editing
                ? "Update this approved challenge in the shared Explore library."
                : "Share an original idea. It will be checked before appearing in Explore for other hosts."}
            </p>
          </div>
          <button
            type="button"
            className="host-explore-save"
            onClick={onClose}
            aria-label="Close"
          >
            <Icon name="x" className="icon--size-18" />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
