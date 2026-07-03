import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

import { useGameState } from "../hooks/useGameState";
import useSideChallenges from "../hooks/useSideChallenges";
import usePubSubChallenges from "../hooks/usePubSubChallenges";

import { usePlayers } from "../game/hooks/usePlayers";
import { usePubs } from "../game/hooks/usePubs";
import { useChallenges } from "../game/hooks/useChallenges";

import {
  clearPlayerId,
  getPlayerId,
} from "../lib/playerSession";

import { uploadPhoto } from "../lib/photoApi";

import {
  completeChallenge,
  type ChallengeType,
} from "../lib/completionApi";

export default function Game() {
  const game = useGameState();
  const sideChallenges =
    useSideChallenges();
  const pubSubChallenges =
    usePubSubChallenges();

  const players = usePlayers();
  const pubs = usePubs();
  const challenges = useChallenges();

  const navigate = useNavigate();

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const [uploading, setUploading] =
    useState(false);

  const [
    uploadChallenge,
    setUploadChallenge,
  ] = useState<{
    id: string | number;
    title: string;
    points: number;
    type: ChallengeType;
  } | null>(null);

  useEffect(() => {
    if (game?.voting_open === true) {
      navigate("/vote");
    }
  }, [game?.voting_open, navigate]);

  useEffect(() => {
    if (
      game?.show_vote_results === true
    ) {
      navigate("/vote-results");
    }
  }, [
    game?.show_vote_results,
    navigate,
  ]);

  if (!game) {
    return (
      <p>Waiting for bday kween...</p>
    );
  }

  const playerId = getPlayerId();

  const currentPlayer = players.find(
    (player) => player.id === playerId
  );

  const currentPub = game.current_pub;

  const currentChallenge =
    game.current_challenge;

  const currentPubObject = pubs.find(
    (pub) => pub.name === currentPub
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

  const currentPubSubChallenges =
    pubSubChallenges.filter(
      (challenge) =>
        String(challenge.pub_id) ===
        String(currentPubObject?.id)
    );

  async function handlePhotoSelected(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file || !uploadChallenge) {
      return;
    }

    if (!playerId || !currentPlayer) {
      alert(
        "Player session not found. Please rejoin."
      );
      return;
    }

    setUploading(true);

    const { data, error } =
      await uploadPhoto(file, {
        playerId,
        playerName: currentPlayer.name,
        team:
          currentPlayer.team ?? null,
        challenge:
          uploadChallenge.title,
        pub: currentPub,
        points:
          uploadChallenge.points,
      });

    if (error) {
      setUploading(false);
      event.target.value = "";
      setUploadChallenge(null);

      console.error(
        "PHOTO UPLOAD ERROR",
        error
      );

      alert(
        `Upload failed: ${error.message}`
      );
      return;
    }

    const {
      error: completionError,
    } = await completeChallenge({
      playerId,
      challengeType:
        uploadChallenge.type,
      challengeId:
        uploadChallenge.id,
      challengeTitle:
        uploadChallenge.title,
      points:
        uploadChallenge.points,
      photoId: data?.id ?? null,
    });

    setUploading(false);
    event.target.value = "";
    setUploadChallenge(null);

    if (completionError) {
      console.error(
        "COMPLETION ERROR",
        completionError
      );
    }

    alert("Photo uploaded!");
  }

  function chooseUpload(details: {
    id: string | number;
    title: string;
    points: number;
    type: ChallengeType;
  }) {
    setUploadChallenge(details);

    window.setTimeout(() => {
      fileInputRef.current?.click();
    }, 0);
  }

  return (
    <main className="mx-auto min-h-screen max-w-md space-y-6 p-6">
      <header>
        <img
          src={`${import.meta.env.BASE_URL}Title.png`}
          alt="Anna's Chaos Crawl"
          className="mx-auto mb-4 w-full"
        />
      </header>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoSelected}
      />

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
            Waiting for the host to assign
            your team...
          </p>
        </Card>
      )}

      <Card>
        <p className="text-sm">
          📍 Current Pub
        </p>

        <h2 className="text-3xl font-bold">
          {currentPub}
        </h2>
      </Card>

      <Card>
        <p className="text-sm">
          ⭐ Main Mission
        </p>

        <h2 className="mt-2 text-2xl font-bold">
          {currentChallenge}
        </h2>

        <p className="mt-3">
          {game.challenge_description}
        </p>

        {allowPhotoUpload &&
          currentChallengeObject && (
            <div className="mt-4">
              <Button
                type="button"
                disabled={uploading}
                onClick={() =>
                  chooseUpload({
                    id:
                      currentChallengeObject.id,
                    title:
                      currentChallengeObject.title,
                    points:
                      currentChallengeObject.points ??
                      0,
                    type: "main",
                  })
                }
              >
                Upload Photo
              </Button>
            </div>
          )}
      </Card>

      {currentPubSubChallenges.length >
        0 && (
        <Card>
          <h2 className="mb-4 text-2xl font-bold">
            PUB BONUS MISSIONS
          </h2>

          <div className="space-y-4">
            {currentPubSubChallenges.map(
              (challenge) => (
                <div
                  key={challenge.id}
                  className="rounded-2xl border-2 border-pink-500 bg-black/70 p-4"
                >
                  <h3 className="text-xl font-bold">
                    {challenge.title}
                  </h3>

                  {challenge.description && (
                    <p className="mt-2">
                      {
                        challenge.description
                      }
                    </p>
                  )}

                  <p className="mt-2 font-bold">
                    +{challenge.points}
                  </p>

                  <div className="mt-4">
                    <Button
                      type="button"
                      disabled={uploading}
                      onClick={() =>
                        chooseUpload({
                          id:
                            challenge.id,
                          title:
                            challenge.title,
                          points:
                            challenge.points,
                          type: "bonus",
                        })
                      }
                    >
                      Upload Photo
                    </Button>
                  </div>
                </div>
              )
            )}
          </div>
        </Card>
      )}

      <Card>
        <h2 className="mb-4 text-2xl font-bold">
          CHAOS BINGO
        </h2>

        <div className="grid grid-cols-2 gap-3">
          {sideChallenges.map(
            (challenge) => (
              <div
                key={challenge.id}
                className="rounded-2xl border-2 border-pink-500 bg-black/70 p-3"
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
              </div>
            )
          )}
        </div>
      </Card>

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
        onClick={() => {
          clearPlayerId();
          navigate("/");
        }}
      >
        Leave Game
      </Button>
    </main>
  );
}