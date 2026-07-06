import { useEffect, useState, type ChangeEvent } from "react";
import { supabase } from "../lib/supabase";

import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

import { usePlayers } from "../game/hooks/usePlayers";
import { useGameState } from "../game/hooks/useGameState";
import { usePubs } from "../game/hooks/usePubs";
import { useChallenges } from "../game/hooks/useChallenges";

import { updateGameState } from "../lib/gameApi";
import { addPoints, changeTeam, deletePlayer, removePoints, renamePlayer } from "../lib/playerApi";


import { getVotesForChallenge } from "../lib/voteApi";
import { useNavigate } from "react-router-dom";

import useChallengeCompletions from "../hooks/challengeCompletions";

export default function Admin() {
  const players = usePlayers();
  const game = useGameState();
  const [assigningPlayerId, setAssigningPlayerId] =
  useState<string | null>(null);
  async function createTeam() {
  const cleanName =
    newTeamName.trim();

  if (!cleanName) {
    alert("Enter a team name.");
    return;
  }

  setCreatingTeam(true);

  const teamId = cleanName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const { error } = await supabase
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
  const pubs = usePubs();
  const challenges = useChallenges();
  const navigate = useNavigate();
  const [newTeamName, setNewTeamName] =
  useState("");

const [creatingTeam, setCreatingTeam] =
  useState(false);
  const [teams, setTeams] = useState<
  {
    id: string;
    name: string;
  }[]
>([]);

  const completions = useChallengeCompletions();

const [votes, setVotes] = useState<
  {
    id: number;
    voter_id: string;
    voted_for_player_id: string;
    challenge_name: string;
  }[]
>([]);


// LOAD TEAMS
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


// LOAD VOTES + REALTIME
useEffect(() => {
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
        "LOAD VOTES ERROR",
        error
      );
      return;
    }

    setVotes(data ?? []);
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

  const [selectedPub, setSelectedPub] = useState("");
  const [selectedChallenge, setSelectedChallenge] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  if (!game) return <p>Loading...</p>;
  const unassignedPlayers = players.filter(
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
    const currentPubObject = pubs.find(
    (pub) => pub.name === selectedPub
  );
  const voteResults = players
  .map((player) => ({
    ...player,
    votes: votes.filter(
      (vote) =>
        vote.voted_for_player_id === player.id
    ).length,
  }))
  .sort((a, b) => b.votes - a.votes);
  const availableChallenges = challenges.filter(
    (challenge) =>
      challenge.pub_id === currentPubObject?.id
  );

  async function goLive() {
    const challenge = challenges.find(
      (c) => c.title === selectedChallenge
    );

    await updateGameState({
      current_pub: selectedPub,
      current_challenge: selectedChallenge,
      challenge_description:
        challenge?.description ?? "",
    });

    alert("Live game updated!");
  }

  async function sendBroadcast() {
    await updateGameState({
      broadcast_message: broadcastMessage,
    });

    setBroadcastMessage("");
  }

  async function openVoting() {
    const confirmed =
      window.confirm(
        `Open voting for "${game.current_challenge}"?`
      );

    if (!confirmed) return;

    await updateGameState({
      voting_open: true,
      show_vote_results: false,
    });
  }

  async function assignPlayerToTeam(
  playerId: string,
  team: string
) {
  if (!team) {
    return;
  }

  setAssigningPlayerId(playerId);

  const { error } = await supabase
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

    return;
  }
}
async function closeVoting() {
    const confirmed =
      window.confirm(
        "Close voting and show results?"
      );

    if (!confirmed) return;

    await updateGameState({
      voting_open: false,
      show_vote_results: true,
    });
  }

  return (
    <main className="mx-auto min-h-screen max-w-md space-y-6 p-6">

      <h1 className="text-4xl font-bold">
        Host Control
      </h1>
      {unassignedPlayers.length > 0 && (
        
  <Card>
    <Card>
  <h2 className="mb-4 text-2xl font-bold">
    Create Teams
  </h2>

  <p className="mb-4">
    Create the teams first, then assign
    players to them.
  </p>

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
<div className="mb-4">
      <h2 className="text-2xl font-bold">
        ⚠️ Assign Teams
      </h2>

      <p className="mt-2">
        {unassignedPlayers.length === 1
          ? "1 player is waiting for a team."
          : `${unassignedPlayers.length} players are waiting for teams.`}
      </p>
    </div>

    <div className="space-y-4">
      {unassignedPlayers.map((player) => (
        <div
          key={player.id}
          className="rounded-2xl border-2 border-pink-500 bg-black/70 p-4"
        >
          <div className="mb-3 text-xl font-bold">
            {player.name}
          </div>

          <select
            defaultValue=""
            disabled={
              assigningPlayerId === player.id
            }
            onChange={(event) => {
              const team =
                event.target.value;

              if (!team) {
                return;
              }

              assignPlayerToTeam(
                player.id,
                team
              );
            }}
            className="w-full rounded-xl p-3 text-white"
          >
            <option value="">
              Assign to team...
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

          {assigningPlayerId ===
            player.id && (
            <p className="mt-2 text-sm">
              Assigning...
            </p>
          )}
        </div>
      ))}
    </div>
  </Card>
)}

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

    <Button
      type="button"
      onClick={() =>
        navigate("/slideshow")
      }
    >
      Slideshow
    </Button>
  </div>
</Card>
<Card>

  <h2 className="mb-4 text-xl font-bold">
    Change Live Game
  </h2>

  <label className="mb-2 block text-sm text-zinc-400">
    Pub
  </label>
{nextPub && (
  <Button
    type="button"
    onClick={async () => {
      const pubChallenges =
        challenges.filter(
          (challenge) =>
            challenge.pub_id ===
            nextPub.id
        );

      const firstChallenge =
        pubChallenges[0];

      await updateGameState({
        current_pub:
          nextPub.name,

        current_challenge:
          firstChallenge?.title ?? "",

        challenge_description:
          firstChallenge?.description ??
          "",
      });
    }}
  >
    Next Pub: {nextPub.name}
  </Button>
)}
  <select
    className="mb-6 w-full rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-white"
    value={selectedPub}
    onChange={(e: ChangeEvent<HTMLSelectElement>) => {
      setSelectedPub(e.target.value);
      setSelectedChallenge("");
    }}
  >
    <option value="">Select a pub...</option>

    {pubs.map((pub) => (
      <option key={pub.id} value={pub.name}>
        {pub.name}
      </option>
    ))}
  </select>

  <label className="mb-2 block text-sm text-zinc-400">
    Challenge
  </label>

  <div className="mb-6 space-y-3">

    {availableChallenges.map((challenge) => (

      <label
        key={challenge.id}
        className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-700 p-3"
      >

        <input
          type="radio"
          checked={selectedChallenge === challenge.title}
          onChange={() => setSelectedChallenge(challenge.title)}
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

    ))}

  </div>

  <Button onClick={goLive}>
    🚀 Go Live
  </Button>

  </Card>

      <Card>

        <h2 className="mb-4 text-xl font-bold">
          Players
        </h2>
        

        <div className="space-y-3">

          {players.map((player) => (

            <Card key={player.id}>

              <div className="flex items-center justify-between">

                <div>

                  <div className="font-bold">
                    {player.name}
                  </div>

                  <div className="text-zinc-400">
                    <select

                      value={player.team ?? ""}

                      onChange={(e)=>

                      changeTeam(
                      player.id,
                      e.target.value
                      )

                      }

                      >
                        <option value=""> Unassigned</option>


  {teams.map(team=>

    <option
      key={team.id}
      value={team.name}
    >

    {team.name}

    </option>
    

  )}

  </select>
                  </div>
                  <div className="mt-3 text-sm text-zinc-400">
                    {completions.filter(
                      (completion) =>
                        completion.player_id === player.id
                    ).length} completed challenge
                    {completions.filter(
                      (completion) =>
                        completion.player_id === player.id
                    ).length === 1 ? "" : "s"}
                  </div>

                  <div className="mt-2">
                    {player.score} pts
                  </div>
                  <Input
                    defaultValue={player.name}
                    onBlur={(e) => renamePlayer(player.id, e.target.value)}
                    />
                    <p className="flex:items-center justify-between">
<Button
                    onClick={async()=>{
                    if(confirm("Delete player?")){
                    await deletePlayer(player.id);
                    }
                    }}
                    >
                    X
                  </Button>
                  </p>
                </div>
                <div className="grid-cols-3 gap-2 gap-y-2">
                  <div className="flex gap-2">
                  
                  
                  <div className="grid-cols-3 mt-4 gap-2">
                    <p className="grid-cols-3 mt-4">
                    <Button
                    onClick={() =>
                      addPoints(player.id, 10)
                    }
                  >
                    +5
                  </Button>
                  <Button
                    onClick={() =>
                      addPoints(player.id, 10)
                    }
                  >
                    +10
                  </Button>
                  <Button
                    onClick={() =>
                      addPoints(player.id, 20)
                    }
                  >
                    +20
                  </Button>
                  </p>
                  </div>
                  <div className="grid-cols-3 mt-4 gap-2 gap-2">
                    <p className="inline:grid-cols-3 mt-4">
                  <Button
                    onClick={()=>removePoints(player.id,10)}
                  >
                    -5
                  </Button>
                  <Button
                    onClick={()=>removePoints(player.id,10)}
                  >
                    -10
                  </Button>
                  <Button
                    onClick={()=>removePoints(player.id,10)}
                  >
                    -20
                  </Button>
                  </p>
                  </div>
                  <div>

                
                  </div>
                  
</div>
                </div>

              </div>

            </Card>

          ))}

        </div>

      </Card>

      <Card>

        <h2 className="mb-4 text-xl font-bold">
          Broadcast Message
        </h2>

        <Input
          placeholder="Message to everyone..."
          value={broadcastMessage}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setBroadcastMessage(e.target.value)
          }
        />

        <div className="mt-4">

          <Button onClick={sendBroadcast}>
            Send
          </Button>

        </div>

      </Card>
      <Card>

  <h2>Voting</h2>
  <select
  value={game.voting_target ?? "player"}
  onChange={async (e) => {
    await updateGameState({
      voting_target:
        e.target.value as "player" | "team",
    });
  }}
  className="mb-4 w-full rounded-xl p-3 text-white"
>
  <option value="player">
    Vote for Player
  </option>

  <option value="team">
    Vote for Team
  </option>
</select>

<Button onClick={openVoting}>
      Open Voting
    </Button>

    <Button onClick={closeVoting}>
    Close Voting
  </Button>

</Card>
<Card>
  <h2 className="mb-4 text-xl font-bold">
    Voting Results
  </h2>

  <p className="mb-4">
    {game.current_challenge}
  </p>

  <div className="space-y-3">
    {voteResults.map((player) => (
      <div
        key={player.id}
        className="flex items-center justify-between rounded-xl bg-black/70 p-3"
      >
        <div>
          <div className="font-bold">
            {player.name}
          </div>

          <div className="text-sm">
            {player.team}
          </div>
        </div>

        <div className="text-2xl font-bold">
          {player.votes}
        </div>
      </div>
    ))}
  </div>
</Card>

    </main>
  );
}