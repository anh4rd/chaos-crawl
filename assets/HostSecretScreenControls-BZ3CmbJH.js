var e=`import Button from "../../components/ui/Button";
import PresentationControls from "../../components/session/PresentationControls";
import type { SessionEvidence } from "./types";

interface Props {
  isSecretSlideshowConnected: boolean;
  busy: boolean;
  currentSecretReviewEvidenceIndex: number;
  setSecretReviewEvidence: (evidenceId: string | null) => Promise<void>;
  selectedSecretReviewEvidence: SessionEvidence[];
  disconnectSecretReviewSlideshow: () => void;
  castSecretReviewSlideshow: () => Promise<void>;
}
export default function HostSecretScreenControls({
  isSecretSlideshowConnected,
  busy,
  currentSecretReviewEvidenceIndex,
  setSecretReviewEvidence,
  selectedSecretReviewEvidence,
  disconnectSecretReviewSlideshow,
  castSecretReviewSlideshow,
}: Props) {
  return (
    <PresentationControls aria-label="Secret mission TV slideshow controls">
      {isSecretSlideshowConnected && (
        <>
          <Button
            type="button"
            disabled={busy || currentSecretReviewEvidenceIndex <= 0}
            onClick={() =>
              void setSecretReviewEvidence(
                selectedSecretReviewEvidence[
                  currentSecretReviewEvidenceIndex - 1
                ]?.id ?? null,
              )
            }
            variant="review"
            fullWidth={false}
          >
            Previous
          </Button>
          <Button
            type="button"
            disabled={
              busy ||
              currentSecretReviewEvidenceIndex < 0 ||
              currentSecretReviewEvidenceIndex >=
                selectedSecretReviewEvidence.length - 1
            }
            onClick={() =>
              void setSecretReviewEvidence(
                selectedSecretReviewEvidence[
                  currentSecretReviewEvidenceIndex + 1
                ]?.id ?? null,
              )
            }
            variant="review"
            fullWidth={false}
          >
            Next
          </Button>
        </>
      )}
      <Button
        type="button"
        onClick={() =>
          isSecretSlideshowConnected
            ? disconnectSecretReviewSlideshow()
            : void castSecretReviewSlideshow()
        }
        variant={isSecretSlideshowConnected ? "review-primary" : "review"}
        fullWidth={false}
      >
        {isSecretSlideshowConnected ? "Disconnect" : "Cast"}
      </Button>
    </PresentationControls>
  );
}
`;export{e as default};