import { useCallback, useState } from "react";
import GuidedTour, { type GuidedTourStep } from "../components/tour/GuidedTour";
import Icon from "../components/ui/Icon";
import { challengeIcon } from "../lib/challengeVisuals";
import "../styles/PlayerGame.css";
import "../styles/GuidedTour.css";

const steps: GuidedTourStep[] = [
  {
    target: '[data-tour="demo-profile"]',
    title: "Your player card",
    body: "Your avatar, team and score are always easy to find here. In a real game, your points update as challenges are approved and rewards are awarded.",
    page: "game",
  },
  {
    target: '[data-tour="demo-navigation"]',
    title: "Find your way around",
    body: "Use the bottom tabs to move between the current game, leaderboard, side challenges and the final vote when it opens.",
    page: "game",
  },
  {
    target: '[data-tour="demo-challenge"]',
    title: "Read the challenge",
    body: "Every main challenge has a title, instructions, time allowance and evidence rules. Read it before you start.",
    page: "game",
  },
  {
    target: '[data-tour="demo-upload"]',
    title: "Upload your evidence",
    body: "Tap Upload evidence to add a photo or video when a task asks for proof. Then mark the task complete so the host can review it.",
    page: "game",
  },
  {
    target: '[data-tour="demo-leaderboard"]',
    title: "Check your position",
    body: "The leaderboard shows individual and team standings. Scores change when the host approves eligible work or completes a reward round.",
    page: "leaderboard",
  },
  {
    target: '[data-tour="demo-side"]',
    title: "Take on side challenges",
    body: "These optional tasks run alongside the main round. Open a task, follow its instructions, upload evidence if requested and submit it.",
    page: "side-challenges",
  },
  {
    target: '[data-tour="demo-final"]',
    title: "Vote in the final",
    body: "When the host opens the final gallery, browse the saved photos and videos and vote for your favourite. The winner receives the configured points after voting closes.",
    page: "final",
  },
];

