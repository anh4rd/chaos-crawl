interface SessionSlideshowItem {
  id: string;
  media_type: "image" | "video";
  storage_path: string;
}

export interface SessionSlideshowView<
  Item extends SessionSlideshowItem = SessionSlideshowItem,
> {
  open: boolean;
  evidence_id: string | null;
  items: Item[];
}

interface FinalSlideshowItem extends SessionSlideshowItem {
  player_name: string;
  challenge_id: string;
  challenge_title: string;
}

export interface FinalSlideshowView extends SessionSlideshowView<FinalSlideshowItem> {
  challenge_id: string | null;
}

export interface SecretSlideshowView extends SessionSlideshowView {
  assignment_id: string | null;
  mission: { title: string; description: string; player_name: string } | null;
}
