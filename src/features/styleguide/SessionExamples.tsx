import { useNavigationFocus } from "../../components/ui/useNavigationFocus";
import { useState } from "react";
import SessionBreak from "../../components/session/SessionBreak";
import SessionChallengeCard from "../../components/session/SessionChallengeCard";
import SessionFeedback from "../../components/session/SessionFeedback";
import SessionFinalRound from "../../components/session/SessionFinalRound";
import SessionLeaderboard from "../../components/session/SessionLeaderboard";
import SessionMainChallengeCard from "../../components/session/SessionMainChallengeCard";
import SessionNavigation from "../../components/session/SessionNavigation";
import SessionPage from "../../components/session/SessionPage";
import SessionReview from "../../components/session/SessionReview";
import SessionRewardRound from "../../components/session/SessionRewardRound";
import SessionState from "../../components/session/SessionState";
import SessionSubmission from "../../components/session/SessionSubmission";
import type {
  RewardPresentation,
  SessionRole,
  SessionSection,
  VotingEntry,
} from "../../components/session/types";
import ControlRow from "../../components/ui/ControlRow";
import DemoNotice from "../../components/ui/DemoNotice";

const entries = [
  { id: "alex", name: "Alex", score: 120, teamName: "Team Chaos" },
  { id: "sam", name: "Sam", score: 100, teamName: "Team Chaos" },
];
const media = {
  id: "photo",
  url: `${import.meta.env.BASE_URL}chaos-logo.png`,
  mediaType: "image" as const,
  description: "Demo challenge evidence",
};
const votingEntry: VotingEntry = {
  id: "photo",
  participant: { name: "Alex" },
  challengeTitle: "Make an entrance",
  media,
  selected: false,
  winner: true,
  voteCount: 3,
  voters: [{ id: "sam", name: "Sam" }],
};
const reward: RewardPresentation = {
  title: "Make an entrance",
  method: "voting",
  target: "player",
  points: 20,
  completed: false,
  votesCast: 3,
  candidates: entries.map((entry) => ({ ...entry, detail: entry.teamName })),
  winners: [{ id: "alex", name: "Alex", points: 20, votes: 3 }],
  leaderboard: entries,
};

export default function SessionExamples() {
  const { navigationRef, restoreFocus } = useNavigationFocus();
  const [viewerRole, setViewerRole] = useState<SessionRole>("player");
  const [section, setSection] = useState<SessionSection>("game");
  const [phase, setPhase] = useState("live");
  const [submitted, setSubmitted] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [selected, setSelected] = useState(false);
  const [notice, setNotice] = useState("");
  const closed = phase === "results";
  return (
    <>
      <DemoNotice
        actionLabel="Reset preview"
        onAction={() => {
          setSection("game");
          setPhase("live");
          setSubmitted(false);
          setUploaded(false);
          setSelected(false);
          setNotice("");
        }}
      >
        Local demonstration — these controls do not change a real game.
      </DemoNotice>
      <ControlRow>
        <label htmlFor="session-preview-role">Preview as</label>
        <select
          id="session-preview-role"
          value={viewerRole}
          onChange={(event) =>
            setViewerRole(event.target.value === "host" ? "host" : "player")
          }
        >
          <option value="player">Player</option>
          <option value="host">Host</option>
        </select>
        <label htmlFor="session-preview-phase">Phase</label>
        <select
          id="session-preview-phase"
          value={phase}
          onChange={(event) => setPhase(event.target.value)}
        >
          {[
            "lobby",
            "live",
            "break",
            "reward",
            "review",
            "final",
            "results",
            "completed",
          ].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </ControlRow>
      <SessionPage
        as="section"
        contentTourTarget="example-session-content"
        viewerRole={viewerRole}
        profile={{ name: "Alex", subtitle: "Team Chaos", score: 120, rank: 1 }}
        game={{
          name: "Friday Night Chaos",
          code: "123456",
          onCopy: () => setNotice("Demo code: 123456"),
        }}
        feedback={
          notice && (
            <SessionFeedback
              kind="success"
              message={notice}
              onDismiss={() => setNotice("")}
            />
          )
        }
        navigation={
          <SessionNavigation
            elementRef={navigationRef}
            active={section}
            showHost={viewerRole === "host"}
            showFinal
            onSelect={setSection}
            challengeCount={1}
          />
        }
      >
        {section === "host-controls" ? (
          <SessionState title="Host controls">
            <p>
              Host management is composed alongside the shared game experience.
            </p>
            <button
              className="btn"
              onClick={() => setNotice("Local host action completed.")}
            >
              Demo host action
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setSection("game");
                restoreFocus();
              }}
            >
              Return to sample game
            </button>
          </SessionState>
        ) : section === "leaderboard" ? (
          <SessionLeaderboard
            entries={entries}
            teams={[{ id: "chaos", name: "Team Chaos", score: 220 }]}
            viewerId="alex"
          />
        ) : section === "side-challenges" ? (
          <SessionChallengeCard
            id="demo"
            title="Find a pineapple"
            description="Find the fruit and capture the moment."
            points={20}
          >
            <SessionSubmission
              title="Find a pineapple"
              evidence={uploaded ? [media] : []}
              status={submitted ? "submitted" : null}
              evidenceRequired
              onUpload={() => setUploaded(true)}
              onSubmit={() => setSubmitted(true)}
            />
          </SessionChallengeCard>
        ) : section === "final" || phase === "final" || closed ? (
          <SessionFinalRound
            title="Find a pineapple"
            description="Celebrate the best evidence."
            points={20}
            galleryOpen
            votingOpen={!closed}
            completed
            entries={[{ ...votingEntry, selected }]}
            onVote={() => setSelected(!selected)}
            leaderboard={entries}
          />
        ) : phase === "reward" ? (
          <SessionRewardRound
            round={{ ...reward, selectedId: selected ? "alex" : null }}
            onVote={() => setSelected(!selected)}
          />
        ) : phase === "review" ? (
          <SessionReview
            title="Make a dramatic entrance"
            description="Did Alex pull it off?"
            owner="Alex"
            points={20}
            evidence={[media]}
            open
            votesCast={2}
            successVotes={null}
            failVotes={null}
            voters={[]}
            leaderboard={entries}
            onVote={(vote) => setNotice(`Local ${vote} vote recorded.`)}
          />
        ) : phase === "break" ? (
          <SessionBreak label="02:00" running />
        ) : phase === "lobby" ? (
          <SessionState title="Waiting for the host…">
            <p>Everyone is getting ready.</p>
          </SessionState>
        ) : phase === "completed" ? (
          <SessionState
            title="Game over. Chaos achieved."
            action={
              <button className="btn" onClick={() => setSection("leaderboard")}>
                See final scores
              </button>
            }
          />
        ) : (
          <SessionMainChallengeCard
            viewerRole={viewerRole}
            title="Make an entrance"
            description="Show everyone your best entrance."
            points={20}
            round={1}
            roundCount={3}
            durationMinutes={5}
            timerLabel="04:32"
            timerCaption="TIME LEFT"
          >
            <SessionSubmission
              title="Make an entrance"
              evidence={uploaded ? [media] : []}
              status={submitted ? "submitted" : null}
              onUpload={() => setUploaded(true)}
              onSubmit={() => setSubmitted(true)}
            />
          </SessionMainChallengeCard>
        )}
      </SessionPage>
    </>
  );
}