type DemoPage = "game" | "leaderboard" | "side-challenges" | "final";
export default function PlayerDemo() {
  const [page, setPage] = useState<DemoPage>("game");
  const [tourOpen, setTourOpen] = useState(true);
  const [sampleUpload, setSampleUpload] = useState(false);
  const navigateTour = useCallback(
    (next: string) => setPage(next as DemoPage),
    [],
  );
  return (
    <main className="cc-session-player-app">
      <header className="cc-player-game-header">
        <div className="cc-player-system-bar">
          <span>Chaos</span>
          <span aria-hidden="true">▮▮▮ ◉ ▰</span>
        </div>
        <section className="cc-player-profile" data-tour="demo-profile">
          <div className="cc-player-avatar-large">A</div>
          <div className="cc-player-profile-copy">
            <h1>Anna</h1>
            <p>The Greatest Greatest</p>
          </div>
          <div className="cc-player-score">
            <span className="cc-player-score-points">
              <Icon name="star" className="icon--size-18" fill="currentColor" />
              <strong>25</strong>
            </span>
            <span className="cc-player-score-rank">
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
      <div className="cc-player-game-content">
        <section className="cc-player-game-titlebar">
          <div className="cc-player-game-icon" aria-hidden="true">
            🎉
          </div>
          <div className="cc-player-game-name">
            <strong>Iona's FCKN BDAY</strong>
            <small>GAME</small>
          </div>
          <div className="cc-player-game-code">
            <span>
              <small>GAME CODE</small>
              <strong>732471</strong>
            </span>
            <button type="button" aria-label="Copy sample game code">
              <Icon name="copy" className="icon--size-19" />
            </button>
          </div>
        </section>
        <div className="cc-demo-tour-banner">
          <Icon name="sparkles" className="icon--size-16" /> Interactive sample
          — nothing here changes a real game{" "}
          <button type="button" onClick={() => setTourOpen(true)}>
            Restart tour
          </button>
        </div>
        <nav
          className="cc-player-page-nav"
          data-tour="demo-navigation"
          aria-label="Demo game pages"
        >
          <button
            className={`cc-player-page-tab${page === "game" ? " is-active" : ""}`}
            onClick={() => setPage("game")}
          >
            <Icon name="gamepad2" className="icon--size-17" />
            <span>Game</span>
          </button>
          <button
            className={`cc-player-page-tab${page === "side-challenges" ? " is-active" : ""}`}
            onClick={() => setPage("side-challenges")}
          >
            <Icon name="clipboard-list" className="icon--size-17" />
            <span>Challenges</span>
          </button>
          <button
            className={`cc-player-page-tab${page === "leaderboard" ? " is-active" : ""}`}
            onClick={() => setPage("leaderboard")}
          >
            <Icon name="trophy" className="icon--size-17" />
            <span>Scores</span>
          </button>
        </nav>
        {page === "game" && (
          <>
            <section className="cc-player-live-label">
              <span className="cc-player-live-dot" /> ROUND 1 <span>OF 12</span>
            </section>
            <section
              className="cc-player-challenge-card"
              data-tour="demo-challenge"
            >
              <div className="cc-player-challenge-top">
                <span className="cc-player-challenge-kind">MAIN CHALLENGE</span>
                <span className="cc-player-round-chip">ROUND 2 / 12</span>
              </div>
              <div className="cc-player-challenge-heading">
                <div>
                  <h2>Obtain the best thing</h2>
                  <span className="cc-player-challenge-award">+25 POINTS</span>
                </div>
                <span className="cc-player-challenge-art" aria-hidden="true">
                  {challengeIcon("Obtain the best thing")}
                </span>
              </div>
              <p>
                Buy/beg/borrow/steal and bring your thing with you to the next
                destination.
              </p>
              <div className="cc-player-challenge-meta">
                <span className="cc-player-time-chip">
                  <span>TIME</span>
                  <strong>
                    <Icon name="clock3" className="icon--size-15" />
                    11:03
                  </strong>
                </span>
                <span className="cc-player-evidence-tag">COMPETE IN TEAMS</span>
              </div>
              <div className="cc-player-evidence-block" data-tour="demo-upload">
                <label className="cc-player-upload-button">
                  <Icon name="upload" className="icon--size-16" /> Upload
                  Evidence
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={() => setSampleUpload(true)}
                  />
                </label>
                <span className="cc-player-evidence-count">
                  {sampleUpload ? "1/6 files" : "0/6 files"}
                </span>
                {sampleUpload && (
                  <p className="cc-player-evidence-required">
                    Sample upload selected — demo only.
                  </p>
                )}
              </div>
              <button
                className="cc-player-primary-button"
                type="button"
                onClick={() => setSampleUpload(true)}
              >
                {" "}
                <Icon name="camera" className="icon--size-17" /> Mark challenge
                complete
              </button>
            </section>
            <section className="cc-player-state-card">
              <span className="cc-player-eyebrow">YOUR SECRET MISSION</span>
              <h2>Make your team laugh</h2>
              <p>
                Get every teammate to laugh without touching them or using your
                phone. Only you can see this mission.
              </p>
              <span className="cc-player-small-status">
                Private · 10 points
              </span>
            </section>
          </>
        )}
        {page === "leaderboard" && (
          <section
            className="cc-player-leaderboard-page"
            data-tour="demo-leaderboard"
          >
            <div className="cc-player-page-heading">
              <div>
                <span className="cc-player-eyebrow">THE RACE IS ON</span>
                <h2>Leaderboard</h2>
                <p>Scores update as the host approves challenges.</p>
              </div>
            </div>
            <div className="cc-player-leaderboard-list">
              {[
                ["Alex", 120],
                ["Jamie", 110],
                ["Taylor", 90],
                ["Sam", 80],
                ["Morgan", 70],
              ].map(([name, score], i) => (
                <article
                  className={`cc-player-rank-row${i === 0 ? " is-you" : ""}`}
                  key={name}
                >
                  <div className="cc-player-rank-number">{i + 1}</div>
                  <div className="cc-player-rank-avatar">
                    {String(name).slice(0, 1)}
                  </div>
                  <div className="cc-player-rank-copy">
                    <strong>
                      {name}
                      {i === 0 ? " · YOU" : ""}
                    </strong>
                    <span>{i < 3 ? "The Pineapples" : "Solo player"}</span>
                  </div>
                  <div className="cc-player-rank-score">
                    <strong>{score}</strong>
                    <span>PTS</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
        {page === "side-challenges" && (
          <section className="cc-player-side-page" data-tour="demo-side">
            <div className="cc-player-page-heading">
              <div>
                <span className="cc-player-eyebrow">EXTRA CHAOS</span>
                <h2>Side challenges</h2>
                <p>Complete these alongside the main round for extra points.</p>
              </div>
              <span className="cc-player-count-chip">2</span>
            </div>
            <button
              type="button"
              className="cc-player-vote-entry-link"
              onClick={() => setPage("final")}
            >
              <Icon name="heart" className="icon--size-16" /> Open the final
              vote
            </button>
            <div className="cc-player-side-list">
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
                <article className="cc-player-side-card" key={item.title}>
                  <div className="cc-player-side-card-copy">
                    <div className="cc-player-side-card-top">
                      <span
                        className="cc-player-side-card-art"
                        aria-hidden="true"
                      >
                        {challengeIcon(item.title, item.desc)}
                      </span>
                      <div>
                        <h3>{item.title}</h3>
                        <span className="cc-player-points">
                          Winner: +15 pts
                        </span>
                      </div>
                    </div>
                    <p>{item.desc}</p>
                  </div>
                  <button
                    className="cc-player-small-button"
                    type="button"
                    onClick={() => setSampleUpload(true)}
                  >
                    View challenge
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}
        {page === "final" && (
          <section className="cc-player-final-page" data-tour="demo-final">
            <div className="cc-player-page-heading">
              <div>
                <span className="cc-player-eyebrow">THE FINAL ROUND</span>
                <h2>Fan favourite</h2>
                <p>Vote for your favourite photo or video.</p>
              </div>
            </div>
            <div className="cc-player-final-vote-status">
              Voting is open — choose one favourite. You can change your vote
              until voting closes.
            </div>
            <article className="cc-player-final-card">
              <div className="cc-player-final-media">
                <div className="cc-demo-pineapple-art">🍍</div>
              </div>
              <div className="cc-player-final-copy">
                <strong>Jamie</strong>
                <p>Best team entrance</p>
                <button
                  className="cc-player-small-button"
                  type="button"
                  onClick={() => setSampleUpload(true)}
                >
                  Vote for this entry
                </button>
              </div>
            </article>
          </section>
        )}
        <p className="cc-demo-disclaimer">
          This is a guided preview using sample players and tasks. Uploads,
          votes and points are not saved.
        </p>
      </div>
      {tourOpen && (
        <GuidedTour
          steps={steps}
          onNavigate={navigateTour}
          onClose={() => setTourOpen(false)}
          label="PLAYER DEMO"
        />
      )}
    </main>
  );
}
