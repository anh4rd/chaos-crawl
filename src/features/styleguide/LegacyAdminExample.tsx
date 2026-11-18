import { useId, useRef, useState } from "react";
import type { Challenge, GameState, Pub } from "../../types/database";
import type { ChallengeParticipation } from "../game/ChallengeActions";
import type { AdminTab } from "../admin/adminTabs";
import type { ManagedPlayer } from "../admin/players/PlayersView";
import LegacyAdminView from "../admin/LegacyAdminView";
import QueryPanel from "../admin/QueryPanel";
import RoundChallenges from "../admin/game/RoundChallenges";
import RoundMovementControls from "../admin/game/RoundMovementControls";
import LiveGameSelection from "../admin/game/LiveGameSelection";
import TonightControls from "../admin/game/TonightControls";
import ScreenControls from "../admin/game/ScreenControls";
import ParticipationView from "../admin/participation/ParticipationView";
import HostChallengeCard from "../admin/participation/HostChallengeCard";
import CompletionReviewView from "../admin/participation/CompletionReviewView";
import PlayersView from "../admin/players/PlayersView";
import PlayerNameForm from "../admin/players/PlayerNameForm";
import TeamsView from "../admin/teams/TeamsView";
import VotingView from "../admin/voting/VotingView";
import UploadInput from "../../components/ui/UploadInput";
import SessionPreview from "./SessionPreview";

const pubs: Pub[] = [
  { id: 1, name: "Garden pub", sort_order: 1 },
  { id: 2, name: "Rooftop pub", sort_order: 2 },
];
const challenges: Challenge[] = [
  {
    id: 1,
    pub_id: 1,
    title: "Invent a greeting",
    description: "Make the table laugh.",
    points: 5,
    reveal_order: 1,
    allow_photo_upload: false,
  },
  {
    id: 2,
    pub_id: 1,
    title: "Find a mascot",
    description: null,
    points: 10,
    reveal_order: 2,
    allow_photo_upload: true,
  },
  {
    id: 3,
    pub_id: 2,
    title: "Rooftop toast",
    description: null,
    points: 5,
    reveal_order: 1,
    allow_photo_upload: false,
  },
];
const initialGame: GameState = {
  id: 1,
  current_pub: "Garden pub",
  current_challenge: "Invent a greeting",
  current_challenge_id: 1,
  current_challenge_order: 1,
  challenge_description: "Make the table laugh.",
  voting_open: false,
  voting_target: "player",
  show_vote_results: false,
  slideshow_open: false,
  scheduled_challenge_id: null,
  scheduled_reveal_at: null,
};

