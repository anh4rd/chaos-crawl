import DemoNotice from "../../components/ui/DemoNotice";
import GuidedTour, {
  type GuidedTourStep,
} from "../../components/tour/GuidedTour";
import Icon from "../../components/ui/Icon";
import { challengeIcon } from "../../lib/challengeVisuals";
import type { PlayerDemoModel } from "./types";

export default function PlayerDemoView({
  page,
  tourOpen,
  sampleUpload,
  onSelectPage,
  onNavigateTour,
  onRestartTour,
  onCloseTour,
  onSampleAction,
  steps,
}: PlayerDemoModel & { steps: GuidedTourStep[] }) {
  return (
    <main className="player-demo">
      <header className="player-demo__header">
        <div className="device-status">
          <span>Chaos</span>
          <span aria-hidden="true">▮▮▮ ◉ ▰</span>
        </div>
        <section className="profile-summary" data-tour="demo-profile">
          <div className="profile-summary__avatar">A</div>
          <div className="profile-summary__copy">
            <h1>Anna</h1>
            <p>The Greatest Greatest</p>
          </div>
          <div className="score-summary">
            <span className="score-summary__points">
              <Icon name="star" className="icon--size-18" fill="currentColor" />
              <strong>25</strong>
            </span>
            <span className="score-summary__rank">
              <Icon
                name="trophy"
                className="icon--size-17"
                fill="currentColor"
              />{" "}
              #3
            </span>
          </div>
        </section>
      </header>
      <div className="player-demo__content">
        <section className="game-identity">
          <div className="game-identity__art" aria-hidden="true">
            🎉
          </div>
          <div className="game-identity__name">
            <strong>Iona's FCKN BDAY</strong>
            <small>GAME</small>
          </div>
          <div className="game-identity__code">
            <span>
              <small>GAME CODE</small>
              <strong>732471</strong>
            </span>
            <button type="button" aria-label="Copy sample game code">
              <Icon name="copy" className="icon--size-19" />
            </button>
          </div>
        </section>
        <DemoNotice actionLabel="Restart tour" onAction={onRestartTour}>
          Interactive sample — nothing here changes a real game
        </DemoNotice>
        <nav
          className="game-dock"
          data-tour="demo-navigation"
          aria-label="Demo game pages"
        >
          <button
            className={`game-dock__tab${page === "game" ? " game-dock__tab--active" : ""}`}
            onClick={() => onSelectPage("game")}
          >
            <Icon name="gamepad2" className="icon--size-17" />
            <span>Game</span>
          </button>
          <button
            className={`game-dock__tab${page === "side-challenges" ? " game-dock__tab--active" : ""}`}
            onClick={() => onSelectPage("side-challenges")}
          >
            <Icon name="clipboard-list" className="icon--size-17" />
            <span>Challenges</span>
          </button>
          <button
            className={`game-dock__tab${page === "leaderboard" ? " game-dock__tab--active" : ""}`}
            onClick={() => onSelectPage("leaderboard")}
          >
            <Icon name="trophy" className="icon--size-17" />
            <span>Scores</span>
          </button>
        </nav>
        {page === "game" && (
          <>
            <section className="round-status">
              <span className="round-status__dot" /> ROUND 1 <span>OF 12</span>
            </section>
            <section className="challenge-card" data-tour="demo-challenge">
              <div className="challenge-card__top">
                <span className="challenge-card__kind">MAIN CHALLENGE</span>
                <span className="challenge-card__round">ROUND 2 / 12</span>
              </div>
              <div className="challenge-card__heading">
                <div>
                  <h2>Obtain the best thing</h2>
                  <span className="challenge-card__award">+25 POINTS</span>
                </div>
                <span className="challenge-card__art" aria-hidden="true">
                  {challengeIcon("Obtain the best thing")}
                </span>
              </div>
              <p>
                Buy/beg/borrow/steal and bring your thing with you to the next
                destination.
              </p>
              <div className="challenge-card__meta">
                <span className="challenge-card__time">
                  <span>TIME</span>
                  <strong>
                    <Icon name="clock3" className="icon--size-15" />
                    11:03
                  </strong>
                </span>
                <span className="challenge-card__evidence">
                  COMPETE IN TEAMS
                </span>
              </div>
              <div className="evidence-picker" data-tour="demo-upload">
                <label className="evidence-picker__control">
                  <Icon name="upload" className="icon--size-16" /> Upload
                  Evidence
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={onSampleAction}
                  />
                </label>
                <span className="evidence-picker__count">
                  {sampleUpload ? "1/6 files" : "0/6 files"}
                </span>
                {sampleUpload && (
                  <p className="evidence-picker__notice">
                    Sample upload selected — demo only.
                  </p>
                )}
              </div>
              <button
                className="challenge-action"
                type="button"
                onClick={onSampleAction}
              >
                {" "}
                <Icon name="camera" className="icon--size-17" /> Mark challenge
                complete
              </button>
            </section>
            <section className="mission-card">
              <span className="section-kicker">YOUR SECRET MISSION</span>
              <h2>Make your team laugh</h2>
              <p>
                Get every teammate to laugh without touching them or using your
                phone. Only you can see this mission.
              </p>
              <span className="mission-card__status">Private · 10 points</span>
            </section>
          </>
        )}
        {page === "leaderboard" && (
          <section
            className="player-demo__standings"
            data-tour="demo-leaderboard"
          >
            <div className="section-intro">
              <div>
                <span className="section-kicker">THE RACE IS ON</span>
                <h2>Leaderboard</h2>
                <p>Scores update as the host approves challenges.</p>
              </div>
            </div>
            <div className="standings">
              {[
                ["Alex", 120],
                ["Jamie", 110],
                ["Taylor", 90],
                ["Sam", 80],
                ["Morgan", 70],
              ].map(([name, score], i) => (
                <article
                  className={`standings-row${i === 0 ? " standings-row--selected" : ""}`}
                  key={name}
                >
                  <div className="standings-row__number">{i + 1}</div>
                  <div className="standings-row__avatar">
                    {String(name).slice(0, 1)}
                  </div>
                  <div className="standings-row__copy">
                    <strong>
                      {name}
                      {i === 0 ? " · YOU" : ""}
                    </strong>
                    <span>{i < 3 ? "The Pineapples" : "Solo player"}</span>
                  </div>
                  <div className="standings-row__score">
                    <strong>{score}</strong>
                    <span>PTS</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
        {page === "side-challenges" && (
          <section className="player-demo__side" data-tour="demo-side">
            <div className="section-intro">
              <div>
                <span className="section-kicker">EXTRA CHAOS</span>
                <h2>Side challenges</h2>
                <p>Complete these alongside the main round for extra points.</p>
              </div>
              <span className="count-pill">2</span>
            </div>
            <button
              type="button"
              className="vote-entry"
              onClick={() => onSelectPage("final")}
            >
              <Icon name="heart" className="icon--size-16" /> Open the final
              vote
            </button>
            <div className="challenge-list">
              {[
                {
                  title: "Best team entrance",
                  desc: "Create a ridiculous entrance together. Make the whole room notice.",
                },
                {
                  title: "Make your team laugh",
                  desc: "Get every teammate to laugh without touching them or using your phone.",
                },
              ].map((item) => (
                <article className="side-challenge" key={item.title}>
                  <div className="side-challenge__copy">
                    <div className="side-challenge__heading">
                      <span className="side-challenge__art" aria-hidden="true">
                        {challengeIcon(item.title, item.desc)}
                      </span>
                      <div>
                        <h3>{item.title}</h3>
                        <span className="points-chip">Winner: +15 pts</span>
                      </div>
                    </div>
                    <p>{item.desc}</p>
                  </div>
                  <button
                    className="item-action"
                    type="button"
                    onClick={onSampleAction}
                  >
                    View challenge
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}
        {page === "final" && (
          <section className="player-demo__final" data-tour="demo-final">
            <div className="section-intro">
              <div>
                <span className="section-kicker">THE FINAL ROUND</span>
                <h2>Fan favourite</h2>
                <p>Vote for your favourite photo or video.</p>
              </div>
            </div>
            <div className="vote-guidance">
              Voting is open — choose one favourite. You can change your vote
              until voting closes.
            </div>
            <article className="entry-card">
              <div className="entry-card__media">
                <div className="entry-card__art">🍍</div>
              </div>
              <div className="entry-card__copy">
                <strong>Jamie</strong>
                <p>Best team entrance</p>
                <button
                  className="item-action"
                  type="button"
                  onClick={onSampleAction}
                >
                  Vote for this entry
                </button>
              </div>
            </article>
          </section>
        )}
        <p className="player-demo__disclaimer">
          This is a guided preview using sample players and tasks. Uploads,
          votes and points are not saved.
        </p>
      </div>
      {tourOpen && (
        <GuidedTour
          steps={steps}
          onNavigate={onNavigateTour}
          onClose={onCloseTour}
          label="PLAYER DEMO"
        />
      )}
    </main>
  );
}
