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

export default function Game() {
  // ALL HOOKS FIRST
  const game = useGameState();
  const sideChallenges = useSideChallenges();
  const pubSubChallenges = usePubSubChallenges();

  const players = usePlayers();
  const pubs = usePubs();
  const challenges = useChallenges();

  const navigate = useNavigate();

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const [uploading, setUploading] =
    useState(false);

  const [uploadChallenge, setUploadChallenge] =
    useState<{
      title: string;
      points: number;
    } | null>(null);

  // Send players to voting when host opens it
  useEffect(() => {
    if (game?.voting_open === true) {
      navigate("/vote");
    }
  }, [game?.voting_open, navigate]);

  // CONDITIONAL RETURN ONLY AFTER ALL HOOKS
  if (!game) {
    return (
      <p>
        Waiting for bday kween...
      </p>
    );
  }

  const currentPub =
    game.current_pub;

  const currentChallenge =
    game.current_challenge;

  const challengeDescription =
    game.challenge_description;

  // Find current pub object
  const currentPubObject = pubs.find(
    (pub) =>
      pub.name === currentPub
  );

  // Find current challenge object
  const currentChallengeObject =
    challenges.find(
      (challenge) =>
        challenge.title === currentChallenge
    );

  // Main challenge only shows upload
  // button when enabled in Supabase
  const allowPhotoUpload =
    currentChallengeObject
      ?.allow_photo_upload === true;

  // Only show sub-challenges
  // belonging to current pub
  const currentPubSubChallenges =
    pubSubChallenges.filter(
      (challenge) =>
        String (challenge.pub_id) ===
        String (currentPubObject?.id)
    );

  async function handlePhotoSelected(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    const playerId =
      getPlayerId();

    if (!playerId) {
      alert(
        "Player session not found. Please rejoin."
      );

      navigate("/");
      return;
    }

    const currentPlayer =
      players.find(
        (player) =>
          player.id === playerId
      );

    if (!currentPlayer) {
      alert(
        "Could not find your player."
      );

      return;
    }

    // If a sub-challenge was selected,
    // use its title and points.
    // Otherwise use the main challenge.
    const challengeTitle =
      uploadChallenge?.title ??
      currentChallenge;

    const challengePoints =
      uploadChallenge?.points ??
      currentChallengeObject?.points ??
      0;

    setUploading(true);

    const { error } =
      await uploadPhoto(
        file,
        {
          playerId,
          playerName:
            currentPlayer.name,

          team:
            currentPlayer.team ??
            null,

          challenge:
            challengeTitle,

          pub:
            currentPub,

          points:
            challengePoints,
        }
      );

    setUploading(false);

    // Allow same file to be
    // selected again later
    event.target.value = "";

    // Reset selected upload challenge
    setUploadChallenge(null);

    if (error) {
      console.error(
        "PHOTO UPLOAD ERROR:",
        error
      );

      alert(
        `Upload failed: ${error.message}`
      );

      return;
    }

    alert(
      "Photo uploaded!"
    );
  }

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

      {/* ONE SHARED HIDDEN FILE INPUT */}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={
          handlePhotoSelected
        }
      />

      {/* CURRENT PUB */}

      <Card>
        <div className="space-y-2">

          <div className="text-sm text-zinc-400">
            📍 Current Pub
          </div>

          <h2 className="text-3xl font-bold">
            {currentPub}
          </h2>

        </div>
      </Card>

      {/* MAIN MISSION */}

      <Card>
        <div className="space-y-4">

          <div className="text-sm text-zinc-400">
            ⭐ Main Mission
          </div>

          <h2 className="text-2xl font-bold">
            {currentChallenge}
          </h2>

          <p>
            {challengeDescription}
          </p>

          {allowPhotoUpload && (
            <Button
              type="button"
              disabled={uploading}
              onClick={() => {
                setUploadChallenge(
                  null
                );

                fileInputRef
                  .current
                  ?.click();
              }}
            >
              {uploading
                ? "Uploading..."
                : "Upload Photo"}
            </Button>
          )}

        </div>
      </Card>

      {/* PUB SUB-CHALLENGES */}

      {currentPubSubChallenges.length >
        0 && (
        <Card>

          <h2 className="mb-4 text-2xl font-bold">
            SIDE MISSIONS
          </h2>

          <div className="space-y-4">

            {currentPubSubChallenges.map(
              (challenge) => (
                <div
                  key={
                    challenge.id
                  }
                  className="rounded-2xl border-2 border-pink-500 bg-black/70 p-4"
                >

                  <div className="flex items-start justify-between gap-3">

                    <div>

                      <h3 className="text-lg font-bold">
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

                    <div className="whitespace-nowrap font-bold text-yellow-400">
                      +
                      {
                        challenge.points
                      }
                    </div>

                  </div>

                  <div className="mt-4">

                    <Button
                      type="button"
                      disabled={
                        uploading
                      }
                      onClick={() => {
                        setUploadChallenge({
                          title:
                            challenge.title,

                          points:
                            challenge.points,
                        });

                        fileInputRef
                          .current
                          ?.click();
                      }}
                    >
                      {uploading
                        ? "Uploading..."
                        : "Upload Photo"}
                    </Button>

                  </div>

                </div>
              )
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
            (SideChallenge) => (
              <div
                key={SideChallenge.id}
                className="rounded-2xl border-2 border-pink-500 bg-black/70 p-3"
              >

                <div className="text-lg font-bold leading-tight">
                  {
                    SideChallenge.title
                  }
                </div>

                <p className="mt-2 text-sm text-zinc-300">
                  {
                    SideChallenge.description
                  }
                </p>

                <div className="mt-3 font-bold text-yellow-400">
                  +
                  {
                    SideChallenge.points
                  }
                </div>

              </div>
            )
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
          navigate("/");
        }}
      >
        Leave Game
      </Button>

    </main>
  );
}