export default function LegacyAdminExample() {
  const [activeTab, setActiveTab] = useState<AdminTab>("live");
  const [game, setGame] = useState(initialGame);
  const [players, setPlayers] = useState<ManagedPlayer[]>([
    { id: "sample-player", name: "Robin", team: "Ducks", score: 10 },
  ]);
  const [teams, setTeams] = useState([{ id: "ducks", name: "Ducks" }]);
  const [newTeamName, setNewTeamName] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [selectedPub, setSelectedPub] = useState("Garden pub");
  const [selectedChallenge, setSelectedChallenge] =
    useState("Invent a greeting");
  const [minutes, setMinutes] = useState("10");
  const [completed, setCompleted] = useState(false);
  const [pending, setPending] = useState(false);
  const [queryError, setQueryError] = useState(false);
  const [notice, setNotice] = useState("No preview actions yet.");
  const inputPrefix = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const currentRound = challenges.filter(
    (challenge) =>
      challenge.pub_id ===
      pubs.find((pub) => pub.name === game.current_pub)?.id,
  );
  const currentIndex = currentRound.findIndex(
    (challenge) => challenge.id === game.current_challenge_id,
  );
  const nextChallenge = currentRound[currentIndex + 1];
  const nextPub =
    pubs[pubs.findIndex((pub) => pub.name === game.current_pub) + 1];
  const available = challenges.filter(
    (challenge) =>
      challenge.pub_id === pubs.find((pub) => pub.name === selectedPub)?.id,
  );
  const navigate = (path: string) => setNotice(`Preview navigation: ${path}`);
  async function reveal(challenge: Challenge) {
    setGame((current) => ({
      ...current,
      current_challenge_id: challenge.id,
      current_challenge: challenge.title,
      current_challenge_order: challenge.reveal_order,
      challenge_description: challenge.description ?? "",
    }));
  }
  async function moveRound() {
    if (!nextPub) return;
    setGame((current) => ({ ...current, current_pub: nextPub.name }));
  }
  async function startSlideshow() {
    setGame((current) => ({
      ...current,
      slideshow_open: true,
      voting_open: false,
      show_vote_results: false,
    }));
    navigate("/slideshow?host=true");
  }
  async function stopSlideshow() {
    setGame((current) => ({ ...current, slideshow_open: false }));
  }
  async function openVoting() {
    setGame((current) => ({
      ...current,
      voting_open: true,
      show_vote_results: false,
      slideshow_open: false,
    }));
  }
  async function closeVoting() {
    setGame((current) => ({
      ...current,
      voting_open: false,
      show_vote_results: true,
      slideshow_open: false,
    }));
  }
  const participation: ChallengeParticipation = {
    completionKey: (type, id) => `${type}:${id}`,
    uploadingKey: null,
    completingKey: pending ? "side:11" : null,
    hasCompleted: () => completed,
    complete: async () => setCompleted(true),
    chooseUpload: () => fileInput.current?.click(),
  };
  return (
    <section aria-label="Local legacy administration reference">
      <h3>Legacy administration</h3>
      <p>
        Eight controlled panels with local actions, score changes and recovery
        states.
      </p>
      <label>
        <input
          type="checkbox"
          checked={pending}
          onChange={(event) => setPending(event.target.checked)}
        />{" "}
        Preview pending operation
      </label>
      <label>
        <input
          type="checkbox"
          checked={queryError}
          onChange={(event) => setQueryError(event.target.checked)}
        />{" "}
        Preview query error
      </label>
      <output>{notice}</output>
      <SessionPreview>
        <LegacyAdminView
          as="section"
          activeTab={activeTab}
          onTab={setActiveTab}
        >
          <QueryPanel
            queries={[
              {
                loading: false,
                error: queryError ? new Error("Preview query failed") : null,
                reload: async () => setQueryError(false),
              },
            ]}
            loadingText="Loading preview..."
          >
            {activeTab === "live" && (
              <>
                <RoundChallenges
                  game={game}
                  currentRoundChallenges={currentRound}
                  currentChallengeIndex={currentIndex}
                  nextRoundChallenge={nextChallenge}
                  revealRoundChallenge={reveal}
                />
                <RoundMovementControls
                  currentPub={game.current_pub}
                  nextPubName={nextPub?.name}
                  canAdvance={Boolean(nextPub)}
                  onNext={moveRound}
                />
                <LiveGameSelection
                  game={game}
                  selectedPub={selectedPub}
                  setSelectedPub={setSelectedPub}
                  pubs={pubs}
                  challenges={challenges}
                  setSelectedChallenge={setSelectedChallenge}
                  sortedPubs={pubs}
                  selectedChallenge={selectedChallenge}
                  availableChallenges={available}
                  goLive={async () => {
                    const challenge = challenges.find(
                      (item) => item.title === selectedChallenge,
                    );
                    if (challenge) await reveal(challenge);
                    setGame((current) => ({
                      ...current,
                      current_pub: selectedPub,
                    }));
                  }}
                  navigate={navigate}
                />
              </>
            )}
            {activeTab === "tonight" && (
              <TonightControls
                game={game}
                openVoting={openVoting}
                closeVoting={closeVoting}
                nextRoundChallenge={nextChallenge}
                revealRoundChallenge={reveal}
                nextPub={nextPub}
                moveToNextPub={moveRound}
                returnEveryoneToGame={async () =>
                  setGame((current) => ({
                    ...current,
                    voting_open: false,
                    show_vote_results: false,
                    slideshow_open: false,
                  }))
                }
                scheduleMinutes={minutes}
                setScheduleMinutes={setMinutes}
                cancelScheduledReveal={async () =>
                  setGame((current) => ({
                    ...current,
                    scheduled_challenge_id: null,
                    scheduled_reveal_at: null,
                  }))
                }
                currentRoundChallenges={currentRound}
                scheduleChallenge={async (challenge) => {
                  if (
                    Number(minutes) <= 0 ||
                    !Number.isFinite(Number(minutes))
                  ) {
                    setNotice("Enter a valid number of minutes.");
                    return;
                  }
                  setGame((current) => ({
                    ...current,
                    scheduled_challenge_id: challenge.id,
                    scheduled_reveal_at: "2030-01-01T19:00:00Z",
                  }));
                }}
                startSlideshow={startSlideshow}
                stopSlideshow={stopSlideshow}
              />
            )}
            {activeTab === "screens" && (
              <ScreenControls
                game={game}
                navigate={navigate}
                startSlideshow={startSlideshow}
                stopSlideshow={stopSlideshow}
              />
            )}
            {activeTab === "challenges" && (
              <ParticipationView
                gameAvailable
                players={players}
                playerId={selectedPlayer}
                onPlayer={setSelectedPlayer}
                upload={
                  <UploadInput
                    ref={fileInput}
                    accept="image/*,video/*"
                    onChange={(event) =>
                      setNotice(
                        event.target.files?.[0]?.name ?? "No file selected.",
                      )
                    }
                  />
                }
              >
                <HostChallengeCard
                  challenge={{
                    id: 11,
                    title: "Find a friend",
                    description: "Invite someone into your photo.",
                    points: 3,
                    active: true,
                  }}
                  completedBy={completed ? players : []}
                  participation={participation}
                  onReview={() =>
                    setNotice("Review requested for Find a friend.")
                  }
                />
              </ParticipationView>
            )}
            {activeTab === "review" && (
              <CompletionReviewView
                completions={[
                  {
                    id: "sample-completion",
                    playerName: players[0]?.name ?? "Robin",
                    challengeTitle: "Find a friend",
                    kind: "side",
                    points: 3,
                    hasMedia: true,
                  },
                ]}
              />
            )}
            {activeTab === "players" && (
              <PlayersView
                players={players}
                savingPlayerId={pending ? "preview-pending" : null}
                onChangePoints={async (id, amount) =>
                  setPlayers((current) =>
                    current.map((player) =>
                      player.id === id
                        ? {
                            ...player,
                            score: Math.max(0, player.score + amount),
                          }
                        : player,
                    ),
                  )
                }
                onRemove={async (id) =>
                  setPlayers((current) =>
                    current.filter((player) => player.id !== id),
                  )
                }
                renderNameEditor={(player) => (
                  <PlayerNameForm
                    name={player.name}
                    draft={drafts[player.id] ?? player.name}
                    saved={player.name}
                    saving={pending}
                    error={null}
                    inputId={`${inputPrefix}-${player.id}`}
                    onDraft={(value) =>
                      setDrafts((current) => ({
                        ...current,
                        [player.id]: value,
                      }))
                    }
                    onSubmit={(event) => {
                      event.preventDefault();
                      const name = (drafts[player.id] ?? player.name).trim();
                      if (!name) return;
                      setPlayers((current) =>
                        current.map((item) =>
                          item.id === player.id ? { ...item, name } : item,
                        ),
                      );
                      setDrafts((current) => ({
                        ...current,
                        [player.id]: name,
                      }));
                    }}
                  />
                )}
              />
            )}
            {activeTab === "teams" && (
              <TeamsView
                players={players}
                teams={teams}
                newTeamName={newTeamName}
                creatingTeam={pending}
                assigningPlayerIds={
                  new Set(pending ? players.map((player) => player.id) : [])
                }
                onNewTeamName={setNewTeamName}
                onCreateTeam={async () => {
                  const name = newTeamName.trim();
                  if (!name) return;
                  setTeams((current) => [
                    ...current,
                    { id: `preview-team-${current.length}`, name },
                  ]);
                  setNewTeamName("");
                }}
                onAssignTeam={async (id, team) =>
                  setPlayers((current) =>
                    current.map((player) =>
                      player.id === id
                        ? { ...player, team: team || null }
                        : player,
                    ),
                  )
                }
              />
            )}
            {activeTab === "voting" && (
              <VotingView
                game={game}
                liveResults={(game.voting_target === "team"
                  ? teams
                  : players
                ).map((item, index) => ({
                  id: item.id,
                  name: item.name,
                  votes: index === 0 ? 2 : 0,
                }))}
                onTarget={async (value) => {
                  if (value === "team" || value === "player")
                    setGame((current) => ({
                      ...current,
                      voting_target: value,
                    }));
                }}
                onOpenVoting={openVoting}
                onCloseVoting={closeVoting}
                onCloseResults={async () =>
                  setGame((current) => ({
                    ...current,
                    voting_open: false,
                    show_vote_results: false,
                  }))
                }
                onNavigate={navigate}
              />
            )}
          </QueryPanel>
        </LegacyAdminView>
      </SessionPreview>
    </section>
  );
}
