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


interface PendingUpload {
  id: string | number;
  title: string;
  points: number;
  type: ChallengeType;
}


export default function Game() {
  // =========================================
  // HOOKS
  // ALL HOOKS MUST STAY ABOVE EARLY RETURNS
  // =========================================

  const game =
    useGameState();

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


  // =========================================
  // LOCAL STATE
  // =========================================

  const [
    pendingUpload,
    setPendingUpload,
  ] = useState<PendingUpload | null>(
    null
  );

  const [
    uploadingKey,
    setUploadingKey,
  ] = useState<string | null>(
    null
  );

  const [
    completingKey,
    setCompletingKey,
  ] = useState<string | null>(
    null
  );

  const [
    pendingCompletedKeys,
    setPendingCompletedKeys,
  ] = useState<Set<string>>(
    () => new Set()
  );


  // =========================================
  // LIVE SCREEN REDIRECTS
  // =========================================

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


  // =========================================
  // REMOVE OPTIMISTIC COMPLETION KEYS
  // ONCE REALTIME DATABASE DATA CATCHES UP
  // =========================================

  useEffect(() => {
    if (
      pendingCompletedKeys.size === 0
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
            keyPlayerId,
            keyType,
            keyChallengeId,
          ] = key.split(":");

          const nowInDatabase =
            completions.some(
              (completion) =>
                String(
                  completion.player_id
                ) ===
                  String(keyPlayerId) &&

                completion.challenge_type ===
                  keyType &&

                String(
                  completion.challenge_id
                ) ===
                  String(keyChallengeId)
            );

          if (nowInDatabase) {
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
  // SAFE EARLY RETURN
  // ALL HOOKS HAVE ALREADY RUN
  // =========================================

  if (!game) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <p>
          Waiting for bday kween...
        </p>
      </main>
    );
  }


  // =========================================
  // CURRENT PLAYER
  // =========================================

  const playerId =
    getPlayerId();

  const currentPlayer =
    players.find(
      (player) =>
        String(player.id) ===
        String(playerId)
    );


  // =========================================
  // CURRENT GAME DATA
  // =========================================

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


  // =========================================
  // CURRENT PUB BONUS MISSIONS
  // =========================================

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


  // =========================================
  // COMPLETION HELPERS
  // =========================================

  function completionKey(
    challengeType: ChallengeType,
    challengeId: string | number
  ) {
    return [
      String(playerId ?? ""),
      challengeType,
      String(challengeId),
    ].join(":");
  }


  function hasDatabaseCompletion(
    challengeType: ChallengeType,
    challengeId: string | number
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

        completion.challenge_type ===
          challengeType &&

        String(
          completion.challenge_id
        ) ===
          String(challengeId)
    );
  }


  function hasCompleted(
    challengeType: ChallengeType,
    challengeId: string | number
  ) {
    const key =
      completionKey(
        challengeType,
        challengeId
      );

    return (
      pendingCompletedKeys.has(key) ||
      hasDatabaseCompletion(
        challengeType,
        challengeId
      )
    );
  }


  function markPendingComplete(
    challengeType: ChallengeType,
    challengeId: string | number
  ) {
    const key =
      completionKey(
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
    challengeType: ChallengeType,
    challengeId: string | number
  ) {
    const key =
      completionKey(
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
  // MARK CHALLENGE DONE
  // WITHOUT MEDIA
  // =========================================

  async function tickChallengeDone(
    challengeType: ChallengeType,
    challengeId: string | number,
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

    const key =
      completionKey(
        challengeType,
        challengeId
      );

    setCompletingKey(key);

    markPendingComplete(
      challengeType,
      challengeId
    );

    const {
      error,
    } = await completeChallenge({
      playerId,
      challengeType,
      challengeId,
      points,
      photoId: null,
    });

    setCompletingKey(null);

    if (error) {
      if (
        error.code ===
        "ALREADY_COMPLETED"
      ) {
        return;
      }

      removePendingComplete(
        challengeType,
        challengeId
      );

      console.error(
        "COMPLETE CHALLENGE ERROR:",
        error
      );

      alert(
        `Could not complete challenge: ${error.message}`
      );
    }
  }


  // =========================================
  // OPEN FILE PICKER
  // =========================================

  function chooseUpload(
    details: PendingUpload
  ) {
    if (
      uploadingKey !== null
    ) {
      return;
    }

    setPendingUpload(details);

    window.setTimeout(() => {
      fileInputRef
        .current
        ?.click();
    }, 0);
  }


  // =========================================
  // HANDLE PHOTO / VIDEO
  // =========================================

  async function handleMediaSelected(
    event:
      React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    const uploadDetails =
      pendingUpload;

    if (
      !file ||
      !uploadDetails
    ) {
      event.target.value = "";
      return;
    }

    if (
      !playerId ||
      !currentPlayer
    ) {
      event.target.value = "";

      setPendingUpload(null);

      alert(
        "Player session not found. Please rejoin."
      );

      return;
    }

    const key =
      completionKey(
        uploadDetails.type,
        uploadDetails.id
      );

    setUploadingKey(key);

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
          uploadDetails.title,

        pub:
          currentPub,

        points:
          uploadDetails.points,
      }
    );


    if (error) {
      setUploadingKey(null);

      setPendingUpload(null);

      event.target.value = "";

      console.error(
        "MEDIA UPLOAD ERROR:",
        error
      );

      alert(
        `Upload failed: ${error.message}`
      );

      return;
    }


    markPendingComplete(
      uploadDetails.type,
      uploadDetails.id
    );


    const {
      error: completionError,
    } = await completeChallenge({
      playerId,

      challengeType:
        uploadDetails.type,

      challengeId:
        uploadDetails.id,

      points:
        uploadDetails.points,

      photoId:
        data?.id ?? null,
    });


    setUploadingKey(null);

    setPendingUpload(null);

    event.target.value = "";


    if (completionError) {
      if (
        completionError.code ===
        "ALREADY_COMPLETED"
      ) {
        return;
      }

      removePendingComplete(
        uploadDetails.type,
        uploadDetails.id
      );

      console.error(
        "COMPLETION ERROR:",
        completionError
      );

      alert(
        `Media uploaded, but challenge completion failed: ${completionError.message}`
      );

      return;
    }
  }


  // =========================================
  // AVAILABLE CHALLENGES
  // =========================================

  const availableSideChallenges =
    sideChallenges.filter(
      (challenge) =>
        !hasCompleted(
          "side",
          challenge.id
        )
    );


  const availableBonusChallenges =
    currentPubSubChallenges.filter(
      (challenge) =>
        !hasCompleted(
          "bonus",
          challenge.id
        )
    );


  // =========================================
  // MAIN CHALLENGE STATE
  // =========================================

  const mainCompleted =
    currentChallengeObject
      ? hasCompleted(
          "main",
          currentChallengeObject.id
        )
      : false;


  const mainActionKey =
    currentChallengeObject
      ? completionKey(
          "main",
          currentChallengeObject.id
        )
      : null;


  // =========================================
  // PAGE
  // =========================================

  return (
    <main className="mx-auto min-h-screen max-w-md space-y-6 p-6">

      {/* TITLE */}

      <header>
        <img
          src={`${import.meta.env.BASE_URL}Title.png`}
          alt="Anna's Chaos Crawl"
          className="mx-auto mb-4 w-full"
        />
      </header>


      {/* HIDDEN FILE INPUT */}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={
          handleMediaSelected
        }
      />


      {/* TEAM */}

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
            Waiting for the host to
            assign your team...
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


        {mainCompleted && (
          <p className="mt-4 font-bold text-green-400">
            ✓ Completed
          </p>
        )}


        {!mainCompleted &&
          allowPhotoUpload &&
          currentChallengeObject && (
            <div className="mt-4">
              <Button
                type="button"
                disabled={
                  uploadingKey !== null ||
                  completingKey !== null
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
                {uploadingKey ===
                mainActionKey
                  ? "Uploading..."
                  : "📸 Upload Photo / Video"}
              </Button>
            </div>
          )}


        {!mainCompleted &&
          !allowPhotoUpload &&
          currentChallengeObject && (
            <div className="mt-4">
              <Button
                type="button"
                disabled={
                  uploadingKey !== null ||
                  completingKey !== null
                }
                onClick={() =>
                  tickChallengeDone(
                    "main",
                    currentChallengeObject.id,
                    currentChallengeObject.points ??
                      0
                  )
                }
              >
                {completingKey ===
                mainActionKey
                  ? "Saving..."
                  : "✓ Mark Done"}
              </Button>
            </div>
          )}

      </Card>


      {/* PUB BONUS MISSIONS */}

      <Card>
        <h2 className="text-2xl font-bold">
          Pub Bonus Missions
        </h2>

        <p className="mt-2 text-sm text-zinc-400">
          Missions for{" "}
          <strong>
            {currentPub}
          </strong>
        </p>


        {!currentPubObject ? (
          <p className="mt-4 text-yellow-400">
            Current pub could not be
            matched to the pubs table.
          </p>
        ) : availableBonusChallenges.length ===
          0 ? (
          <p className="mt-4 text-green-400">
            ✓ No unfinished bonus
            missions here.
          </p>
        ) : (
          <div className="mt-4 space-y-4">

            {availableBonusChallenges.map(
              (challenge) => {
                const key =
                  completionKey(
                    "bonus",
                    challenge.id
                  );

                return (
                  <div
                    key={
                      challenge.id
                    }
                    className="rounded-2xl border-2 border-yellow-400 bg-black/70 p-4"
                  >

                    <div className="flex items-start justify-between gap-4">

                      <div>
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
                      </div>

                      <strong>
                        +{
                          challenge.points
                        }
                      </strong>

                    </div>


                    <div className="mt-4 flex flex-wrap gap-2">

                      <Button
                        type="button"
                        disabled={
                          uploadingKey !==
                            null ||
                          completingKey !==
                            null
                        }
                        onClick={() =>
                          tickChallengeDone(
                            "bonus",
                            challenge.id,
                            challenge.points
                          )
                        }
                      >
                        {completingKey ===
                        key
                          ? "Saving..."
                          : "✓ Mark Done"}
                      </Button>


                      <Button
                        type="button"
                        disabled={
                          uploadingKey !==
                            null ||
                          completingKey !==
                            null
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
                        {uploadingKey ===
                        key
                          ? "Uploading..."
                          : "📸 Upload Photo / Video"}
                      </Button>

                    </div>

                  </div>
                );
              }
            )}

          </div>
        )}

      </Card>


      {/* CHAOS BINGO */}

      <Card>
        <h2 className="text-2xl font-bold">
          Chaos Bingo
        </h2>

        <p className="mt-2 text-sm text-zinc-400">
          Complete these throughout
          the crawl.
        </p>


        {availableSideChallenges.length ===
        0 ? (
          <p className="mt-4 text-green-400">
            ✓ You completed all Chaos
            Bingo challenges.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4">

            {availableSideChallenges.map(
              (challenge) => {
                const key =
                  completionKey(
                    "side",
                    challenge.id
                  );

                return (
                  <div
                    key={
                      challenge.id
                    }
                    className="rounded-2xl border-2 border-pink-500 bg-black/70 p-4"
                  >

                    <div className="flex items-start justify-between gap-4">

                      <div>
                        <h3 className="font-bold">
                          {
                            challenge.title
                          }
                        </h3>

                        {challenge.description && (
                          <p className="mt-2 text-sm text-zinc-300">
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


                    <div className="mt-4 flex flex-wrap gap-2">

                      <Button
                        type="button"
                        disabled={
                          uploadingKey !==
                            null ||
                          completingKey !==
                            null
                        }
                        onClick={() =>
                          tickChallengeDone(
                            "side",
                            challenge.id,
                            challenge.points
                          )
                        }
                      >
                        {completingKey ===
                        key
                          ? "Saving..."
                          : "✓ Mark Done"}
                      </Button>


                      <Button
                        type="button"
                        disabled={
                          uploadingKey !==
                            null ||
                          completingKey !==
                            null
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
                              "side",
                          })
                        }
                      >
                        {uploadingKey ===
                        key
                          ? "Uploading..."
                          : "📸 Upload Photo / Video"}
                      </Button>

                    </div>

                  </div>
                );
              }
            )}

          </div>
        )}

      </Card>


      {/* NAVIGATION */}

      <div className="space-y-3">

        <Button
          type="button"
          onClick={() => {
            navigate("/leaderboard");
          }}
        >
          Leaderboard
        </Button>


        <Button
          type="button"
          onClick={() => {
            clearPlayerId();

            navigate("/");
          }}
        >
          Leave Game
        </Button>

      </div>

    </main>
  );
}