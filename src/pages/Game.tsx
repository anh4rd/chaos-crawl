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


import useChallengeCompletions
  from "../game/hooks/useChallengeCompletions";





import {
  usePlayers,
} from "../game/hooks/usePlayers";

import {
  useChallenges,
} from "../game/hooks/useChallenges";

import {

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

  const challenges =
    useChallenges();

  const sideChallenges =
    useSideChallenges();

  const completions =
    useChallengeCompletions();

  const players =
    usePlayers();

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

  const teamScore =
    currentPlayer?.team
      ? players
          .filter(
            (player) =>
              player.team ===
              currentPlayer.team
          )
          .reduce(
            (total, player) =>
              total +
              Number(
                player.score ??
                player.points ??
                0
              ),
            0
          )
      : null;

  const scheduledRevealMs =
    game.scheduled_reveal_at
      ? new Date(
          game.scheduled_reveal_at
        ).getTime()
      : null;

  const countdownMs =
    scheduledRevealMs
      ? Math.max(
          0,
          scheduledRevealMs - Date.now()
        )
      : null;

  const countdownText =
    countdownMs == null
      ? null
      : [
          Math.floor(
            countdownMs / 60000
          ),
          Math.floor(
            (countdownMs % 60000) /
              1000
          )
            .toString()
            .padStart(2, "0"),
        ].join(":");


  // =========================================
  // CURRENT GAME DATA
  // =========================================

  const currentPub =
    game.current_pub;

  const currentChallengeObject =
  challenges.find(
    (challenge) =>
      String(challenge.id) ===
      String(
        game.current_challenge_id
      )
  ) ??
  challenges.find(
    (challenge) =>
      challenge.title ===
      game.current_challenge
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


  // =========================================
  // LIVE CHALLENGE STATE
  // =========================================

  const liveChallengeCompleted =
    currentChallengeObject
      ? hasCompleted(
          "main",
          currentChallengeObject.id
        )
      : false;

  const liveChallengeKey =
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


      {/* GLANCEABLE NOW STATUS */}

      <Card>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-pink-400">
          Now
        </p>

        <h2 className="mt-2 text-4xl font-black leading-none">
          {currentPub}
        </h2>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-zinc-900 p-3">
            <p className="text-xs uppercase text-zinc-400">
              Your team
            </p>

            <p className="mt-1 font-bold">
              {currentPlayer?.team ??
                "Waiting..."}
            </p>
          </div>

          <div className="rounded-2xl bg-zinc-900 p-3">
            <p className="text-xs uppercase text-zinc-400">
              Team score
            </p>

            <p className="mt-1 text-2xl font-black text-yellow-400">
              {teamScore ?? "—"}
            </p>
          </div>
        </div>

        {countdownText && (
          <div className="mt-3 rounded-2xl border border-pink-500/60 bg-pink-950/30 p-3">
            <p className="text-xs font-bold uppercase text-pink-300">
              Next challenge in
            </p>


          </div>
        )}
      </Card>


      {/* LIVE ROUND CHALLENGE */}

      <Card>
        <p className="text-sm font-bold uppercase text-pink-400">
          Your Task
        </p>

        <h2 className="mt-2 text-3xl font-bold">
          {currentChallengeObject?.title ??
            game.current_challenge}
        </h2>

        {(currentChallengeObject?.description ??
          game.challenge_description) && (
          <p className="mt-3">
            {currentChallengeObject?.description ??
              game.challenge_description}
          </p>
        )}

        {currentChallengeObject && (
          <p className="mt-3 text-xl font-bold text-yellow-400">
            +{currentChallengeObject.points ?? 0} points
          </p>
        )}

        {!currentChallengeObject ? (
          <p className="mt-4 text-sm text-zinc-400">
            Waiting for the host to reveal the next challenge...
          </p>
        ) : liveChallengeCompleted ? (
          <p className="mt-4 font-bold text-green-400">
            ✓ Challenge completed
          </p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
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
                  currentChallengeObject.points ?? 0
                )
              }
            >
              {completingKey === liveChallengeKey
                ? "Saving..."
                : "✓ Mark Done"}
            </Button>

            {currentChallengeObject.allow_photo_upload === true && (
              <Button
                type="button"
                disabled={
                  uploadingKey !== null ||
                  completingKey !== null
                }
                onClick={() =>
                  chooseUpload({
                    id: currentChallengeObject.id,
                    title: currentChallengeObject.title,
                    points: currentChallengeObject.points ?? 0,
                    type: "main",
                  })
                }
              >
                {uploadingKey === liveChallengeKey
                  ? "Uploading..."
                  : "📸 Upload Photo / Video"}
              </Button>
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


    

      </div>

    </main>
  );
}