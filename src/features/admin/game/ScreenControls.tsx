import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import type { GameState } from "../../../types/database";

export interface ScreenControlsProps {
  game: GameState;
  navigate: (path: string) => void;
  startSlideshow: () => Promise<void>;
  stopSlideshow: () => Promise<void>;
}

export default function ScreenControls({
  game,
  navigate,
  startSlideshow,
  stopSlideshow,
}: ScreenControlsProps) {
  return (
    <>
      <Card>
        <h2 className="text-xl font-bold">Host Screens</h2>

        <div className="mt-4 grid grid-cols-1 gap-3">
          <Button type="button" onClick={() => navigate("/leaderboard")}>
            Leaderboard
          </Button>

          {!game.slideshow_open ? (
            <Button type="button" onClick={startSlideshow}>
              Start Slideshow
            </Button>
          ) : (
            <>
              <Button
                type="button"
                onClick={() => navigate("/slideshow?host=true")}
              >
                Open Slideshow
              </Button>

              <Button type="button" onClick={stopSlideshow}>
                End Slideshow
              </Button>
            </>
          )}
        </div>
      </Card>
    </>
  );
}
