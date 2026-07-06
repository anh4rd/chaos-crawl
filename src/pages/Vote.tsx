import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

import {
  useGameState,
} from "../game/hooks/useGameState";

import {
  usePlayers,
} from "../game/hooks/usePlayers";

import {
  getPlayerId,
  clearPlayerId,
} from "../lib/playerSession";

import {
  getMyVote,
  submitVote,
} from "../lib/voteApi";

import {
  supabase,
} from "../lib/supabase";


export default function Vote() {
  const game = useGameState();
  const players = usePlayers();
  const navigate = useNavigate();

  const [searchParams] =
    useSearchParams();

  const cameFromAdmin =
    searchParams.get("from") === "admin";

  const [
    selectedPlayerId,
    setSelectedPlayerId,
  ] = useState<string | null>(null);

  const [
    selectedTeamId,
    setSelectedTeamId,
  ] = useState<string | null>(null);

  const [
    hasVoted,
    setHasVoted,
  ] = useState(false);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    sessionInvalid,
    setSessionInvalid,
  ] = useState(false);

  const playerId = getPlayerId();


  // -------------------------
  // DERIVE UNIQUE TEAMS
  // -------------------------

  const teams = Array.from(
    new Set(
      players
        .map(
          (player) =>
            player.team
        )
        .filter(
          (
            team
          ): team is string =>
            typeof team ===
              "string" &&
            team.trim() !== ""
        )
    )
  );


  // -------------------------
  // LEAVE VOTE WHEN HOST
  // CLOSES VOTING
  // -------------------------

  useEffect(() => {
    if (!game) {
      return;
    }

    // If results are being shown,
    // players should go to results.
    if (
      game.show_vote_results === true
    ) {
      navigate(
        "/vote-results",
        {
          replace: true,
        }
      );

      return;
    }

    // If voting simply closes,
    // return to the correct screen.
    if (
      game.voting_open === false
    ) {
      navigate(
        cameFromAdmin
          ? "/admin"
          : "/game",
        {
          replace: true,
        }
      );
    }
  }, [
    game?.voting_open,
    game?.show_vote_results,
    cameFromAdmin,
    navigate,
  ]);


  // -------------------------
  // CHECK EXISTING VOTE
  // -------------------------

  useEffect(() => {
    async function checkExistingVote() {
      if (
        !game?.current_challenge ||
        !playerId
      ) {
        return;
      }

      const { data, error } =
        await getMyVote(
          playerId,
          game.current_challenge
        );

      if (error) {
        console.error(
          "CHECK VOTE ERROR:",
          error
        );

        return;
      }

      if (data) {
        setHasVoted(true);
      }
    }

    checkExistingVote();
  }, [
    game?.current_challenge,
    playerId,
  ]);


  // -------------------------
  // HANDLE VOTE
  // -------------------------

  async function handleVote() {
    if (!game) {
      return;
    }

    if (!playerId) {
      alert(
        "No player session found. Join the game as a player first."
      );

      return;
    }

    const votingForTeams =
      game.voting_target === "team";


    // Validate selection

    if (
      votingForTeams &&
      !selectedTeamId
    ) {
      alert(
        "Choose a team first."
      );

      return;
    }

    if (
      !votingForTeams &&
      !selectedPlayerId
    ) {
      alert(
        "Choose someone first."
      );

      return;
    }


    setSubmitting(true);


    // -------------------------
    // VERIFY SAVED PLAYER ID
    // STILL EXISTS
    // -------------------------

    const {
      data: currentPlayer,
      error: playerCheckError,
    } = await supabase
      .from("players")
      .select("id, name")
      .eq("id", playerId)
      .maybeSingle();


    if (playerCheckError) {
      setSubmitting(false);

      console.error(
        "PLAYER CHECK ERROR:",
        playerCheckError
      );

      alert(
        `Could not verify your player session: ${playerCheckError.message}`
      );

      return;
    }


    if (!currentPlayer) {
      setSubmitting(false);

      setSessionInvalid(true);

      // Remove stale localStorage ID
      clearPlayerId();

      alert(
        "Your saved player session no longer exists. Please join the game again."
      );

      return;
    }


    // -------------------------
    // SUBMIT PLAYER OR TEAM VOTE
    // -------------------------

    const { error } =
      await submitVote(
        playerId,
        game.current_challenge,

        votingForTeams
          ? {
              teamId:
                selectedTeamId!,
            }
          : {
              playerId:
                selectedPlayerId!,
            }
      );


    setSubmitting(false);


    if (error) {
      console.error(
        "VOTE ERROR:",
        error
      );


      // Already voted
      if (
        error.code === "23505"
      ) {
        setHasVoted(true);

        alert(
          "You already voted for this challenge."
        );

        return;
      }


      // Foreign key failure
      if (
        error.code === "23503"
      ) {
        setSessionInvalid(true);

        clearPlayerId();

        alert(
          "Your player session is no longer valid. Please join the game again."
        );

        return;
      }


      alert(
        `Vote failed: ${error.message}`
      );

      return;
    }


    setHasVoted(true);
  }


  // -------------------------
  // LOADING
  // -------------------------

  if (!game) {
    return (
      <main className="mx-auto min-h-screen max-w-md p-6">
        <p>
          Loading voting...
        </p>
      </main>
    );
  }


  // -------------------------
  // INVALID SESSION SCREEN
  // -------------------------

  if (sessionInvalid) {
    return (
      <main className="mx-auto min-h-screen max-w-md space-y-6 p-6">

        <Card>
          <div className="text-center">

            <h1 className="text-4xl font-bold">
              Rejoin Needed
            </h1>

            <p className="mt-4">
              Your saved player session
              no longer matches a player
              in the game.
            </p>

            <div className="mt-6">
              <Button
                type="button"
                onClick={() => {
                  clearPlayerId();
                  navigate(
                    "/",
                    {
                      replace: true,
                    }
                  )
                }}
              >
                Rejoin Game
              </Button>
            </div>

            {cameFromAdmin && (
              <div className="mt-4">
                <Button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/admin"
                    )
                  }
                >
                  Back to Host Control
                </Button>
              </div>
            )}

          </div>
        </Card>

      </main>
    );
  }


  // -------------------------
  // VOTE CAST SCREEN
  // -------------------------

  if (hasVoted) {
    return (
      <main className="mx-auto min-h-screen max-w-md space-y-6 p-6">

        <Card>
          <div className="text-center">

            <h1 className="text-4xl font-bold">
              Vote Cast!
            </h1>

            <p className="mt-4">
              Your vote for{" "}
              {game.current_challenge}{" "}
              is locked in.
            </p>


            {cameFromAdmin ? (
              <>
                <p className="mt-4 text-sm text-zinc-400">
                  Your host vote has
                  been recorded.
                </p>

                <div className="mt-6">
                  <Button
                    type="button"
                    onClick={() =>
                      navigate(
                        "/admin"
                      )
                    }
                  >
                    Back to Host Control
                  </Button>
                </div>
              </>
            ) : (
              <p className="mt-4 text-sm text-zinc-400">
                Waiting for the host
                to close voting...
              </p>
            )}

          </div>
        </Card>

      </main>
    );
  }


  // -------------------------
  // VOTING MODE
  // -------------------------

  const votingForTeams =
    game.voting_target === "team";


  return (
    <main className="mx-auto min-h-screen max-w-md space-y-6 p-6">

      <header className="text-center">

        <h1 className="text-4xl font-bold">
          Vote!
        </h1>

        <p className="mt-2">
          {game.current_challenge}
        </p>

        <p className="mt-2 text-sm">
          {votingForTeams
            ? "Choose the winning team."
            : "Choose the winning player."}
        </p>

      </header>


      <div className="space-y-3">

        {votingForTeams
          ? teams.map((team) => {
              const selected =
                selectedTeamId ===
                team;

              return (
                <button
                  key={team}
                  type="button"
                  onClick={() => {
                    setSelectedTeamId(
                      team
                    );

                    setSelectedPlayerId(
                      null
                    );
                  }}
                  className={`
                    w-full rounded-2xl border-4 p-4 text-left
                    ${
                      selected
                        ? "border-yellow-400 bg-pink-500"
                        : "border-pink-500 bg-black/80"
                    }
                  `}
                >
                  <div className="text-xl font-bold">
                    {team}
                  </div>
                </button>
              );
            })

          : players.map((player) => {
              const selected =
                selectedPlayerId ===
                player.id;

              return (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => {
                    setSelectedPlayerId(
                      player.id
                    );

                    setSelectedTeamId(
                      null
                    );
                  }}
                  className={`
                    w-full rounded-2xl border-4 p-4 text-left
                    ${
                      selected
                        ? "border-yellow-400 bg-pink-500"
                        : "border-pink-500 bg-black/80"
                    }
                  `}
                >
                  <div className="text-xl font-bold">
                    {player.name}
                  </div>

                  <div className="text-sm">
                    {player.team ??
                      "Unassigned"}
                  </div>
                </button>
              );
            })}

      </div>


      <Button
        type="button"
        onClick={handleVote}
        disabled={submitting}
      >
        {submitting
          ? "Submitting..."
          : "Cast Vote"}
      </Button>


      {cameFromAdmin && (
        <Button
          type="button"
          onClick={() =>
            navigate("/admin")
          }
        >
          Back to Host Control
        </Button>
      )}

    </main>
  );
}