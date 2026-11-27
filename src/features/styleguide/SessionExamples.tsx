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
import PanelGrid from "../../components/ui/PanelGrid";
import HostAddSideChallengeCard from "../host-live/HostAddSideChallengeCard";
import HostSideChallengeDialog from "../host-live/HostSideChallengeDialog";
import ScoreAdjustmentForm from "../host-live/ScoreAdjustmentForm";
import type {
  RewardPresentation,
  SessionRole,
  SessionSection,
  VotingEntry,
} from "../../components/session/types";
import ControlRow from "../../components/ui/ControlRow";
import DemoNotice from "../../components/ui/DemoNotice";
import JoinProgress from "../../components/ui/JoinProgress";

const entries = [
  {
    id: "alex",
    name: "Alex",
    score: 120,
    teamName: "Team Chaos",
    avatarUrl: `${import.meta.env.BASE_URL}chaos-logo.png`,
  },
  { id: "sam", name: "Sam", score: 100, teamName: "Team Chaos" },
  { id: "lee", name: "Lee", score: 75, teamName: "Team Spark" },
  { id: "jo", name: "Jo", score: 50, teamName: "Team Spark" },
];
const media = {
  id: "photo",
  url: `${import.meta.env.BASE_URL}chaos-logo.png`,
  mediaType: "image" as const,
  description: "Demo challenge evidence",
};
const votingEntry: VotingEntry = {
  id: "photo",
  participant: {
    name: "Alex",
    avatarUrl: `${import.meta.env.BASE_URL}chaos-logo.png`,
  },
  challengeTitle: "Make an entrance",
  media,
  selected: false,
  winner: true,
  voteCount: 3,
  voters: [
    {
      id: "sam",
      name: "Sam",
      avatarUrl: `${import.meta.env.BASE_URL}chaos-logo.png`,
    },
  ],
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
  const [missionSubmitted, setMissionSubmitted] = useState(false);
  const [missionUploaded, setMissionUploaded] = useState(false);
  const [textReview, setTextReview] = useState(false);
  const [selected, setSelected] = useState(false);
  const [notice, setNotice] = useState("");
  const [sideChallengeDialogOpen, setSideChallengeDialogOpen] = useState(false);
  const [sideChallengeTitle, setSideChallengeTitle] = useState("");
  const [sideChallengeDescription, setSideChallengeDescription] = useState("");
  const [sideChallengePoints, setSideChallengePoints] = useState(5);
  const [sideChallengeDuration, setSideChallengeDuration] = useState(10);
  const [scores, setScores] = useState(entries);
  const [scoreAdjustmentCount, setScoreAdjustmentCount] = useState(0);
  const [teamScores, setTeamScores] = useState([
    { id: "chaos", name: "Team Chaos", score: 220 },
    { id: "spark", name: "Team Spark", score: 125 },
  ]);
  const closed = phase === "results";
  const playerLobby = viewerRole === "player" && phase === "lobby";
  return (
    <>
      <DemoNotice
        actionLabel="Reset preview"
        onAction={() => {
          setSection("game");
          setPhase("live");
          setSubmitted(false);
          setUploaded(false);
          setMissionSubmitted(false);
          setMissionUploaded(false);
          setTextReview(false);
          setSelected(false);
          setNotice("");
          setSideChallengeDialogOpen(false);
          setSideChallengeTitle("");
          setSideChallengeDescription("");
          setSideChallengePoints(5);
          setSideChallengeDuration(10);
          setScores(entries);
          setScoreAdjustmentCount(0);
          setTeamScores([
            { id: "chaos", name: "Team Chaos", score: 220 },
            { id: "spark", name: "Team Spark", score: 125 },
          ]);
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
        <label>
          <input
            type="checkbox"
            checked={textReview}
            onChange={(event) => setTextReview(event.target.checked)}
          />{" "}
          Written answer in review
        </label>
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
        profile={
          playerLobby
            ? null
            : { name: "Alex", subtitle: "Team Chaos", score: 120, rank: 1 }
        }
        game={{
          name: "Friday Night Chaos",
          code: "123456",
          onCopy: () => setNotice("Demo code: 123456"),
        }}
        afterGame={
          viewerRole === "player" && section === "game" && phase === "lobby" ? (
            <JoinProgress step={3} total={3} />
          ) : null
        }
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
          !playerLobby && (
            <SessionNavigation
              elementRef={navigationRef}
              active={section}
              showHost={viewerRole === "host"}
              onSelect={setSection}
              challengeCount={1}
            />
          )
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
            variant="page"
            viewerRole={viewerRole}
            entries={[...scores].sort((a, b) => b.score - a.score)}
            teams={[...teamScores].sort((a, b) => b.score - a.score)}
            viewerId="alex"
            scoreControls={
              viewerRole === "host" ? (
                <ScoreAdjustmentForm
                  players={scores}
                  teams={teamScores}
                  teamsEnabled
                  busy={false}
                  successCount={scoreAdjustmentCount}
                  onAdjust={(target, id, delta) => {
                    setScoreAdjustmentCount((count) => count + 1);
                    if (target === "player") {
                      const player = scores.find((entry) => entry.id === id);
                      setScores((current) =>
                        current.map((entry) =>
                          entry.id === id
                            ? { ...entry, score: entry.score + delta }
                            : entry,
                        ),
                      );
                      setTeamScores((current) =>
                        current.map((team) =>
                          team.name === player?.teamName
                            ? { ...team, score: team.score + delta }
                            : team,
                        ),
                      );
                    } else {
                      setTeamScores((current) =>
                        current.map((team) =>
                          team.id === id
                            ? { ...team, score: team.score + delta }
                            : team,
                        ),
                      );
                    }
                  }}
                />
              ) : undefined
            }
          />
        ) : section === "side-challenges" ? (
          <>
            <div className="challenge-list">
              <SessionChallengeCard
                id="demo"
                title="Find a pineapple"
                description="Find the fruit and capture the moment."
                teamsEnabled
              >
                <SessionSubmission
                  variant="side-challenge"
                  title="Find a pineapple"
                  evidence={uploaded ? [media] : []}
                  status={submitted ? "submitted" : null}
                  evidenceRequired
                  onUpload={() => setUploaded(true)}
                  onSubmit={() => setSubmitted(true)}
                />
              </SessionChallengeCard>
              {viewerRole === "host" && !closed && phase !== "completed" && (
                <HostAddSideChallengeCard
                  disabled={false}
                  onClick={() => setSideChallengeDialogOpen(true)}
                />
              )}
            </div>
            <PanelGrid variant="private-feed">
              <SessionChallengeCard
                id="demo-secret"
                kind="secret"
                title="Make your teammate laugh"
                description="Use this week's trending words to make your teammate guess the moment."
                points={10}
              >
                <SessionSubmission
                  variant="secret-mission"
                  title="Make your teammate laugh"
                  evidence={missionUploaded ? [media] : []}
                  status={missionSubmitted ? "submitted" : null}
                  evidenceRequired
                  onUpload={() => setMissionUploaded(true)}
                  onSubmit={() => setMissionSubmitted(true)}
                />
              </SessionChallengeCard>
            </PanelGrid>
          </>
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
            ownerAvatarUrl={`${import.meta.env.BASE_URL}chaos-logo.png`}
            points={20}
            evidence={textReview ? [] : [media]}
            answer={textReview ? "I found a hidden clue." : null}
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
        {sideChallengeDialogOpen && (
          <HostSideChallengeDialog
            title={sideChallengeTitle}
            setTitle={setSideChallengeTitle}
            description={sideChallengeDescription}
            setDescription={setSideChallengeDescription}
            points={sideChallengePoints}
            setPoints={setSideChallengePoints}
            duration={sideChallengeDuration}
            setDuration={setSideChallengeDuration}
            busy={false}
            error=""
            onDismissError={() => setNotice("")}
            onClose={() => setSideChallengeDialogOpen(false)}
            onSubmit={async (event) => {
              event.preventDefault();
              setNotice("Side challenge added locally.");
              setSideChallengeDialogOpen(false);
              setSideChallengeTitle("");
              setSideChallengeDescription("");
              setSideChallengePoints(5);
              setSideChallengeDuration(10);
            }}
          />
        )}
      </SessionPage>
    </>
  );
}
