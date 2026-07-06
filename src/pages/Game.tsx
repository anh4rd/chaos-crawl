import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

import {
  useGameState,
} from "../game/hooks/useGameState";

import useSideChallenges
  from "../game/hooks/useSideChallenges";

import usePubSubChallenges
  from "../game/hooks/usePubSubChallenges";

import useChallengeCompletions
  from "../game/hooks/useChallengeCompletions";

import {
  usePlayers,
} from "../game/hooks/usePlayers";

import {
  usePubs,
} from "../game/hooks/usePubs";

import {
  useChallenges,
} from "../game/hooks/useChallenges";

import {
  clearPlayerId,
  getPlayerId,
} from "../lib/playerSession";

import {
  uploadPhoto,
} from "../lib/photoApi";

import {
  completeChallenge,
  type ChallengeType,
} from "../lib/completionApi";


export default function Game() {
  // -------------------------
  // ALL HOOKS MUST BE HERE
  // BEFORE ANY RETURN
  // -------------------------

  const game = useGameState();

  const sideChallenges =
    useSideChallenges();

  const pubSubChallenges =
    usePubSubChallenges();

  const completions =
    useChallengeCompletions();

  const players =
    usePlayers();

  const pubs =
    usePubs();

  const challenges =
    useChallenges();

  const navigate =
    useNavigate();

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const [
    uploading,
    setUploading,
  ] = useState(false);

  const [
    uploadChallenge,
    setUploadChallenge,
  ] = useState<{
    id: string | number;
    title: string;
    points: number;
    type: ChallengeType;
  } | null>(null);


  // -------------------------
  // LIVE PAGE REDIRECTS
  // -------------------------

  useEffect(() => {
    if (
      game?.slideshow_open === true
    ) {
      navigate(
        "/slideshow",
        {
          replace: true,
        }
      );
    }
  }, [
    game?.slideshow_open,
    navigate,
  ]);


  useEffect(() => {
    if (
      game?.voting_open === true
    ) {
      navigate(
        "/vote",
        {
          replace: true,
        }
      );
    }
  }, [
    game?.voting_open,
    navigate,
  ]);


  useEffect(() => {
    if (
      game?.show_vote_results === true
    ) {
      navigate(
        "/vote-results",
        {
          replace: true,
        }
      );
    }
  }, [
    game?.show_vote_results,
    navigate,
  ]);


  // -------------------------
  // LOADING
  // -------------------------

  if (!game) {
    return (
      <p>
        Waiting for bday kween...
      </p>
    );
  }


  // -------------------------
  // CURRENT PLAYER
  // -------------------------

  const playerId =
    getPlayerId();

  const currentPlayer =
    players.find(
      (player) =>
        String(player.id) ===
        String(playerId)
    );


  // -------------------------
  // CURRENT GAME DATA
  // -------------------------

  const currentPub =
    game.current_pub;

  const currentChallenge =
    game.current_challenge;

  const currentPubObject =
    pubs.find(
      (pub) =>
        pub.name ===
        currentPub
    );

  const currentChallengeObject =
    challenges.find(
      (challenge) =>
        challenge.title ===
        currentChallenge
    );

  const allowPhotoUpload =
    currentChallengeObject
      ?.allow_photo_upload === true;


  // -------------------------
  // CURRENT PUB BONUS MISSIONS
  // -------------------------

  const currentPubSubChallenges =
    pubSubChallenges.filter(
      (challenge) =>
        String(
          challenge.pub_id
        ) ===
        String(
          currentPubObject?.id
        )
    );


  // -------------------------
  // COMPLETION CHECK
  // -------------------------

  function hasCompleted(
    challengeType: ChallengeType,
    challengeId:
      string | number
  ) {
    if (!playerId) {
      return false;
    }

    return completions.some(
      (completion) =>
        String(
          completion.player_id
        ) ===
          String(playerId) &&

        completion.chellenge_type ===
          challengeType &&

        String(
          completion.challenge_id
        ) ===
          String(challengeId)
    );
  }


  // -------------------------
  // TICK NON-PHOTO CHALLENGE
  // -------------------------

  async function tickChallengeDone(
    challengeType: ChallengeType,
    challengeId:
      string | number,
    points: number
  ) {
    if (
      !playerId ||
      !currentPlayer
    ) {
      alert(
        "Player session not found. Please rejoin."
      );

      return;
    }

    if (
      hasCompleted(
        challengeType,
        challengeId
      )
    ) {
      return;
    }

    const { error } =
      await completeChallenge({
        playerId,
        challengeType,
        challengeId,
        points,
        photoId: null,
      });

    if (error) {
      if (
        error.code ===
        "ALREADY_COMPLETED"
      ) {
        alert(
          "You already completed this challenge."
        );

        return;
      }

      console.error(
        "COMPLETE CHALLENGE ERROR:",
        error
      );

      alert(
        `Could not complete challenge: ${error.message}`
      );

      return;
    }
  }


  // -------------------------
  // CHOOSE PHOTO UPLOAD
  // -------------------------

  function chooseUpload(details: {
    id: string | number;
    title: string;
    points: number;
    type: ChallengeType;
  }) {
    setUploadChallenge(
      details
    );

    window.setTimeout(() => {
      fileInputRef
        .current
        ?.click();
    }, 0);
  }


  // -------------------------
  // HANDLE PHOTO
  // -------------------------

  async function handlePhotoSelected(
    event:
      React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (
      !file ||
      !uploadChallenge
    ) {
      return;
    }

    if (
      !playerId ||
      !currentPlayer
    ) {
      alert(
        "Player session not found. Please rejoin."
      );

      return;
    }

    setUploading(true);

    const {
      data,
      error,
    } = await uploadPhoto(
      file,
      {
        playerId,

        playerName:
          currentPlayer.name,

        team:
          currentPlayer.team ??
          null,

        challenge:
          uploadChallenge.title,

        pub:
          currentPub,

        points:
          uploadChallenge.points,
      }
    );


    if (error) {
      setUploading(false);

      event.target.value =
        "";

      setUploadChallenge(
        null
      );

      console.error(
        "PHOTO UPLOAD ERROR:",
        error
      );

      alert(
        `Upload failed: ${error.message}`
      );

      return;
    }


    const {
      error:
        completionError,
    } = await completeChallenge({
      playerId,

      challengeType:
        uploadChallenge.type,

      challengeId:
        uploadChallenge.id,

      points:
        uploadChallenge.points,

      photoId:
        data?.id != null
          ? String(data.id)
          : null,
    });

    setUploading(false);

    event.target.value =
      "";

    setUploadChallenge(
      null
    );


    if (completionError) {
      console.error(
        "COMPLETION ERROR:",
        completionError
      );

      if (
        completionError.code ===
        "ALREADY_COMPLETED"
      ) {
        alert(
          "You already completed this challenge."
        );

        return;
      }

      alert(
        `Photo uploaded, but completion failed: ${completionError.message}`
      );

      return;
    }


    alert(
      "Photo uploaded and challenge completed!"
    );
  }


  // -------------------------
  // JSX
  // -------------------------

  return (
    <main className="mx-auto min-h-screen max-w-md space-y-6 p-6">

      <header>
        <img
          src={`${import.meta.env.BASE_URL}Title.png`}
          alt="Anna's Chaos Crawl"
          className="mx-auto mb-4 w-full"
        />
      </header>


      {/* HIDDEN PHOTO INPUT */}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={
          handlePhotoSelected
        }
      />


      {/* PLAYER TEAM */}

      {currentPlayer?.team ? (
        <Card>
          <p className="text-sm">
            Your team
          </p>

          <h2 className="text-2xl font-bold">
            {currentPlayer.team}
          </h2>
        </Card>
      ) : (
        <Card>
          <p>
            Waiting for the host
            to assign your team...
          </p>
        </Card>
      )}


      {/* CURRENT PUB */}

      <Card>
        <p className="text-sm">
          📍 Current Pub
        </p>

        <h2 className="text-3xl font-bold">
          {currentPub}
        </h2>
      </Card>


      {/* MAIN MISSION */}

      <Card>
        <p className="text-sm">
          ⭐ Main Mission
        </p>

        <h2 className="mt-2 text-2xl font-bold">
          {currentChallenge}
        </h2>

        <p className="mt-3">
          {
            game.challenge_description
          }
        </p>


        {allowPhotoUpload &&
          currentChallengeObject && (
            <div className="mt-4">

              <Button
                type="button"

                disabled={
                  uploading ||
                  hasCompleted(
                    "main",
                    currentChallengeObject.id
                  )
                }

                onClick={() =>
                  chooseUpload({
                    id:
                      currentChallengeObject.id,

                    title:
                      currentChallengeObject.title,

                    points:
                      currentChallengeObject.points ??
                      0,

                    type:
                      "main",
                  })
                }
              >
                {hasCompleted(
                  "main",
                  currentChallengeObject.id
                )
                  ? "✓ Completed"
                  : uploading
                    ? "Uploading..."
                    : "Upload Photo"}
              </Button>

            </div>
          )}

      </Card>


      {/* PUB BONUS MISSIONS */}

      {currentPubSubChallenges.length >
        0 && (
        <Card>

          <h2 className="mb-4 text-2xl font-bold">
            PUB BONUS MISSIONS
          </h2>


          <div className="space-y-4">

            {currentPubSubChallenges.map(
              (challenge) => {
                const completed =
                  hasCompleted(
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
                          ? "border-green-400 bg-green-950/50"
                          : "border-pink-500 bg-black/70"
                      }
                    `}
                  >

                    <h3 className="text-xl font-bold">
                      {
                        challenge.title
                      }
                    </h3>


                    {challenge.description && (
                      <p className="mt-2">
                        {
                          challenge.description
                        }
                      </p>
                    )}


                    <p className="mt-2 font-bold">
                      +{
                        challenge.points
                      }
                    </p>


                    <div className="mt-4">

                      <Button
                        type="button"

                        disabled={
                          uploading ||
                          completed
                        }

                        onClick={() =>
                          chooseUpload({
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
                        {completed
                          ? "✓ Completed"
                          : uploading
                            ? "Uploading..."
                            : "Upload Photo"}
                      </Button>

                    </div>

                  </div>
                );
              }
            )}

          </div>

        </Card>
      )}


      {/* CHAOS BINGO */}

<Card>
  <h2 className="mb-4 text-2xl font-bold">
    CHAOS BINGO
  </h2>

  <div className="grid grid-cols-2 gap-3">
    {sideChallenges.map(
      (challenge) => {
        const completed =
          hasCompleted(
            "side",
            challenge.id
          );

        return (
          <div
            key={challenge.id}
            className={`
              rounded-2xl border-2 p-3
              ${
                completed
                  ? "border-green-400 bg-green-950/50"
                  : "border-pink-500 bg-black/70"
              }
            `}
          >
            <h3 className="font-bold">
              {challenge.title}
            </h3>

            <p className="mt-2 text-sm">
              {challenge.description}
            </p>

            <p className="mt-2 font-bold">
              +{challenge.points}
            </p>

            <div className="mt-3">
              <Button
                type="button"
                disabled={completed}
                onClick={() =>
                  tickChallengeDone(
                    "side",
                    challenge.id,
                    challenge.points
                  )
                }
              >
                {completed
                  ? "✓ Done"
                  : "Mark Done"}
              </Button>
            </div>
          </div>
        );
      }
    )}
  </div>
</Card>


      {/* LEADERBOARD */}

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


      {/* LEAVE GAME */}

      <Button
        type="button"
        onClick={() => {
          clearPlayerId();

          navigate(
            "/",
            {
              replace: true,
            }
          );
        }}
      >
        Leave Game
      </Button>

    </main>
  );
}