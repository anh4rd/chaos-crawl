import {
  useEffect,
  useState,
  type ChangeEvent,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import { supabase } from "../lib/supabase";

import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

import {
  usePlayers,
} from "../game/hooks/usePlayers";

import {
  useGameState,
} from "../game/hooks/useGameState";

import {
  usePubs,
} from "../game/hooks/usePubs";

import {
  useChallenges,
} from "../game/hooks/useChallenges";

import {
  updateGameState,
} from "../lib/gameApi";

import {
  addPoints,
  changeTeam,
  deletePlayer,
  removePoints,
  renamePlayer,
} from "../lib/playerApi";

import {
  getVotesForChallenge,
} from "../lib/voteApi";

import useChallengeCompletions
  from "../game/hooks/useChallengeCompletions";


interface Team {
  id: string;
  name: string;
}

interface VoteRow {
  id: string | number;
  voter_id: string;
  voted_for_player_id:
    | string
    | null;
  voted_for_team_id:
    | string
    | null;
  challenge_name: string;
}


export default function Admin() {
  const players = usePlayers();
  const game = useGameState();
  const pubs = usePubs();
  const challenges = useChallenges();
  const completions =
    useChallengeCompletions();

  const navigate = useNavigate();

  const [
    assigningPlayerId,
    setAssigningPlayerId,
  ] = useState<string | null>(null);

  const [
    newTeamName,
    setNewTeamName,
  ] = useState("");

  const [
    creatingTeam,
    setCreatingTeam,
  ] = useState(false);

  const [
    teams,
    setTeams,
  ] = useState<Team[]>([]);

  const [
    votes,
    setVotes,
  ] = useState<VoteRow[]>([]);

  const [
    selectedPub,
    setSelectedPub,
  ] = useState("");

  const [
    selectedChallenge,
    setSelectedChallenge,
  ] = useState("");

  const [
    broadcastMessage,
    setBroadcastMessage,
  ] = useState("");


  // -------------------------
  // LOAD TEAMS
  // -------------------------

  async function loadTeams() {
    const { data, error } =
      await supabase
        .from("teams")
        .select("id, name")
        .order("name");

    if (error) {
      console.error(
        "LOAD TEAMS ERROR:",
        error
      );
      return;
    }

    setTeams(data ?? []);
  }


  useEffect(() => {
    loadTeams();
  }, []);


  // -------------------------
  // LOAD VOTES + REALTIME
  // -------------------------

  useEffect(() => {
    if (!game?.current_challenge) {
      return;
    }

    async function loadVotes() {
      if (!game?.current_challenge) {
        return;
      }

      const { data, error } =
        await getVotesForChallenge(
          game.current_challenge
        );

      if (error) {
        console.error(
          "LOAD VOTES ERROR:",
          error
        );
        return;
      }

      setVotes(
        (data ?? []) as VoteRow[]
      );
    }

    loadVotes();

    const channel = supabase
      .channel("admin-votes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "votes",
        },
        () => {
          loadVotes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [game?.current_challenge]);


  // -------------------------
  // KEEP SELECTS IN SYNC
  // -------------------------

  useEffect(() => {
    if (!game) {
      return;
    }

    setSelectedPub(
      game.current_pub ?? ""
    );

    setSelectedChallenge(
      game.current_challenge ?? ""
    );
  }, [
    game?.current_pub,
    game?.current_challenge,
  ]);


  // -------------------------
  // LOADING
  // -------------------------

  if (!game) {
    return (
      <main className="mx-auto min-h-screen max-w-md p-6">
        <p>Loading host control...</p>
      </main>
    );
  }


  // -------------------------
  // DERIVED DATA
  // -------------------------

  const unassignedPlayers =
    players.filter(
      (player) =>
        !player.team ||
        player.team.trim() === ""
    );

  const orderedPubs = [...pubs].sort(
    (a, b) =>
      a.sort_order - b.sort_order
  );

  const currentPubIndex =
    orderedPubs.findIndex(
      (pub) =>
        pub.name === game.current_pub
    );

  const nextPub =
    currentPubIndex >= 0
      ? orderedPubs[
          currentPubIndex + 1
        ] ?? null
      : orderedPubs[0] ?? null;

  const currentPubObject =
    pubs.find(
      (pub) =>
        pub.name === selectedPub
    );

  const availableChallenges =
    challenges.filter(
      (challenge) =>
        String(challenge.pub_id) ===
        String(currentPubObject?.id)
    );


  // PLAYER VOTE RESULTS

  const playerVoteResults =
    players
      .map((player) => ({
        id: player.id,
        name: player.name,
        team: player.team,

        votes: votes.filter(
          (vote) =>
            vote.voted_for_player_id ===
            player.id
        ).length,
      }))
      .sort(
        (a, b) =>
          b.votes - a.votes
      );


  // TEAM VOTE RESULTS

  const teamVoteResults =
    teams
      .map((team) => ({
        id: team.id,
        name: team.name,

        votes: votes.filter(
          (vote) =>
            vote.voted_for_team_id ===
              team.id ||
            vote.voted_for_team_id ===
              team.name
        ).length,
      }))
      .sort(
        (a, b) =>
          b.votes - a.votes
      );


  // -------------------------
  // TEAM FUNCTIONS
  // -------------------------

  async function createTeam() {
    const cleanName =
      newTeamName.trim();

    if (!cleanName) {
      alert("Enter a team name.");
      return;
    }

    const existingTeam =
      teams.find(
        (team) =>
          team.name.toLowerCase() ===
          cleanName.toLowerCase()
      );

    if (existingTeam) {
      alert(
        "That team already exists."
      );
      return;
    }

    setCreatingTeam(true);

    const teamId = cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const { error } =
      await supabase
        .from("teams")
        .insert({
          id: teamId,
          name: cleanName,
        });

    setCreatingTeam(false);

    if (error) {
      console.error(
        "CREATE TEAM ERROR:",
        error
      );

      alert(
        `Could not create team: ${error.message}`
      );
      return;
    }

    setNewTeamName("");

    await loadTeams();
  }


  async function assignPlayerToTeam(
    playerId: string,
    team: string
  ) {
    if (!team) {
      return;
    }

    setAssigningPlayerId(playerId);

    const { error } =
      await supabase
        .from("players")
        .update({
          team,
        })
        .eq("id", playerId);

    setAssigningPlayerId(null);

    if (error) {
      console.error(
        "ASSIGN TEAM ERROR:",
        error
      );

      alert(
        `Could not assign team: ${error.message}`
      );
    }
  }


  // -------------------------
  // LIVE GAME FUNCTIONS
  // -------------------------

  async function goLive() {
    if (!selectedPub) {
      alert("Select a pub first.");
      return;
    }

    if (!selectedChallenge) {
      alert(
        "Select a challenge first."
      );
      return;
    }

    const challenge =
      challenges.find(
        (item) =>
          item.title ===
          selectedChallenge
      );

    const { error } =
      await updateGameState({
        current_pub:
          selectedPub,

        current_challenge:
          selectedChallenge,

        challenge_description:
          challenge?.description ?? "",

        voting_open: false,
        show_vote_results: false,
        slideshow_open: false,
      });

    if (error) {
      console.error(
        "GO LIVE ERROR:",
        error
      );

      alert(
        `Could not update game: ${error.message}`
      );
      return;
    }

    alert("Live game updated!");
  }


  async function moveToNextPub() {
    if (!nextPub) {
      return;
    }

    const confirmed =
      window.confirm(
        `Move everyone to ${nextPub.name}?`
      );

    if (!confirmed) {
      return;
    }

    const pubChallenges =
      challenges.filter(
        (challenge) =>
          String(challenge.pub_id) ===
          String(nextPub.id)
      );

    const firstChallenge =
      pubChallenges[0];

    const { error } =
      await updateGameState({
        current_pub:
          nextPub.name,

        current_challenge:
          firstChallenge?.title ?? "",

        challenge_description:
          firstChallenge?.description ??
          "",

        voting_open: false,
        show_vote_results: false,
        slideshow_open: false,
      });

    if (error) {
      console.error(
        "NEXT PUB ERROR:",
        error
      );

      alert(
        `Could not change pub: ${error.message}`
      );
      return;
    }

    setSelectedPub(
      nextPub.name
    );

    setSelectedChallenge(
      firstChallenge?.title ?? ""
    );
  }


  // -------------------------
  // SLIDESHOW
  // -------------------------

  async function startSlideshow() {
    const confirmed =
      window.confirm(
        "Start the slideshow for everyone?"
      );

    if (!confirmed) {
      return;
    }

    const { error } =
      await updateGameState({
        slideshow_open: true,
        voting_open: false,
        show_vote_results: false,
      });

    if (error) {
      console.error(
        "START SLIDESHOW ERROR:",
        error
      );

      alert(
        `Could not start slideshow: ${error.message}`
      );
      return;
    }

    // Host gets host controls.
    navigate(
      "/slideshow?host=true"
    );
  }


  async function stopSlideshow() {
    const confirmed =
      window.confirm(
        "End slideshow for everyone?"
      );

    if (!confirmed) {
      return;
    }

    const { error } =
      await updateGameState({
        slideshow_open: false,
      });

    if (error) {
      console.error(
        "STOP SLIDESHOW ERROR:",
        error
      );

      alert(
        `Could not end slideshow: ${error.message}`
      );
    }
  }


  // -------------------------
  // VOTING
  // -------------------------

async function openVoting() {
  if (!game) {
    alert("Game state is still loading.");
    return;
  }

  const challengeName =
    game.current_challenge ?? "current challenge";

  const confirmed =
    window.confirm(
      `Open voting for "${challengeName}"?`
    );

  if (!confirmed) {
    return;
  }

  const { error } =
    await updateGameState({
      voting_open: true,
      show_vote_results: false,
      slideshow_open: false,
    });

  if (error) {
    console.error(
      "OPEN VOTING ERROR:",
      error
    );

    alert(
      `Could not open voting: ${error.message}`
    );
  }
}


async function closeVoting() {
  if (!game) {
    alert("Game state is still loading.");
    return;
  }

  const confirmed =
    window.confirm(
      "Close voting and show results?"
    );

  if (!confirmed) {
    return;
  }

  const { error } =
    await updateGameState({
      voting_open: false,
      show_vote_results: true,
      slideshow_open: false,
    });

  if (error) {
    console.error(
      "CLOSE VOTING ERROR:",
      error
    );

    alert(
      `Could not show results: ${error.message}`
    );
  }
}


async function closeResults() {
  if (!game) {
    alert("Game state is still loading.");
    return;
  }

  const confirmed =
    window.confirm(
      "Close results and send everyone back to the game?"
    );

  if (!confirmed) {
    return;
  }

  const { error } =
    await updateGameState({
      show_vote_results: false,
      voting_open: false,
      slideshow_open: false,
    });

  if (error) {
    console.error(
      "CLOSE RESULTS ERROR:",
      error
    );

    alert(
      `Could not close results: ${error.message}`
    );
  }
}


  // -------------------------
  // BROADCAST
  // -------------------------

  async function sendBroadcast() {
    const cleanMessage =
      broadcastMessage.trim();

    if (!cleanMessage) {
      alert("Enter a message.");
      return;
    }

    const { error } =
      await updateGameState({
        broadcast_message:
          cleanMessage,
      });

    if (error) {
      console.error(
        "BROADCAST ERROR:",
        error
      );

      alert(
        `Could not send message: ${error.message}`
      );
      return;
    }

    setBroadcastMessage("");
  }


  // -------------------------
  // JSX
  // -------------------------

  return (
    <main className="mx-auto min-h-screen max-w-md space-y-6 p-6">

      <h1 className="text-4xl font-bold">
        Host Control
      </h1>


      {/* LIVE STATUS */}

      <Card>
        <h2 className="mb-4 text-xl font-bold">
          Live Now
        </h2>

        <p>
          📍 {game.current_pub}
        </p>

        <p className="mt-2 font-bold">
          ⭐ {game.current_challenge}
        </p>

        <div className="mt-4 space-y-1 text-sm">
          {game.slideshow_open && (
            <p>
              📸 Slideshow is live
            </p>
          )}

          {game.voting_open && (
            <p>
              🟢 Voting is open
            </p>
          )}

          {game.show_vote_results && (
            <p>
              🏆 Results are showing
            </p>
          )}
        </div>
      </Card>


      {/* CREATE TEAMS */}

      <Card>
        <h2 className="mb-4 text-2xl font-bold">
          Create Teams
        </h2>

        <Input
          placeholder="Team name..."
          value={newTeamName}
          onChange={(event) =>
            setNewTeamName(
              event.target.value
            )
          }
        />

        <div className="mt-4">
          <Button
            type="button"
            disabled={creatingTeam}
            onClick={createTeam}
          >
            {creatingTeam
              ? "Creating..."
              : "Create Team"}
          </Button>
        </div>

        {teams.length === 0 && (
          <p className="mt-4 text-sm text-zinc-400">
            No teams created yet.
          </p>
        )}

        {teams.length > 0 && (
          <div className="mt-5 space-y-2">
            <h3 className="font-bold">
              Current Teams
            </h3>

            {teams.map((team) => (
              <div
                key={team.id}
                className="rounded-xl bg-black/70 p-3"
              >
                {team.name}
              </div>
            ))}
          </div>
        )}
      </Card>


      {/* ASSIGN TEAMS */}

      {unassignedPlayers.length > 0 && (
        <Card>
          <h2 className="text-2xl font-bold">
            ⚠️ Assign Teams
          </h2>

          <p className="mt-2">
            {unassignedPlayers.length === 1
              ? "1 player is waiting for a team."
              : `${unassignedPlayers.length} players are waiting for teams.`}
          </p>

          <div className="mt-4 space-y-4">
            {unassignedPlayers.map(
              (player) => (
                <div
                  key={player.id}
                  className="rounded-2xl border-2 border-pink-500 bg-black/70 p-4"
                >
                  <div className="mb-3 text-xl font-bold">
                    {player.name}
                  </div>

                  <select
                    value=""
                    disabled={
                      assigningPlayerId ===
                      player.id
                    }
                    onChange={async (
                      event
                    ) => {
                      const team =
                        event.target.value;

                      if (!team) {
                        return;
                      }

                      await assignPlayerToTeam(
                        player.id,
                        team
                      );
                    }}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-white"
                  >
                    <option value="">
                      Assign to team...
                    </option>

                    {teams.map(
                      (team) => (
                        <option
                          key={team.id}
                          value={team.name}
                        >
                          {team.name}
                        </option>
                      )
                    )}
                  </select>

                  {assigningPlayerId ===
                    player.id && (
                    <p className="mt-2 text-sm">
                      Assigning...
                    </p>
                  )}
                </div>
              )
            )}
          </div>
        </Card>
      )}


      {/* HOST SCREENS */}

      <Card>
        <h2 className="mb-4 text-xl font-bold">
          Host Screens
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            onClick={() =>
              navigate("/leaderboard")
            }
          >
            Leaderboard
          </Button>

          {!game.slideshow_open ? (
            <Button
              type="button"
              onClick={startSlideshow}
            >
              Start Slideshow
            </Button>
          ) : (
            <Button
              type="button"
              onClick={stopSlideshow}
            >
              End Slideshow
            </Button>
          )}
        </div>
      </Card>


      {/* CHANGE LIVE GAME */}

      <Card>
        <h2 className="mb-4 text-xl font-bold">
          Change Live Game
        </h2>

        {nextPub && (
          <div className="mb-5">
            <Button
              type="button"
              onClick={moveToNextPub}
            >
              Next Pub: {nextPub.name}
            </Button>
          </div>
        )}

        <label className="mb-2 block text-sm text-zinc-400">
          Pub
        </label>

        <select
          className="mb-6 w-full rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-white"
          value={selectedPub}
          onChange={(
            event: ChangeEvent<HTMLSelectElement>
          ) => {
            setSelectedPub(
              event.target.value
            );

            setSelectedChallenge("");
          }}
        >
          <option value="">
            Select a pub...
          </option>

          {pubs.map((pub) => (
            <option
              key={pub.id}
              value={pub.name}
            >
              {pub.name}
            </option>
          ))}
        </select>

        <label className="mb-2 block text-sm text-zinc-400">
          Challenge
        </label>

        <div className="mb-6 space-y-3">
          {availableChallenges.length ===
            0 && (
            <p className="text-sm text-zinc-400">
              No challenges for this pub.
            </p>
          )}

          {availableChallenges.map(
            (challenge) => (
              <label
                key={challenge.id}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-700 p-3"
              >
                <input
                  type="radio"
                  checked={
                    selectedChallenge ===
                    challenge.title
                  }
                  onChange={() =>
                    setSelectedChallenge(
                      challenge.title
                    )
                  }
                />

                <div>
                  <div className="font-semibold">
                    {challenge.title}
                  </div>

                  <div className="text-sm text-zinc-400">
                    {challenge.description}
                  </div>
                </div>
              </label>
            )
          )}
        </div>

        <Button
          type="button"
          onClick={goLive}
        >
          🚀 Go Live
        </Button>
      </Card>


      {/* PLAYERS */}

      <Card>
        <h2 className="mb-4 text-xl font-bold">
          Players
        </h2>

        <div className="space-y-4">
          {players.map((player) => {
            const completedCount =
              completions.filter(
                (completion) =>
                  completion.player_id ===
                  player.id
              ).length;

            return (
              <div
                key={player.id}
                className="rounded-2xl border border-zinc-700 p-4"
              >
                <Input
                  defaultValue={player.name}
                  onBlur={(event) =>
                    renamePlayer(
                      player.id,
                      event.target.value
                    )
                  }
                />

                <select
                  value={
                    player.team ?? ""
                  }
                  onChange={(event) =>
                    changeTeam(
                      player.id,
                      event.target.value
                    )
                  }
                  className="mt-3 w-full rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-white"
                >
                  <option value="">
                    Unassigned
                  </option>

                  {teams.map((team) => (
                    <option
                      key={team.id}
                      value={team.name}
                    >
                      {team.name}
                    </option>
                  ))}
                </select>

                <p className="mt-3 text-sm text-zinc-400">
                  {completedCount} completed{" "}
                  {completedCount === 1
                    ? "challenge"
                    : "challenges"}
                </p>

                <p className="mt-2 font-bold">
                  {player.score} pts
                </p>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    onClick={() =>
                      addPoints(
                        player.id,
                        5
                      )
                    }
                  >
                    +5
                  </Button>

                  <Button
                    type="button"
                    onClick={() =>
                      addPoints(
                        player.id,
                        10
                      )
                    }
                  >
                    +10
                  </Button>

                  <Button
                    type="button"
                    onClick={() =>
                      addPoints(
                        player.id,
                        20
                      )
                    }
                  >
                    +20
                  </Button>

                  <Button
                    type="button"
                    onClick={() =>
                      removePoints(
                        player.id,
                        5
                      )
                    }
                  >
                    -5
                  </Button>

                  <Button
                    type="button"
                    onClick={() =>
                      removePoints(
                        player.id,
                        10
                      )
                    }
                  >
                    -10
                  </Button>

                  <Button
                    type="button"
                    onClick={() =>
                      removePoints(
                        player.id,
                        20
                      )
                    }
                  >
                    -20
                  </Button>
                </div>

                <div className="mt-4">
                  <Button
                    type="button"
                    onClick={async () => {
                      const confirmed =
                        window.confirm(
                          `Delete ${player.name}?`
                        );

                      if (!confirmed) {
                        return;
                      }

                      await deletePlayer(
                        player.id
                      );
                    }}
                  >
                    Delete Player
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>


      {/* BROADCAST */}

      <Card>
        <h2 className="mb-4 text-xl font-bold">
          Broadcast Message
        </h2>

        <Input
          placeholder="Message to everyone..."
          value={broadcastMessage}
          onChange={(
            event: ChangeEvent<HTMLInputElement>
          ) =>
            setBroadcastMessage(
              event.target.value
            )
          }
        />

        <div className="mt-4">
          <Button
            type="button"
            onClick={sendBroadcast}
          >
            Send Message
          </Button>
        </div>
      </Card>


      {/* VOTING */}

      <Card>
        <h2 className="mb-4 text-xl font-bold">
          Voting
        </h2>

        <p className="mb-4 text-sm text-zinc-400">
          Current challenge:{" "}
          {game.current_challenge}
        </p>

        <select
          value={
            game.voting_target ??
            "player"
          }
          onChange={async (
            event
          ) => {
            await updateGameState({
              voting_target:
                event.target.value as
                  | "player"
                  | "team",
            });
          }}
          className="mb-4 w-full rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-white"
        >
          <option value="player">
            Vote for Player
          </option>

          <option value="team">
            Vote for Team
          </option>
        </select>

        <div className="space-y-3">

          {!game.voting_open &&
            !game.show_vote_results && (
              <Button
                type="button"
                onClick={openVoting}
              >
                Open Voting
              </Button>
            )}


          {game.voting_open && (
            <>
              <Button
                type="button"
                onClick={() =>
                  navigate(
                    "/vote?from=admin"
                  )
                }
              >
                🗳️ Vote Now
              </Button>

              <Button
                type="button"
                onClick={closeVoting}
              >
                Close Voting & Show Results
              </Button>
            </>
          )}


          {game.show_vote_results && (
            <>
              <Button
                type="button"
                onClick={() =>
                  navigate(
                    "/vote-results"
                  )
                }
              >
                View Results
              </Button>

              <Button
                type="button"
                onClick={closeResults}
              >
                Close Results & Return Everyone
              </Button>
            </>
          )}
        </div>

        <div className="mt-4 rounded-xl bg-black/50 p-3 text-sm">
          {game.voting_open && (
            <p>
              🟢 Voting is currently open
            </p>
          )}

          {game.show_vote_results && (
            <p>
              🏆 Results are currently showing
            </p>
          )}

          {!game.voting_open &&
            !game.show_vote_results && (
              <p>
                ⚪ Voting is closed
              </p>
            )}
        </div>
      </Card>


      {/* LIVE VOTING RESULTS */}

      <Card>
        <h2 className="mb-4 text-xl font-bold">
          Live Voting Results
        </h2>

        <p className="mb-4">
          {game.current_challenge}
        </p>

        {game.voting_target ===
        "team" ? (
          <div className="space-y-3">
            {teamVoteResults.map(
              (team) => (
                <div
                  key={team.id}
                  className="flex items-center justify-between rounded-xl bg-black/70 p-3"
                >
                  <div className="font-bold">
                    {team.name}
                  </div>

                  <div className="text-2xl font-bold">
                    {team.votes}
                  </div>
                </div>
              )
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {playerVoteResults.map(
              (player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between rounded-xl bg-black/70 p-3"
                >
                  <div>
                    <div className="font-bold">
                      {player.name}
                    </div>

                    <div className="text-sm text-zinc-400">
                      {player.team ??
                        "Unassigned"}
                    </div>
                  </div>

                  <div className="text-2xl font-bold">
                    {player.votes}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </Card>

    </main>
  );
}