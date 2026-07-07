import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  supabase,
} from "../lib/supabase";

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

import useSideChallenges
  from "../game/hooks/useSideChallenges";

import usePubSubChallenges
  from "../game/hooks/usePubSubChallenges";

import useChallengeCompletions
  from "../game/hooks/useChallengeCompletions";

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

import {
  uploadPhoto,
} from "../lib/photoApi";

import {
  completeChallenge,
  type ChallengeType,
} from "../lib/completionApi";


type AdminTab =
  | "live"
  | "challenges"
  | "review"
  | "screens"
  | "voting"
  | "players"
  | "teams";

interface Team {
  id: string;
  name: string;
}


interface VoteRow {
  id: string | number;

  voter_id:
    string;

  voted_for_player_id:
    | string
    | null;

  voted_for_team_id:
    | string
    | null;

  challenge_name:
    string;
}


interface PendingUpload {
  id: string | number;
  title: string;
  points: number;

  type:
    | "side"
    | "bonus";
}


export default function Admin() {
  // =========================================
  // DATA HOOKS
  // =========================================

  const players =
    usePlayers();

  const game =
    useGameState();

  const pubs =
    usePubs();

  const challenges =
    useChallenges();

  const sideChallenges =
    useSideChallenges();

  const pubSubChallenges =
    usePubSubChallenges();

  const completions =
    useChallengeCompletions();

  const navigate =
    useNavigate();


  // =========================================
  // TAB STATE
  // =========================================

  const [
    activeTab,
    setActiveTab,
  ] = useState<AdminTab>(
    "live"
  );


  // =========================================
  // GAME SELECTION STATE
  // =========================================

  const [
    selectedPub,
    setSelectedPub,
  ] = useState("");

  const [
    selectedChallenge,
    setSelectedChallenge,
  ] = useState("");


  // =========================================
  // TEAM STATE
  // =========================================

  const [
    teams,
    setTeams,
  ] = useState<Team[]>([]);

  const [
    newTeamName,
    setNewTeamName,
  ] = useState("");

  const [
    creatingTeam,
    setCreatingTeam,
  ] = useState(false);

  const [
    assigningPlayerId,
    setAssigningPlayerId,
  ] = useState<string | null>(
    null
  );


  // =========================================
  // VOTING STATE
  // =========================================

  const [
    votes,
    setVotes,
  ] = useState<VoteRow[]>([]);


  // =========================================
  // HOST PARTICIPATION STATE
  // =========================================

  const [
    playingAsPlayerId,
    setPlayingAsPlayerId,
  ] = useState("");

  const [
    pendingUpload,
    setPendingUpload,
  ] = useState<PendingUpload | null>(
    null
  );

  const [
    uploadingChallengeKey,
    setUploadingChallengeKey,
  ] = useState<string | null>(
    null
  );

  const [
    completingChallengeKey,
    setCompletingChallengeKey,
  ] = useState<string | null>(
    null
  );

  const [
    pendingCompletedKeys,
    setPendingCompletedKeys,
  ] = useState<Set<string>>(
    () => new Set()
  );

  const challengeFileInputRef =
    useRef<HTMLInputElement>(null);


  // =========================================
  // LOAD TEAMS
  // =========================================

  async function loadTeams() {
    const {
      data,
      error,
    } = await supabase
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

    setTeams(
      (data ?? []) as Team[]
    );
  }


  useEffect(() => {
    void loadTeams();
  }, []);


  // =========================================
  // LOAD VOTES + REALTIME
  // =========================================

  useEffect(() => {
    if (
      !game?.current_challenge
    ) {
      return;
    }

    async function loadVotes() {
      if (
        !game?.current_challenge
      ) {
        return;
      }

      const {
        data,
        error,
      } =
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

    void loadVotes();

    const channel =
      supabase
        .channel(
          "admin-votes"
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "votes",
          },
          () => {
            void loadVotes();
          }
        )
        .subscribe();

    return () => {
      void supabase
        .removeChannel(
          channel
        );
    };
  }, [
    game?.current_challenge,
  ]);


  // =========================================
  // KEEP SELECTS IN SYNC
  // =========================================

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


  // =========================================
  // CLEAN OPTIMISTIC COMPLETIONS
  // =========================================

  useEffect(() => {
    if (
      pendingCompletedKeys.size ===
      0
    ) {
      return;
    }

    setPendingCompletedKeys(
      (current) => {
        const next =
          new Set(current);

        let changed =
          false;

        for (const key of current) {
          const [
            playerId,
            type,
            challengeId,
          ] = key.split(":");

          const exists =
            completions.some(
              (completion) =>
                String(
                  completion.player_id
                ) ===
                  String(playerId) &&

                completion.challenge_type ===
                  type &&

                String(
                  completion.challenge_id
                ) ===
                  String(challengeId)
            );

          if (exists) {
            next.delete(key);
            changed = true;
          }
        }

        return changed
          ? next
          : current;
      }
    );
  }, [
    completions,
    pendingCompletedKeys.size,
  ]);


  // =========================================
  // SAFE LOADING RETURN
  // =========================================

  if (!game) {
    return (
      <main className="mx-auto min-h-screen max-w-md p-6">
        <p>
          Loading host control...
        </p>
      </main>
    );
  }
const currentGame = game;

  // =========================================
  // DERIVED GAME DATA
  // =========================================

  const sortedPubs =
    [...pubs].sort(
      (a, b) =>
        Number(a.order_index ?? 0) -
        Number(b.order_index ?? 0)
    );


  const currentPubIndex =
    sortedPubs.findIndex(
      (pub) =>
        pub.name ===
        game.current_pub
    );


  const nextPub =
    currentPubIndex >= 0
      ? sortedPubs[
          currentPubIndex + 1
        ]
      : undefined;


  const selectedPubObject =
    pubs.find(
      (pub) =>
        pub.name ===
        selectedPub
    );


  const livePubObject =
    pubs.find(
      (pub) =>
        pub.name ===
        game.current_pub
    );


  const availableChallenges =
    challenges.filter(
      (challenge) =>
        String(
          challenge.pub_id
        ) ===
        String(
          selectedPubObject?.id
        )
    );


  const currentPubSubChallenges =
    pubSubChallenges.filter(
      (challenge) =>
        String(
          challenge.pub_id
        ) ===
        String(
          livePubObject?.id
        )
    );


  const playingAsPlayer =
    players.find(
      (player) =>
        String(player.id) ===
        String(playingAsPlayerId)
    );


  // =========================================
  // COMPLETION HELPERS
  // =========================================

  function completionKey(
    playerId: string,
    challengeType: ChallengeType,
    challengeId: string | number
  ) {
    return [
      playerId,
      challengeType,
      String(challengeId),
    ].join(":");
  }


  function hasPlayerCompleted(
    playerId: string,
    challengeType: ChallengeType,
    challengeId: string | number
  ) {
    const key =
      completionKey(
        playerId,
        challengeType,
        challengeId
      );

    return (
      pendingCompletedKeys.has(key) ||

      completions.some(
        (completion) =>
          String(
            completion.player_id
          ) ===
            String(playerId) &&

          completion.challenge_type ===
            challengeType &&

          String(
            completion.challenge_id
          ) ===
            String(challengeId)
      )
    );
  }


  function getPlayersWhoCompleted(
    challengeType:
      | "side"
      | "bonus",

    challengeId:
      string | number
  ) {
    return completions
      .filter(
        (completion) =>
          completion.challenge_type ===
            challengeType &&

          String(
            completion.challenge_id
          ) ===
            String(challengeId)
      )
      .map(
        (completion) =>
          players.find(
            (player) =>
              String(player.id) ===
              String(
                completion.player_id
              )
          )
      )
      .filter(
        (
          player
        ): player is NonNullable<
          typeof player
        > =>
          Boolean(player)
      );
  }


  function markPendingComplete(
    playerId: string,
    challengeType: ChallengeType,
    challengeId: string | number
  ) {
    const key =
      completionKey(
        playerId,
        challengeType,
        challengeId
      );

    setPendingCompletedKeys(
      (current) => {
        const next =
          new Set(current);

        next.add(key);

        return next;
      }
    );
  }


  function removePendingComplete(
    playerId: string,
    challengeType: ChallengeType,
    challengeId: string | number
  ) {
    const key =
      completionKey(
        playerId,
        challengeType,
        challengeId
      );

    setPendingCompletedKeys(
      (current) => {
        const next =
          new Set(current);

        next.delete(key);

        return next;
      }
    );
  }


  // =========================================
  // LIVE GAME
  // =========================================

  async function goLive() {
    if (!selectedPub) {
      alert(
        "Select a pub first."
      );

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

    const {
      error,
    } = await updateGameState({
      current_pub:
        selectedPub,

      current_challenge:
        selectedChallenge,

      challenge_description:
        challenge?.description ??
        "",

      voting_open:
        false,

      show_vote_results:
        false,

      slideshow_open:
        false,
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

    alert(
      "Live game updated!"
    );
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
          String(
            challenge.pub_id
          ) ===
          String(nextPub.id)
      );

    const firstChallenge =
      pubChallenges[0];

    const {
      error,
    } = await updateGameState({
      current_pub:
        nextPub.name,

      current_challenge:
        firstChallenge?.title ??
        "",

      challenge_description:
        firstChallenge?.description ??
        "",

      voting_open:
        false,

      show_vote_results:
        false,

      slideshow_open:
        false,
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
      firstChallenge?.title ??
      ""
    );
  }


  // =========================================
  // SLIDESHOW
  // =========================================

  async function startSlideshow() {
    const confirmed =
      window.confirm(
        "Start the slideshow for everyone?"
      );

    if (!confirmed) {
      return;
    }

    const {
      error,
    } = await updateGameState({
      slideshow_open:
        true,

      voting_open:
        false,

      show_vote_results:
        false,
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

    const {
      error,
    } = await updateGameState({
      slideshow_open:
        false,
    });

    if (error) {
      alert(
        `Could not end slideshow: ${error.message}`
      );
    }
  }


  // =========================================
  // VOTING
  // =========================================

  async function openVoting() {
    const confirmed =
      window.confirm(
        `Open voting for "${game?.current_challenge ?? "current "}"?`
      );

    if (!confirmed) {
      return;
    }

    const {
      error,
    } = await updateGameState({
      voting_open:
        true,

      show_vote_results:
        false,

      slideshow_open:
        false,
    });

    if (error) {
      alert(
        `Could not open voting: ${error.message}`
      );
    }
  }


  async function closeVoting() {
    const confirmed =
      window.confirm(
        "Close voting and show results?"
      );

    if (!confirmed) {
      return;
    }

    const {
      error,
    } = await updateGameState({
      voting_open:
        false,

      show_vote_results:
        true,

      slideshow_open:
        false,
    });

    if (error) {
      alert(
        `Could not show results: ${error.message}`
      );
    }
  }


  async function closeResults() {
    const confirmed =
      window.confirm(
        "Close results and return everyone to the game?"
      );

    if (!confirmed) {
      return;
    }

    const {
      error,
    } = await updateGameState({
      show_vote_results:
        false,

      voting_open:
        false,

      slideshow_open:
        false,
    });

    if (error) {
      alert(
        `Could not close results: ${error.message}`
      );
    }
  }


  // =========================================
  // HOST MARK DONE
  // =========================================

  async function markChallengeDone(
    challengeType:
      | "side"
      | "bonus",

    challengeId:
      string | number,

    points:
      number
  ) {
    if (!playingAsPlayerId) {
      alert(
        "Choose who you are playing as first."
      );

      return;
    }

    const key =
      completionKey(
        playingAsPlayerId,
        challengeType,
        challengeId
      );

    setCompletingChallengeKey(
      key
    );

    markPendingComplete(
      playingAsPlayerId,
      challengeType,
      challengeId
    );

    const {
      error,
    } = await completeChallenge({
      playerId:
        playingAsPlayerId,

      challengeType,

      challengeId,

      points,

      photoId:
        null,
    });

    setCompletingChallengeKey(
      null
    );

    if (error) {
      if (
        error.code ===
        "ALREADY_COMPLETED"
      ) {
        return;
      }

      removePendingComplete(
        playingAsPlayerId,
        challengeType,
        challengeId
      );

      alert(
        `Could not complete challenge: ${error.message}`
      );
    }
  }


  // =========================================
  // HOST CHOOSES UPLOAD
  // =========================================

  function chooseChallengeUpload(
    details: PendingUpload
  ) {
    if (!playingAsPlayerId) {
      alert(
        "Choose who you are playing as first."
      );

      return;
    }

    setPendingUpload(
      details
    );

    window.setTimeout(() => {
      challengeFileInputRef
        .current
        ?.click();
    }, 0);
  }


  // =========================================
  // HOST PHOTO / VIDEO UPLOAD
  // =========================================

  async function handleChallengeFileSelected(
    event:
      ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    const details =
      pendingUpload;

    if (
      !file ||
      !details ||
      !playingAsPlayerId ||
      !playingAsPlayer
    ) {
      event.target.value = "";
      return;
    }

    const key =
      completionKey(
        playingAsPlayerId,
        details.type,
        details.id
      );

    setUploadingChallengeKey(
      key
    );

    const {
      data,
      error,
    } = await uploadPhoto(
      file,
      {
        playerId:
          playingAsPlayerId,

        playerName:
          playingAsPlayer.name,

        team:
          playingAsPlayer.team ??
          null,

        challenge:
          details.title,

        pub:
          currentGame.current_pub ?? "",

        points:
          details.points,
      }
    );

    if (error) {
      setUploadingChallengeKey(
        null
      );

      setPendingUpload(
        null
      );

      event.target.value =
        "";

      alert(
        `Upload failed: ${error.message}`
      );

      return;
    }

    markPendingComplete(
      playingAsPlayerId,
      details.type,
      details.id
    );

    const {
      error: completionError,
    } = await completeChallenge({
      playerId:
        playingAsPlayerId,

      challengeType:
        details.type,

      challengeId:
        details.id,

      points:
        details.points,

      photoId:
        data?.id ?? null,
    });

    setUploadingChallengeKey(
      null
    );

    setPendingUpload(
      null
    );

    event.target.value =
      "";

    if (completionError) {
      if (
        completionError.code ===
        "ALREADY_COMPLETED"
      ) {
        return;
      }

      removePendingComplete(
        playingAsPlayerId,
        details.type,
        details.id
      );

      alert(
        `Media uploaded, but completion failed: ${completionError.message}`
      );
    }
  }


  // =========================================
  // TEAMS
  // =========================================

  async function createTeam() {
    const trimmed =
      newTeamName.trim();

    if (!trimmed) {
      return;
    }

    setCreatingTeam(
      true
    );

    const {
      error,
    } = await supabase
      .from("teams")
      .insert({
        name: trimmed,
      });

    setCreatingTeam(
      false
    );

    if (error) {
      alert(
        `Could not create team: ${error.message}`
      );

      return;
    }

    setNewTeamName("");

    await loadTeams();
  }


  async function assignTeam(
    playerId: string,
    teamName: string
  ) {
    setAssigningPlayerId(
      playerId
    );

    await changeTeam(
      playerId,
      teamName
    );

    setAssigningPlayerId(
      null
    );
  }


  // =========================================
  // VOTE RESULTS
  // =========================================

  const playerVoteResults =
    players
      .map(
        (player) => ({
          id:
            player.id,

          name:
            player.name,

          votes:
            votes.filter(
              (vote) =>
                String(
                  vote.voted_for_player_id
                ) ===
                String(player.id)
            ).length,
        })
      )
      .sort(
        (a, b) =>
          b.votes - a.votes
      );


  const teamVoteResults =
    teams
      .map(
        (team) => ({
          id:
            team.id,

          name:
            team.name,

          votes:
            votes.filter(
              (vote) =>
                String(
                  vote.voted_for_team_id
                ) ===
                  String(team.id) ||

                String(
                  vote.voted_for_team_id
                ) ===
                  String(team.name)
            ).length,
        })
      )
      .sort(
        (a, b) =>
          b.votes - a.votes
      );


  const liveResults =
    game.voting_target ===
    "team"
      ? teamVoteResults
      : playerVoteResults;


  // =========================================
  // TAB BUTTON
  // =========================================

  function tabButton(
    tab: AdminTab,
    label: string
  ) {
    const selected =
      activeTab === tab;

    return (
      <button
        type="button"
        onClick={() =>
          setActiveTab(tab)
        }
        className={`
          shrink-0 rounded-xl px-4 py-3
          text-sm font-bold
          ${
            selected
              ? "bg-pink-500 text-white"
              : "bg-zinc-900 text-zinc-300"
          }
        `}
      >
        {label}
      </button>
      
    );
  }


  // =========================================
  // PAGE
  // =========================================

  return (
    <main className="mx-auto min-h-screen max-w-md p-6">

      <h1 className="text-4xl font-bold">
        Host Control
      </h1>


      {/* HIDDEN MEDIA INPUT */}

      <input
        ref={
          challengeFileInputRef
        }
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={
          handleChallengeFileSelected
        }
      />


      {/* TABS */}
      <div className="sticky top-0 z-30 -mx-6 mt-6 overflow-x-auto border-y border-zinc-800 bg-black/95 px-6 py-3 backdrop-blur">
        <div className="flex gap-2">
          {tabButton("live", "🔴 Live")}
          {tabButton("challenges", "🎯 Challenges")}
          {tabButton("review", "✅ Review")}
          {tabButton("screens", "📺 Screens")}
          {tabButton("voting", "🗳️ Voting")}
          {tabButton("players", "👥 Players")}
          {tabButton("teams", "🏁 Teams")}
        </div>
      </div>

      <div className="mt-6 space-y-6">

        {/* =================================
            LIVE TAB
        ================================= */}

        {activeTab ===
          "live" && (
          <>

            <Card>
              <h2 className="text-xl font-bold">
                Live Now
              </h2>

              <p className="mt-4 text-sm">
                📍 Current Pub
              </p>

              <p className="text-2xl font-bold">
                {
                  game.current_pub
                }
              </p>

              <p className="mt-4 text-sm">
                ⭐ Current Challenge
              </p>

              <p className="text-xl font-bold">
                {
                  game.current_challenge
                }
              </p>

              <p className="mt-2 text-sm text-zinc-400">
                {
                  game.challenge_description
                }
              </p>

              {nextPub && (
                <div className="mt-6">
                  <Button
                    type="button"
                    onClick={
                      moveToNextPub
                    }
                  >
                    Next Pub:{" "}
                    {nextPub.name}
                  </Button>
                </div>
              )}
            </Card>


            <Card>
              <h2 className="text-xl font-bold">
                Change Live Game
              </h2>

              <label className="mt-4 block text-sm">
                Pub
              </label>

              <select
                value={
                  selectedPub
                }
                onChange={(
                  event
                ) => {
                  const pubName =
                    event.target.value;

                  setSelectedPub(
                    pubName
                  );

                  const pub =
                    pubs.find(
                      (item) =>
                        item.name ===
                        pubName
                    );

                  const first =
                    challenges.find(
                      (challenge) =>
                        String(
                          challenge.pub_id
                        ) ===
                        String(pub?.id)
                    );

                  setSelectedChallenge(
                    first?.title ??
                    ""
                  );
                }}
                className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-white"
              >
                <option value="">
                  Select pub
                </option>

                {sortedPubs.map(
                  (pub) => (
                    <option
                      key={pub.id}
                      value={
                        pub.name
                      }
                    >
                      {pub.name}
                    </option>
                  )
                )}
              </select>


              <label className="mt-4 block text-sm">
                Challenge
              </label>

              <select
                value={
                  selectedChallenge
                }
                onChange={(
                  event
                ) =>
                  setSelectedChallenge(
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-white"
              >
                <option value="">
                  Select challenge
                </option>

                {availableChallenges.map(
                  (challenge) => (
                    <option
                      key={
                        challenge.id
                      }
                      value={
                        challenge.title
                      }
                    >
                      {
                        challenge.title
                      }
                    </option>
                  )
                )}
              </select>


              <div className="mt-6">
                <Button
                  type="button"
                  onClick={goLive}
                >
                  Go Live
                </Button>
                {(() => {
  const activeChallenge =
    challenges.find(
      (challenge) =>
        challenge.title ===
        game?.current_challenge
    );

  if (!activeChallenge) {
    return null;
  }

  return (
    <Button
      type="button"
      onClick={() =>
        navigate(
          `/challenge-review?type=main&id=${encodeURIComponent(
            String(activeChallenge.id)
          )}&title=${encodeURIComponent(
            activeChallenge.title
          )}`
        )
      }
    >
      Review & Award Points
    </Button>
    
  );
})()}
              </div>
            </Card>

          </>
        )}


        {/* =================================
            CHALLENGES TAB
        ================================= */}

        {activeTab ===
          "challenges" && (
          <>

            <Card>
              <h2 className="text-xl font-bold">
                Play as a Player
              </h2>

              <p className="mt-2 text-sm text-zinc-400">
                Choose your joined
                player account to take
                part as host.
              </p>

              <select
                value={
                  playingAsPlayerId
                }
                onChange={(
                  event
                ) =>
                  setPlayingAsPlayerId(
                    event.target.value
                  )
                }
                className="mt-4 w-full rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-white"
              >
                <option value="">
                  Select player
                </option>

                {players.map(
                  (player) => (
                    <option
                      key={
                        player.id
                      }
                      value={
                        player.id
                      }
                    >
                      {
                        player.name
                      }

                      {player.team
                        ? ` • ${player.team}`
                        : ""}
                    </option>
                  )
                )}
              </select>
            </Card>


            {/* CHAOS BINGO */}

            <Card>
              <h2 className="text-2xl font-bold">
                Chaos Bingo
              </h2>

              {!playingAsPlayerId ? (
                <p className="mt-4 text-yellow-400">
                  Select a player above
                  to take part.
                </p>
              ) : (
                <div className="mt-4 space-y-4">

                  {sideChallenges.map(
                    (challenge) => {
                      const completed =
                        hasPlayerCompleted(
                          playingAsPlayerId,
                          "side",
                          challenge.id
                        );

                      const completedBy =
                        getPlayersWhoCompleted(
                          "side",
                          challenge.id
                        );

                      const key =
                        completionKey(
                          playingAsPlayerId,
                          "side",
                          challenge.id
                        );

                      return (
                        <div
                          key={
                            challenge.id
                          }
                          className={`
                            rounded-2xl border-2 p-4
                            ${
                              completed
                                ? "border-green-500 bg-green-950/40"
                                : "border-pink-500 bg-black/70"
                            }
                          `}
                        >
                          <div className="flex justify-between gap-4">
                            <div>
                              <h3 className="font-bold">
                                {
                                  challenge.title
                                }
                              </h3>

                              {challenge.description && (
                                <p className="mt-1 text-sm text-zinc-300">
                                  {
                                    challenge.description
                                  }
                                </p>
                              )}
                            </div>

                            <strong>
                              +{
                                challenge.points
                              }
                            </strong>
                          </div>


                          {!completed && (
                            <div className="mt-4 flex flex-wrap gap-2">

                              <Button
                                type="button"
                                disabled={
                                  completingChallengeKey !==
                                    null ||
                                  uploadingChallengeKey !==
                                    null
                                }
                                onClick={() =>
                                  markChallengeDone(
                                    "side",
                                    challenge.id,
                                    challenge.points
                                  )
                                }
                              >
                                {completingChallengeKey ===
                                key
                                  ? "Saving..."
                                  : "✓ Mark Done"}
                              </Button>


                              <Button
                                type="button"
                                disabled={
                                  completingChallengeKey !==
                                    null ||
                                  uploadingChallengeKey !==
                                    null
                                }
                                onClick={() =>
                                  chooseChallengeUpload({
                                    id:
                                      challenge.id,

                                    title:
                                      challenge.title,

                                    points:
                                      challenge.points,

                                    type:
                                      "side",
                                  })
                                }
                              >
                                {uploadingChallengeKey ===
                                key
                                  ? "Uploading..."
                                  : "📸 Upload Photo / Video"}
                              </Button>
                              <Button
  type="button"
  onClick={() =>
    navigate(
      `/challenge-review?type=side&id=${encodeURIComponent(
        String(challenge.id)
      )}&title=${encodeURIComponent(
        challenge.title
      )}`
    )
  }
>
  Review & Award Points
</Button>

                            </div>
                          )}


                          {completed && (
                            <p className="mt-4 font-bold text-green-400">
                              ✓ Completed
                            </p>
                          )}


                          <div className="mt-4">
                            <p className="text-xs uppercase text-zinc-400">
                              Completed by
                            </p>

                            {completedBy.length ===
                            0 ? (
                              <p className="mt-1 text-sm text-zinc-500">
                                Nobody yet
                              </p>
                            ) : (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {completedBy.map(
                                  (player) => (
                                    <span
                                      key={
                                        player.id
                                      }
                                      className="rounded-full bg-green-900/60 px-3 py-1 text-sm"
                                    >
                                      ✓{" "}
                                      {
                                        player.name
                                      }
                                    </span>
                                  )
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                  )}

                </div>
              )}
            </Card>


            {/* PUB BONUS MISSIONS */}

            <Card>
              <h2 className="text-2xl font-bold">
                Pub Bonus Missions
              </h2>

              <p className="mt-2 text-sm text-zinc-400">
                Live pub:{" "}
                <strong>
                  {
                    game.current_pub
                  }
                </strong>
              </p>


              {!playingAsPlayerId ? (
                <p className="mt-4 text-yellow-400">
                  Select a player above
                  to take part.
                </p>
              ) : !livePubObject ? (
                <p className="mt-4 text-yellow-400">
                  Current pub could not
                  be matched.
                </p>
              ) : currentPubSubChallenges.length ===
                0 ? (
                <p className="mt-4 text-zinc-400">
                  No bonus missions for
                  this pub.
                </p>
              ) : (
                <div className="mt-4 space-y-4">

                  {currentPubSubChallenges.map(
                    (challenge) => {
                      const completed =
                        hasPlayerCompleted(
                          playingAsPlayerId,
                          "bonus",
                          challenge.id
                        );

                      const completedBy =
                        getPlayersWhoCompleted(
                          "bonus",
                          challenge.id
                        );

                      const key =
                        completionKey(
                          playingAsPlayerId,
                          "bonus",
                          challenge.id
                        );

                      return (
                        <div
                          key={
                            challenge.id
                          }
                          className={`
                            rounded-2xl border-2 p-4
                            ${
                              completed
                                ? "border-green-500 bg-green-950/40"
                                : "border-yellow-400 bg-black/70"
                            }
                          `}
                        >
                          <div className="flex justify-between gap-4">
                            <div>
                              <h3 className="font-bold">
                                {
                                  challenge.title
                                }
                              </h3>

                              {challenge.description && (
                                <p className="mt-1 text-sm text-zinc-300">
                                  {
                                    challenge.description
                                  }
                                </p>
                              )}
                            </div>

                            <strong>
                              +{
                                challenge.points
                              }
                            </strong>
                          </div>


                          {!completed && (
                            <div className="mt-4 flex flex-wrap gap-2">

                              <Button
                                type="button"
                                disabled={
                                  completingChallengeKey !==
                                    null ||
                                  uploadingChallengeKey !==
                                    null
                                }
                                onClick={() =>
                                  markChallengeDone(
                                    "bonus",
                                    challenge.id,
                                    challenge.points
                                  )
                                }
                              >
                                {completingChallengeKey ===
                                key
                                  ? "Saving..."
                                  : "✓ Mark Done"}
                              </Button>


                              <Button
                                type="button"
                                disabled={
                                  completingChallengeKey !==
                                    null ||
                                  uploadingChallengeKey !==
                                    null
                                }
                                onClick={() =>
                                  chooseChallengeUpload({
                                    id:
                                      challenge.id,

                                    title:
                                      challenge.title,

                                    points:
                                      challenge.points,

                                    type:
                                      "bonus",
                                  })
                                }
                              >
                                {uploadingChallengeKey ===
                                key
                                  ? "Uploading..."
                                  : "📸 Upload Photo / Video"}
                              </Button>
                              <Button
  type="button"
  onClick={() =>
    navigate(
      `/challenge-review?type=bonus&id=${encodeURIComponent(
        String(challenge.id)
      )}&title=${encodeURIComponent(
        challenge.title
      )}`
    )
  }
>
  Review & Award Points
</Button>

                            </div>
                          )}


                          {completed && (
                            <p className="mt-4 font-bold text-green-400">
                              ✓ Completed
                            </p>
                          )}


                          <div className="mt-4">
                            <p className="text-xs uppercase text-zinc-400">
                              Completed by
                            </p>

                            {completedBy.length ===
                            0 ? (
                              <p className="mt-1 text-sm text-zinc-500">
                                Nobody yet
                              </p>
                            ) : (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {completedBy.map(
                                  (player) => (
                                    <span
                                      key={
                                        player.id
                                      }
                                      className="rounded-full bg-green-900/60 px-3 py-1 text-sm"
                                    >
                                      ✓{" "}
                                      {
                                        player.name
                                      }
                                    </span>
                                  )
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                  )}

                </div>
              )}
            </Card>


          </>
        )}

        {/* =================================
            REVIEW TAB
        ================================= */}
        {activeTab === "review" && (
          <>
            {/* CHALLENGE REVIEW */}

            <Card>
              <h2 className="text-2xl font-bold">
                Challenge Review
              </h2>

              <p className="mt-2 text-sm text-zinc-400">
                Completion records and
                points linked to each
                challenge.
              </p>

              {completions.length ===
              0 ? (
                <p className="mt-4">
                  No completions yet.
                </p>
              ) : (
                <div className="mt-4 space-y-3">

                  {completions.map(
                    (completion) => {
                      const player =
                        players.find(
                          (item) =>
                            String(
                              item.id
                            ) ===
                            String(
                              completion.player_id
                            )
                        );

                      const challenge =
                        completion.challenge_type ===
                        "side"
                          ? sideChallenges.find(
                              (item) =>
                                String(
                                  item.id
                                ) ===
                                String(
                                  completion.challenge_id
                                )
                            )
                          : completion.challenge_type ===
                            "bonus"
                            ? pubSubChallenges.find(
                                (item) =>
                                  String(
                                    item.id
                                  ) ===
                                  String(
                                    completion.challenge_id
                                  )
                              )
                            : challenges.find(
                                (item) =>
                                  String(
                                    item.id
                                  ) ===
                                  String(
                                    completion.challenge_id
                                  )
                              );

                      return (
                        <div
                          key={
                            completion.id
                          }
                          className="rounded-xl border border-zinc-700 bg-black/50 p-4"
                        >
                          <strong>
                            {
                              player?.name ??
                              "Unknown player"
                            }
                          </strong>

                          <p className="mt-1">
                            {
                              challenge?.title ??
                              `Challenge ${completion.challenge_id}`
                            }
                          </p>

                          <p className="mt-1 text-sm text-zinc-400">
                            {
                              completion.challenge_type
                            }{" "}
                            •{" "}
                            +{
                              completion.points
                            }{" "}
                            points
                          </p>

                          {completion.photo_id !=
                            null && (
                            <p className="mt-2 text-sm text-pink-400">
                              📸 Media attached
                            </p>
                          )}
                        </div>
                      );
                    }
                  )}

                </div>
              )}
            </Card>
          </>
        )}

        {/* =================================
            SCREENS TAB
        ================================= */}

        {activeTab ===
          "screens" && (
          <>

            <Card>
              <h2 className="text-xl font-bold">
                Host Screens
              </h2>

              <div className="mt-4 grid grid-cols-1 gap-3">

                <Button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/leaderboard"
                    )
                  }
                >
                  Leaderboard
                </Button>


                {!game.slideshow_open ? (
                  <Button
                    type="button"
                    onClick={
                      startSlideshow
                    }
                  >
                    Start Slideshow
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      onClick={() =>
                        navigate(
                          "/slideshow?host=true"
                        )
                      }
                    >
                      Open Slideshow
                    </Button>

                    <Button
                      type="button"
                      onClick={
                        stopSlideshow
                      }
                    >
                      End Slideshow
                    </Button>
                  </>
                )}

              </div>
            </Card>


          </>
        )}

        {/* =================================
            VOTING TAB
        ================================= */}
        {activeTab === "voting" && (
          <>
            <Card>
              <h2 className="text-xl font-bold">
                Voting
              </h2>

              <p className="mt-2 text-sm text-zinc-400">
                Current challenge:{" "}
                {
                  game.current_challenge
                }
              </p>


              <select
                value={
                  currentGame.voting_target ??
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
                className="mt-4 w-full rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-white"
              >
                <option value="player">
                  Vote for Player
                </option>

                <option value="team">
                  Vote for Team
                </option>
              </select>


              <div className="mt-4 space-y-3">

                {!game.voting_open &&
                  !game.show_vote_results && (
                    <Button
                      type="button"
                      onClick={
                        openVoting
                      }
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
                      onClick={
                        closeVoting
                      }
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
                      onClick={
                        closeResults
                      }
                    >
                      Close Results & Return Everyone
                    </Button>
                  </>
                )}

              </div>
            </Card>


            <Card>
              <h2 className="text-xl font-bold">
                Live Voting Results
              </h2>

              <p className="mt-2">
                {
                  game.current_challenge
                }
              </p>


              {liveResults.length ===
              0 ? (
                <p className="mt-4 text-zinc-400">
                  No votes yet.
                </p>
              ) : (
                <div className="mt-4 space-y-3">

                  {liveResults.map(
                    (
                      result,
                      index
                    ) => (
                      <div
                        key={
                          result.id
                        }
                        className="flex items-center justify-between rounded-xl bg-black/50 p-3"
                      >
                        <strong>
                          {index === 0
                            ? "👑 "
                            : ""}

                          {
                            result.name
                          }
                        </strong>

                        <span className="text-xl font-bold">
                          {
                            result.votes
                          }
                        </span>
                      </div>
                    )
                  )}

                </div>
              )}
            </Card>
          </>
        )}

        {/* =================================
            PLAYERS TAB
        ================================= */}
        {activeTab === "players" && (
          <>
            <Card>
              <h2 className="text-2xl font-bold">
                Players
              </h2>

              <div className="mt-4 space-y-4">

                {players.map(
                  (player) => (
                    <div
                      key={
                        player.id
                      }
                      className="rounded-xl border border-zinc-700 bg-black/50 p-4"
                    >

                      <Input
                        value={
                          player.name
                        }
                        onChange={(
                          event
                        ) => {
                          void renamePlayer(
                            player.id,
                            event.target.value
                          );
                        }}
                      />

                      <p className="mt-2 text-sm">
                        Team:{" "}
                        {
                          player.team ??
                          "Unassigned"
                        }
                      </p>

                      <p className="mt-1 font-bold">
                        Score:{" "}
                        {
                          player.score ??
                          0
                        }
                      </p>


                      <div className="mt-3 grid grid-cols-3 gap-2">

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
                            removePoints(
                              player.id,
                              5
                            )
                          }
                        >
                          -5
                        </Button>

                      </div>


                      <div className="mt-3">
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
                  )
                )}

              </div>
            </Card>
          </>
        )}

        {/* =================================
            TEAMS TAB
        ================================= */}
        {activeTab === "teams" && (
          <>
            <Card>
              <h2 className="text-2xl font-bold">
                Create Teams
              </h2>

              <div className="mt-4 space-y-3">

                <Input
                  placeholder="Team name..."
                  value={
                    newTeamName
                  }
                  onChange={(
                    event
                  ) =>
                    setNewTeamName(
                      event.target.value
                    )
                  }
                />

                <Button
                  type="button"
                  disabled={
                    creatingTeam
                  }
                  onClick={
                    createTeam
                  }
                >
                  {creatingTeam
                    ? "Creating..."
                    : "Create Team"}
                </Button>

              </div>


              {teams.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {teams.map(
                    (team) => (
                      <span
                        key={
                          team.id
                        }
                        className="rounded-full bg-zinc-800 px-3 py-2 text-sm"
                      >
                        {
                          team.name
                        }
                      </span>
                    )
                  )}
                </div>
              )}
            </Card>

            <Card>
              <h2 className="text-2xl font-bold">
                Assign Teams
              </h2>

              <div className="mt-4 space-y-4">

                {players.map(
                  (player) => (
                    <div
                      key={
                        player.id
                      }
                      className="rounded-xl border border-zinc-700 bg-black/50 p-4"
                    >
                      <strong>
                        {
                          player.name
                        }
                      </strong>

                      <select
                        value={
                          player.team ??
                          ""
                        }
                        disabled={
                          assigningPlayerId ===
                          player.id
                        }
                        onChange={(
                          event
                        ) => {
                          void assignTeam(
                            player.id,
                            event.target.value
                          );
                        }}
                        className="mt-3 w-full rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-white"
                      >
                        <option value="">
                          Unassigned
                        </option>

                        {teams.map(
                          (team) => (
                            <option
                              key={
                                team.id
                              }
                              value={
                                team.name
                              }
                            >
                              {
                                team.name
                              }
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  )
                )}

              </div>
            </Card>
          </>
        )}

      </div>

    </main>
  );
}